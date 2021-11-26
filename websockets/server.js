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

const sockets = {};
const messages = {};
const ws = new WebSocketServer({ server }, () =>
  console.log("Listening on port 8080")
);

ws.on("connection", (socket) => {
  socket.id = Date.now();
  sockets[socket.id] = socket;
  const event = {
    id: Date.now(),
    type: "CONNECTED",
    payload: { socketId: socket.id },
  };
  socket.send(JSON.stringify(event));
  messages[event.id] = setTimeout(() => {
    if (messages[event.id]) {
      console.error("socket timeout");
    }
  }, 2000);

  socket.on("message", (event) => {
    event = JSON.parse(event);
    console.log(event);
    switch (event.type) {
      case "ACK":
        clearTimeout(messages[event.id]);
        delete messages[event.id];
        break;
    }
  });
});

server.listen(8080, () => console.log("Server is listening"));
