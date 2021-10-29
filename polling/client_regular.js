const notifs = [];
let lastModified = null;

function grabNotifs() {
  return fetch("http://localhost:3000/notifications")
    .then(function (response) {
      lastModified = response.headers.get("Last-Modified");
      return response.json();
    })
    .then(function (data) {
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
    });
}

function checkNotif() {
  const headers = new Headers();
  if (lastModified) {
    headers.set("If-Modified-Since", lastModified);
  }
  fetch("http://localhost:3000/notifications", {
    method: "HEAD",
    headers,
  }).then(function (response) {
    if (response.status === 200) {
      return grabNotifs();
    }
  });
}

setInterval(checkNotif, 1000);
