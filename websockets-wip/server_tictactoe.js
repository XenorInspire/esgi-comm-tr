const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const fs = require("fs/promises");
const { constants } = require("fs");

const server = createServer(function (req, res) {
  fs.access("." + req.url, constants.R_OK)
    .then(() => fs.readFile("." + req.url))
    .then((data) => {
      if (req.url.endsWith(".html")) {
        res.writeHead(200, { "Content-Type": "text/html" });
      }
      if (req.url.endsWith(".js")) {
        res.writeHead(200, {
          "Content-Type": "application/javascript; charset=utf-8",
        });
      }
      res.write(data);
      res.end();
    })
    .catch(() => res.writeHead(404));
});

const players = {};
/**
 * {
 *   [username]: socket
 * }
 */
const boards = [];
/**
 * Board {
 *  id,
 *  moves,
 *  players,
 *  turn,
 *  [winner]
 * }
 */

const ws = new WebSocketServer({ server }, () =>
  console.log("Listening on port 8080")
);

ws.on("connection", (socket) => {
  console.log("New socket accepted");
  socket.on("message", (event) => {
    event = JSON.parse(event);
    console.log(event);
    switch (event.type) {
      case "JOIN":
        const username = event.payload;
        players[username] = socket;
        broadcastEvent({
          type: "PLAYER_JOINED",
          payload: username,
        });
        addPlayerToBoard(username);
        break;
    }
  });
});

function addPlayerToBoard(username) {
  let board = boards.find((b) => b.players.length === 1);
  if (!board) {
    board = {
      id: Date.now(),
      moves: Array.from([new Array(3), new Array(3), new Array(3)]),
      players: [username],
      turn: 0,
    };
    boards.push(board);
  } else {
    board.players.push(username);
  }
  broadcastBoardEvent(board, {
    type: "JOINED_BOARD",
    payload: username,
  });
  if (board.players.length === 2) {
    broadcastBoardEvent(board, {
      type: "MATCH_START",
    });
  }
}

function broadcastEvent(event) {
  Object.entries(players).forEach(([username, socket]) => {
    if (event.payload !== username) {
      socket.send(JSON.stringify(event));
    }
  });
}
function broadcastBoardEvent(board, event) {
  board.players.forEach((username) => {
    players[username].send(JSON.stringify({ ...event, board }));
  });
}

server.listen(8080, () => console.log("Server is listening"));
