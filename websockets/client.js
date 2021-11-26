// Create WebSocket connection.
const socket = new WebSocket("ws://localhost:8080");

socket.onmessage = (event) => {
  console.log(event);
  document.write(event.data);
  event = JSON.parse(event.data);
  socket.send(JSON.stringify({ type: "ACK", id: event.id }));
};
