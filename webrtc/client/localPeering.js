const servers = null;

const caller = new RTCPeerConnection(servers);
const callee = new RTCPeerConnection(servers);

caller.addEventListener("icecandidate", (e) => {
  if (!e.candidate) return;
  console.log("caller icecandidate event: ", e.candidate);
  callee.addIceCandidate(e.candidate).catch(console.error);
});

callee.addEventListener("icecandidate", (e) => {
  if (!e.candidate) return;
  console.log("callee icecandidate event: ", e.candidate);
  caller.addIceCandidate(e.candidate).catch(console.error);
});

const callerChannel = caller.createDataChannel("channel-1");
callerChannel.addEventListener("open", () => {
  console.log("connection ready to chat");
  callerChannel.send("Hello from caller");
});
callerChannel.addEventListener("message", (e) => {
  console.log("callerChannel message:", e.data);
});

// Gestion du flux de données
callee.addEventListener("datachannel", (e) => {
  const channel = e.channel;
  channel.addEventListener("message", (e) => {
    console.log("callee received: ", e.data);
  });
  channel.addEventListener("open", () => {
    console.log("connection ready to chat");
    channel.send("Hello from callee");
  });
});

// Gestion du flux video
const originalVideo = document.getElementById("originalVideo");
const duplicateVideo = document.getElementById("duplicateVideo");
const originalStream = originalVideo.captureStream();
callee.addEventListener("track", (e) => {
  console.log("callee track event: ", e);
  duplicateVideo.srcObject = e.streams[0];
  duplicateVideo.play();
});

document.getElementById("startButton").addEventListener("click", () => {
  originalVideo.play();
  caller.addTrack(originalStream.getVideoTracks()[0], originalStream);
  caller
    .createOffer()
    .then((offer) => caller.setLocalDescription(offer))
    .then(() => {
      console.log("caller setLocalDescription complete");
      return callee.setRemoteDescription(caller.localDescription);
    })
    .then(() => {
      console.log("callee setRemoteDescription complete");
      return callee.createAnswer();
    })
    .then((answer) => callee.setLocalDescription(answer))
    .then(() => {
      console.log("callee setLocalDescription complete");
      return caller.setRemoteDescription(callee.localDescription);
    })
    .then(() => {
      console.log("caller setRemoteDescription complete");
    })
    .catch(console.error);
});
document.getElementById("pauseButton").addEventListener("click", () => {
  originalVideo.pause();
});
