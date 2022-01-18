const express = require("express");
const cors = require("cors");
const server = express();

server.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
server.use(express.json());

const subscribers = {};
const match = { players: [], turns: [] };

server.post("/move", (req, res) => {
  const move = req.body;
  match.turns[move.turn] ??= { id: move.turn };
  match.turns[move.turn][move.username] = move.move;
  broadcast({ type: "move", username: move.username });
  if (
    Object.keys(match.turns[move.turn]).filter(
      (key) => !["id", "winner"].includes(key)
    ).length === match.players.length
  ) {
    const result = checkTurnWinner(match.turns[move.turn]);
    broadcast({
      type: "turnWinner",
      turn: match.turns[move.turn],
      username: result,
    });
    match.turns[move.turn].winner = result;
    res.sendStatus(202);

    if (match.turns.length === 4) {
      broadcast({ type: "gameOver", winner: checkMatchWinner(match) });
    } else {
      broadcast({ type: "newTurn", turn: match.turns.length });
    }
  }
});

server.get("/subscribe", (req, res) => {
  const { username } = req.query;
  subscribers[username] = res;
  res.on("close", () => {
    delete subscribers[username];
  });

  console.log(`${username} subscribed`);

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);

  broadcast({ type: "userconnect", username });
  match.players.push(username);

  if (Object.keys(subscribers).length === 2) {
    broadcast({ type: "gameStart", players: match.players });
    match.turns = [];
    broadcast({ type: "newTurn", turn: 1 });
  }
});

const convertMessage = ({ type, ...data }) => {
  return `event: ${type}\n` + `data: ${JSON.stringify(data)}\n\n`;
};

const broadcast = (message) => {
  for (let client of Object.values(subscribers)) {
    client.write(convertMessage(message));
  }
};

const checkTurnWinner = (turn) => {
  const players = Object.keys(subscribers);
  if (turn[players[0]] === "rock" && turn[players[1]] === "paper") {
    return players[1];
  }
  if (turn[players[0]] === "paper" && turn[players[1]] === "rock") {
    return players[0];
  }
  if (turn[players[0]] === "rock" && turn[players[1]] === "scissors") {
    return players[0];
  }
  if (turn[players[0]] === "scissors" && turn[players[1]] === "rock") {
    return players[1];
  }
  if (turn[players[0]] === "paper" && turn[players[1]] === "scissors") {
    return players[1];
  }
  if (turn[players[0]] === "scissors" && turn[players[1]] === "paper") {
    return players[0];
  }
  return "draw";
};

const checkMatchWinner = (match) => {
  const winner = match.turns.reduce(
    (acc, turn) => {
      acc[turn.winner]++;
      return acc;
    },
    Object.keys(subscribers).reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      { draw: 0 }
    )
    // => {player1: 0, player2: 0, draw: 0}
    // => {test: 0, foobar: 0, draw: 0}
  );
  // => {player1: 1, player2: 1, draw: 1}
  // => {test: 1, foobar: 2, draw: 0}
  const winnerResult = {
    value: 0,
  };
  for (let key in winner) {
    if (winner[key] > winnerResult.value) {
      winnerResult.value = winner[key];
      winnerResult.name = key;
    }
  }

  return winnerResult.name === "draw" ? null : winnerResult.name;
};

server.listen(3000, () => console.log("Server is listening"));

// Events
// userconnect: {username: "..."}
// gameStart: {} => Afficher le plateau
// newTurn: {turn: turnId} => Afficher id du tour
// move: {username: "..."} => Afficher indicateur joueur à donner son coup
// turnWinner: {username: "...", turn: turn} => Afficher gagnant du tour dans tableau des scores
// gameOver: { winner: "..."} => Afficher gagnant, couper le plateau
