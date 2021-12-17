document.getElementById("join").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const eventSource = new EventSource(
    "http://localhost:3000/subscribe?username=" + data.get("username")
  );

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
  });

  eventSource.onmessage = (e) => {
    console.log(e);
  };
});
