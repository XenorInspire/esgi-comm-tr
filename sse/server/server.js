const express = require("express");
const cors = require("cors");
const server = express();

server.use(cors());
server.use(express.json());

const subscribers = {};
const match = { players: [], turns: [] };

server.post("/move", (req, res) => {});

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

server.listen(3000, () => console.log("Server is listening"));

// Events
// userconnect: {username: "..."}
// gameStart: {} => Afficher le plateau
// newTurn: {turn: turnId} => Afficher id du tour
// move: {username: "..."} => Afficher indicateur joueur à donner son coup
// turnWinner: {username: "...", turn: turnId} => Afficher gagnant du tour dans tableau des scores
// gameOver: {username: "...", winner: "..."} => Afficher gagnant, couper le plateau
