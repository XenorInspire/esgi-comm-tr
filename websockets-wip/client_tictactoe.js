// Create WebSocket connection.
const form = document.getElementById("register");
const socket = new WebSocket("ws://localhost:8080");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const username = data.get("username");
  socket.send(
    JSON.stringify({
      type: "JOIN",
      payload: username,
    })
  );
});

socket.onmessage = (event) => {
  event = JSON.parse(event.data);
  switch (event.type) {
    case "JOINED_BOARD":
      generateUserList(event.board);
      break;
    case "MATCH_START":
      updateBoard(event.board);
      updateCurrentPlayer(event.board);
      break;
  }
};

function generateUserList(board) {
  const ul = document.createElement("ul");
  board.players.forEach((p) => {
    const li = document.createElement("li");
    const text = document.createTextNode(p);
    li.appendChild(text);
    ul.appendChild(li);
  });

  const divP = document.getElementById("players");
  if (divP.firstChild) {
    divP.replaceChild(ul, divP.firstChild);
  } else {
    divP.appendChild(ul);
  }
}

function updateCurrentPlayer(board) {
  const h3 = document.createElement("h3");
  const text = document.createTextNode(board.players[board.turn]);
  h3.appendChild(text);

  const divP = document.getElementById("current");
  if (divP.firstChild) {
    divP.replaceChild(h3, divP.firstChild);
  } else {
    divP.appendChild(h3);
  }
}

function updateBoard(board) {
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  board.moves.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((column) => {
      const td = document.createElement("td");
      const text = document.createTextNode(column);
      td.style.border = "1px solid black";
      td.style.width = "50px";
      td.style.height = "50px";
      td.appendChild(text);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  const divP = document.getElementById("board");
  if (divP.firstChild) {
    divP.replaceChild(table, divP.firstChild);
  } else {
    divP.appendChild(table);
  }
}
