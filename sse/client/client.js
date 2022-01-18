let username = "";
let currentTurn = null;
document.getElementById("join").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const eventSource = new EventSource(
    "http://localhost:3000/subscribe?username=" + data.get("username"),
    {
      withCredentials: true,
    }
  );
  username = data.get("username");
  eventSource.addEventListener("gameStart", (e) => {
    document.getElementById("game").style.display = "block";
    const ul = document.createElement("ul");
    for (let player of JSON.parse(e.data).players) {
      const li = document.createElement("li");
      const text = document.createTextNode(player);
      li.appendChild(text);
      ul.appendChild(li);
    }
    const userListing = document.getElementById("players");
    userListing.replaceChild(ul, userListing.firstChild);
  });

  eventSource.addEventListener("newTurn", (e) => {
    const turns = document.getElementById("turns");
    const li = document.createElement("li");
    const text = document.createTextNode(JSON.parse(e.data).turn);
    li.setAttribute("id", JSON.parse(e.data).turn);
    li.appendChild(text);
    turns.appendChild(li);
    document.getElementById("movesBoard").style.display = "block";
    currentTurn = JSON.parse(e.data).turn;
  });

  eventSource.addEventListener("turnWinner", (e) => {
    const turns = document.getElementById("turns");
    const event = JSON.parse(e.data);
    const movesAsString = Object.keys(event.turn)
      .filter((key) => !["id", "winner"].includes(key))
      .map((player) => {
        return player + ": " + event.turn[player];
      })
      .join(" / ");
    const text = document.createTextNode(
      `${event.turn.id} - ${movesAsString} - ${event.username} wins!`
    );
    const li = document.createElement("li");
    li.appendChild(text);
    turns.replaceChild(li, turns.childNodes[event.turn.id - 1]);
  });

  eventSource.addEventListener("gameOver", (e) => {
    const turns = document.getElementById("turns");
    const event = JSON.parse(e.data);
    const text = document.createTextNode(`Game over! ${event.winner} wins!`);
    const li = document.createElement("li");
    li.appendChild(text);
    turns.appendChild(li);
    document.getElementById("movesBoard").style.display = "none";
  });

  eventSource.onmessage = (e) => {
    console.log(e);
  };
});

document.getElementById("movesBoard").addEventListener("click", (e) => {
  const moveTurn = parseInt(
    document.getElementById("turns").lastChild.textContent
  );
  const move = {
    username,
    move: e.target.id,
    turn: moveTurn,
  };
  fetch("http://localhost:3000/move", {
    method: "POST",
    body: JSON.stringify(move),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(
    () =>
      moveTurn === currentTurn &&
      (document.getElementById("movesBoard").style.display = "none")
  );
});
