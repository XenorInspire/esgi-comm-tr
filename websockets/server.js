const { SocketAddress } = require("net");
const { WebSocketServer } = require("ws");

const sockets = {};
const messages = {};
const server = new WebSocketServer({ port: 8080 }, () =>
  console.log("Listening on port 8080")
);

server.on("connection", (socket) => {
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
