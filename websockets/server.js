const { WebSocketServer } = require("ws");
const players = {};
const boards = [];
const wss = new WebSocketServer({ port: 8080 }, () =>
  console.log("Listening on port 8080")
);

wss.on("connection", function connection(socket) {
  socket.on("message", function message(data) {
    console.log("received: %s", data);
    data = JSON.parse(data);
    manageEvent(data, socket);
  });

  socket.send(JSON.stringify({ type: "CONNECTED" }));
});

function manageEvent(event, socket) {
  switch (event.type) {
    case "JOIN":
      players[event.username] = socket;
      broadcastEvent({ ...event, type: "JOINED" });
      return addToAvailableBoard(event.username);
    case "MOVE":
      const board = boards.find((b) => b.id === event.board);
      if (!board)
        return sendPlayerEvent(event.username, {
          error: "board_not_found",
          type: "ERROR",
        });
      if (board.winner)
        return sendPlayerEvent(event.username, {
          error: "board_match_ended",
          type: "ERROR",
        });
      if (event.username !== board.players[board.turn])
        return sendPlayerEvent(event.username, {
          error: "invalid_player",
          type: "ERROR",
        });
      if (
        board.moves[event.x][event.y] ||
        event.x < 0 ||
        event.x > 2 ||
        event.y < 0 ||
        event.x > 2
      )
        return sendPlayerEvent(event.username, {
          error: "invalid_move",
          type: "ERROR",
        });
      const row = board.moves[event.x];
      row[event.y] = event.username;
      board.turn = (board.turn + 1) % 2;
      sendBoardEvent(board, { board, type: "PLAYER_MOVED" });
      const winner = checkWinnerBoard(board, event);
      if (winner) {
        board.winner = winner;
        return sendBoardEvent(board, { board, type: "MATCH_END" });
      }
  }
}
function checkWinnerBoard(board, event) {
  //check line
  if (board.moves[event.x].filter((m) => m === event.username).length === 3)
    return event.username;
  let checkColumn = false;
  for (let i = 0; i < board.moves.length; i++) {
    if (board.moves[i][event.y] === event.username) {
      checkColumn = true;
    } else {
      checkColumn = false;
      break;
    }
  }
  if (checkColumn) return event.username;
  let checkDiago = false;
  // Check diago left
  for (let i = 0; i < board.moves.length; i++) {
    if (board.moves[i][i] === event.username) {
      checkDiago = true;
    } else {
      checkDiago = false;
      break;
    }
  }
  if (checkDiago) return event.username;
  // check diago right
  for (let i = 0; i < board.moves.length; i++) {
    if (board.moves[i][board.moves.length - i - 1] === event.username) {
      checkDiago = true;
    } else {
      checkDiago = false;
      break;
    }
  }
  if (checkDiago) return event.username;
  if (
    board.moves.reduce(
      (acr, r) => acr + r.reduce((acc, c) => acc + Boolean(c), 0),
      0
    ) === 9
  )
    return "draw";
  return false;
}

function broadcastEvent(event) {
  Object.entries(players).forEach(
    ([username, socket]) =>
      username !== event.username && socket.send(JSON.stringify(event))
  );
}
function sendBoardEvent(board, event) {
  board.players.forEach((p) => players[p].send(JSON.stringify(event)));
}
function sendPlayerEvent(username, event) {
  players[username].send(JSON.stringify(event));
}

function addToAvailableBoard(username) {
  const availableBoards = boards.filter((b) => !b.isCompleted);
  let board;
  if (!availableBoards.length) {
    board = {
      id: Date.now(),
      isCompleted: false,
      players: [username],
      moves: [...new Array(3)].map(() => new Array(3)),
    };
    boards.push(board);
  } else {
    board = availableBoards[0];
    board.players.push(username);
    board.isCompleted = true;
    board.turn = 0;
  }
  sendBoardEvent(board, { board, username, type: "JOINED_BOARD" });
  if (board.isCompleted) sendBoardEvent(board, { board, type: "MATCH_START" });
}
