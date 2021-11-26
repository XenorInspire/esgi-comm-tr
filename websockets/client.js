const socket = new WebSocket("ws://localhost:8080");
let username;
socket.onopen = (event) => console.log("open", event);
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case "JOINED_BOARD":
      generateUserList(data.board.players);
      break;
    case "MATCH_START":
    case "PLAYER_MOVED":
      updateBoard(data.board);
      updateCurrentPlayer(data.board);
      break;
    case "MATCH_END":
      displayWinner(data.board.winner);
      break;
  }
};
socket.onclose = (event) => console.log("close", event);

document.getElementById("join").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  socket.send(JSON.stringify({ type: "JOIN", username: data.get("username") }));
  username = data.get("username");
});

function generateUserList(players) {
  const ul = document.createElement("ul");
  players.forEach((i) => {
    const li = document.createElement("li");
    const text = document.createTextNode("- " + i);
    li.appendChild(text);
    ul.appendChild(li);
  });
  const userListDiv = document.getElementById("userList");
  if (userListDiv.firstChild) {
    userListDiv.replaceChild(ul, userListDiv.firstChild);
  } else {
    userListDiv.appendChild(ul);
  }
}

function updateCurrentPlayer(board) {
  const turnDiv = document.getElementById("turnDisplay");
  const text = document.createTextNode(board.players[board.turn] + " turns");
  if (turnDiv.firstChild) {
    turnDiv.replaceChild(text, turnDiv.firstChild);
  } else {
    turnDiv.appendChild(text);
  }
}

function displayWinner(winner) {
  const turnDiv = document.getElementById("winnerDisplay");
  const text = document.createTextNode(
    winner !== "draw" ? "Winner: " + winner : winner
  );
  if (turnDiv.firstChild) {
    turnDiv.replaceChild(text, turnDiv.firstChild);
  } else {
    turnDiv.appendChild(text);
  }
}

function updateBoard(board) {
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  for (let i = 0; i < board.moves.length; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < board.moves[i].length; j++) {
      const td = document.createElement("td");
      const text = document.createTextNode(board.moves[i][j] ?? "");
      td.style.border = "1px solid black";
      td.style.width = "50px";
      td.style.height = "50px";
      td.appendChild(text);
      tr.appendChild(td);
      td.addEventListener("click", (e) => {
        socket.send(
          JSON.stringify({
            type: "MOVE",
            board: board.id,
            username,
            x: i,
            y: j,
          })
        );
      });
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const boardDiv = document.getElementById("board");
  if (boardDiv.firstChild) {
    boardDiv.replaceChild(table, boardDiv.firstChild);
  } else {
    boardDiv.appendChild(table);
  }
}
