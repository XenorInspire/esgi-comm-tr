const { WebSocketServer } = require("ws");
const users = {};
const rtcConnections = {};
const wss = new WebSocketServer({ port: 8080 }, () =>
  console.log("Listening on port 8080")
);

wss.on("connection", function connection(socket) {
  const userId = Date.now();
  const others = Object.keys(users);
  users[userId] = socket;
  socket.on("message", function message(data) {
    console.log("received: %s", data);
    data = JSON.parse(data);
    manageEvent(data, userId);
  });

  socket.send(
    JSON.stringify({
      type: "CONNECTED",
      userId,
      contacts: others,
    })
  );
  broadcastEvent({ type: "USER_JOINED", userId });
});

function manageEvent({ type, data: event }, userId) {
  switch (type) {
    case "NEW_CANDIDATE":
      rtcConnections[event.connectionId] = {
        ...(rtcConnections[event.connectionId] || {}),
        from: userId,
        to: event.to,
        fromCandidate: event.candidate,
      };
      sendUserEvent(event.to, {
        type: "NEW_CANDIDATE",
        from: userId,
        to: event.to,
        fromCandidate: event.candidate,
        connectionId: event.connectionId,
      });
      break;
    case "NEW_CANDIDATE_RETURN":
      rtcConnections[event.connectionId] = {
        ...(rtcConnections[event.connectionId] || {}),
        toCandidate: event.candidate,
      };
      sendUserEvent(event.from, {
        type: "NEW_CANDIDATE_RETURN",
        toCandidate: event.candidate,
        connectionId: event.connectionId,
      });
      break;
    case "NEW_OFFER":
      rtcConnections[event.connectionId] = {
        ...(rtcConnections[event.connectionId] || {}),
        from: userId,
        to: event.to,
        offer: event.offer,
      };
      sendUserEvent(event.to, {
        type: "NEW_OFFER",
        offer: event.offer,
        from: userId,
        connectionId: event.connectionId,
      });
      break;
    case "NEW_ANSWER":
      rtcConnections[event.connectionId] = {
        ...(rtcConnections[event.connectionId] || {}),
        answer: event.answer,
      };
      sendUserEvent(rtcConnections[event.connectionId].from, {
        type: "NEW_ANSWER",
        answer: event.answer,
        connectionId: event.connectionId,
      });
      break;
  }
}
function broadcastEvent(event) {
  Object.entries(users).forEach(
    ([username, socket]) =>
      username !== event.userId && socket.send(JSON.stringify(event))
  );
}
function sendUserEvent(username, event) {
  users[username].send(JSON.stringify(event));
}
