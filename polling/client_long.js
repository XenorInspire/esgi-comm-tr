const notifs = [];
let lastModified = null;

function mountNotifs(data) {
  const newNotifs = data.filter(function (notif) {
    return !notifs.find(function (item) {
      return item.date === notif.date;
    });
  });

  const table = document.getElementById("notifTable");
  newNotifs.forEach(function (notif) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.textContent = notif.title;
    tr.appendChild(td);
    table.appendChild(tr);
    notifs.push(notif);
  });
  document.getElementById("notifCount").textContent = ` (${notifs.length})`;
}

async function polling() {
  const response = await fetch("http://localhost:3000/notifications_sub");
  const data = await response.json();
  mountNotifs(data);
  polling();
}

polling();

// t0 = req1 => 300ms
// t1 = req2 => 500ms
// t2 = req3 => 4s
// t3 = req4 => 300ms
// t4
// t5
// t6 = req7 => 500ms

// req4 => 4notifs
// req5 => 4notifs
// req6 => 5notifs
// req3 => 3notifs
// req7 => 5notifs
