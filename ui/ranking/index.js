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
    .then((users) => {
      users.forEach(renderUser);
    });
}

function getUsers () {
  return data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .get('users');
}

function renderUser(userStats, index) {
	let row = userTable.insertRow(-1);

  let positionCell = row.insertCell(0);
  positionCell.innerHTML = index+1;

  let nameCell = row.insertCell(1);
  nameCell.innerHTML = userStats.email;

  let pointsCell = row.insertCell(2);
  pointsCell.innerHTML = userStats.correctAnswers;
}

main();
