import SignalChannel from "./SignalChannel.js";

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};
let currentUser;
let contacts;
let connection;
let connectionInfos = {
  isCaller: false,
};
let chatChannel;

// Création de la connexion (Singleton)
const getConnection = function () {
  if (connection) return;
  connection = new RTCPeerConnection(servers);
  connection.onicecandidate = handleICECandidate;
  connection.onnegotiationneeded = handleNegotiationNeeded;

  return connection;
};

// Binding des events pour le data channel
const prepareChatChannel = function (channel) {
  channel.addEventListener("open", () => {
    console.log("connection ready to chat");
    channel.send("Hello");
  });
  channel.addEventListener("message", (e) => {
    console.log("channel message:", e.data);
    if (e.data === "Hello") {
      channel.send("Hello back");
    }
  });
};
const handleICECandidate = function (event) {
  if (event.candidate) {
    const obj = {
      candidate: event.candidate,
      connectionId: connectionInfos.connectionId,
    };
    if (connectionInfos.isCaller) {
      signalChannel.send("NEW_CANDIDATE", {
        ...obj,
        to: connectionInfos.to,
      });
    } else {
      signalChannel.send("NEW_CANDIDATE_RETURN", {
        ...obj,
        from: connectionInfos.from,
      });
    }
  }
};

const handleNegotiationNeeded = function (event) {
  if (connection.signalingState != "stable") {
    console.log("     -- The connection isn't stable yet; postponing...");
    return;
  }
  connection
    .createOffer()
    .then((offer) => connection.setLocalDescription(offer))
    .then(() => {
      return signalChannel.send("NEW_OFFER", {
        offer: connection.localDescription,
        to: connectionInfos.to,
        connectionId: connectionInfos.connectionId,
      });
    })
    .catch((e) => console.error(e));
};

// Initialisation de l'app (contact list)
function updateContactList() {
  const contactList = document.getElementById("contact-list");
  const ul = document.createElement("ul");
  contacts.forEach((c) => {
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(c));
    ul.appendChild(li);
    li.addEventListener("click", () => {
      call(c);
    });
  });
  contactList.appendChild(ul);
}

const signalChannel = new SignalChannel(`ws://${location.hostname}:8080`);

// Réception du UserID ainsi que la liste des contacts déjà connectés au serveur de signalement
signalChannel.addEventListener(
  "CONNECTED",
  ({ userId, contacts: contactsReceived }) => {
    console.log("CONNECTED", userId, contacts);
    currentUser = userId;
    contacts = contactsReceived;
    updateContactList();
  }
);
// Nouveau contact connecté au serveur de signalement
signalChannel.addEventListener("USER_JOINED", ({ userId }) => {
  console.log("USER_JOINED", userId);
  if (userId !== currentUser) {
    contacts.push(userId);
    updateContactList();
  }
});
signalChannel.addEventListener("NEW_OFFER", ({ from, offer, connectionId }) => {
  getConnection();
  connectionInfos = {
    connectionId,
    isCaller: false,
    to: currentUser,
    from,
  };

  connection
    .setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      connection.ondatachannel = (e) => {
        prepareChatChannel(e.channel);
      };
      return connection.createAnswer();
    })
    .then((answer) => connection.setLocalDescription(answer))
    .then(() => {
      return signalChannel.send("NEW_ANSWER", {
        answer: connection.localDescription,
        connectionId,
      });
    })
    .catch((e) => console.error(e));
});

signalChannel.addEventListener("NEW_ANSWER", ({ answer }) => {
  connection.setRemoteDescription(new RTCSessionDescription(answer));
});
signalChannel.addEventListener("NEW_CANDIDATE", ({ fromCandidate }) => {
  connection.addIceCandidate(new RTCIceCandidate(fromCandidate));
});
signalChannel.addEventListener("NEW_CANDIDATE_RETURN", ({ toCandidate }) => {
  connection.addIceCandidate(new RTCIceCandidate(toCandidate));
});

function call(remote) {
  connectionInfos = {
    connectionId: `${currentUser}-${remote}`,
    isCaller: true,
    from: currentUser,
    to: remote,
  };
  getConnection();
  chatChannel = connection.createDataChannel("channel-1");
  prepareChatChannel(chatChannel);
}
