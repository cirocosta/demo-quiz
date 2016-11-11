'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const ELEMS = {
  userTable: document.getElementById('user-ranking')
};

let auth = WeDeploy.auth(`auth.${DOMAIN}`);


function main() {
  if (!auth.currentUser) {
    window.location = "/login";
    return;
  }

  getUsers()
    .then(renderTable)
    .then(watchUsers);
}

function getUsers() {
  return WeDeploy
    .data(`auth.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .get('users');
}

function watchUsers() {
  WeDeploy
    .data(`auth.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .watch('users')
    .on('changes', renderTable);
}

function renderTable(users) {
  ELEMS.userTable.innerHTML = users
    .reduce((acum, curr, ndx) =>
      acum + createUserRow(curr, ndx), "");
}

function createUserRow(userStats, index) {
  let { name, email, correctAnswers } = userStats;

  return `
    <tr>
      <td>${index + 1}</td>
      <td>${name ? name : email}</td>
      <td>${correctAnswers || 0}</td>
    </tr>`;
}

main();
