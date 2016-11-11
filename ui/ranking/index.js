'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
const data = WeDeploy.data(`data.${DOMAIN}`);
const userTable = document.getElementById('user-ranking');


function main() {
  if (!auth.currentUser) {
    window.location = "/login";
    return;
  }

  getUsers()
    .then(renderTable)
    .then(watchUsers);
}

function watchUsers () {
  data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .watch('users')
    .on('changes', (users) => {
      renderTable(users);
    });
}

function getUsers () {
  return data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .get('users');
}

function renderTable (users) {
  let tableBody = users.reduce((acumulated, current, index) => {
    return acumulated + renderUser(current, index);
  }, "");

  userTable.innerHTML = tableBody;
}


function renderUser(userStats, index) {
  let { email, correctAnswers } = userStats;

  return `
    <tr>
      <td>${index + 1}</td>
      <td>${email}</td>
      <td>${correctAnswers}</td>
    </tr>`;
}

main();
