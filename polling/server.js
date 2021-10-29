const express = require("express");
const cors = require("cors");
const server = express();

server.use(cors());
server.use(express.json());

const notifications = [];
const subscribers = [];
let lastNotifDate = null;

server.head("/notifications", (request, response) => {
  const lastModified = request.headers["if-modified-since"];
  console.log(typeof lastModified, typeof lastNotifDate);
  if (parseInt(lastModified) === lastNotifDate) {
    response.sendStatus(304);
  } else {
    response.sendStatus(200);
  }
});

server.get("/notifications", (request, response) => {
  if (lastNotifDate) response.setHeader("Last-Modified", lastNotifDate);
  response.json(notifications);
});

server.get("/notifications_sub", (request, response) => {
  const id = Date.now();

  subscribers[id] = response;
  console.log("new subscriber", Object.values(subscribers).length);
  request.on("end", function () {
    console.log("remove subscriber", Object.values(subscribers).length);
    delete subscribers[id];
  });
});

server.post("/notifications", (request, response) => {
  const notif = {
    title: request.body.title,
    date: Date.now(),
  };
  notifications.push(notif);
  lastNotifDate = notif.date;
  response.setHeader("Last-Modified", lastNotifDate);
  for (let subscriber of Object.values(subscribers)) {
    subscriber.json([notif]);
  }
  response.json(notif);
});

server.listen(3000, () => console.log("Server is listening"));
