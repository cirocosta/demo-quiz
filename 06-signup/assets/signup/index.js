'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const alert = document.getElementById('alert');


function submitForm() {
  return showAlertEmailAlreadyInUse();
}

function showAlertEmailAlreadyInUse() {
  alert.innerHTML = `
    <p>Email already in use. Try another email.</p>
    <button>
      <span class="close icon-12-close-short" onclick="closeAlert()"></span>
    </button>`;

  alert.classList.add('visible');
}


function closeAlert() {
  alert.classList.remove('visible');
}
