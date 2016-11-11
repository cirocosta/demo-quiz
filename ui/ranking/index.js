'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const ELEMS = {
  userTable: document.getElementById('user-ranking')
};

let auth = WeDeploy.auth(`auth.${DOMAIN}`);
let data = WeDeploy.data(`data.${DOMAIN}`);


function main() {
  if (!auth.currentUser) {
    window.location = "/login";
    return;
  }

  getUsers()
    .then(renderTable)
    .then(watchUsers);
}

function watchUsers() {
  data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .watch('users')
    .on('changes', (users) => {
      renderTable(users);
    });
}

function getUsers() {
  return data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .get('users');
}

function renderTable(users) {
  ELEMS.userTable.innerHTML = users
    .reduce((acum, curr, ndx) =>
      acum + createUserRow(curr, ndx), "");
}


function createUserRow(userStats, index) {
  let { email, correctAnswers } = userStats;

  return `
    <tr>
      <td>${index + 1}</td>
      <td>${email}</td>
      <td>${correctAnswers}</td>
    </tr>`;
}

main();
