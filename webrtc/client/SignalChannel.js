function SignalChannel(url) {
  const socket = new WebSocket(url);
  const eventListeners = {};

  this.addEventListener = function (event, callback) {
    eventListeners[event] = callback;
  };

  socket.onmessage = (e) => {
    const { type, ...rest } = JSON.parse(e.data);
    eventListeners?.[type](rest);
  };

  this.send = function (type, data) {
    socket.send(JSON.stringify({ type, data }));
  };
}

export default SignalChannel;
