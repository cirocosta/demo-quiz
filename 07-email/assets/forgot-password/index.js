'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
\const alert = document.getElementById('alert');

function resetPassword() {
  showAlertEmailSent();
}

function showAlertEmailSent() {
  alert.innerHTML = `
    <p>An email with instructions to reset password should arrive in a few minutes.</p>
    <button>
      <span class="close icon-12-close-short" onclick="closeAlert()"></span>
    </button>`;

  alert.classList.add('visible');
}

function closeAlert() {
  location.href = '/login';
}
