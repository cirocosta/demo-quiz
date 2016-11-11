'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
const alert = document.getElementById('alert');


function submitForm() {
  const password = signUp.password.value;
  const email = signUp.email.value;

  return auth
    .createUser({
      name: signUp.name.value,
      email,
      password,
    })
    .then((user) => {
      signInWithEmailAndPassword(email, password);
    }).catch(() => {
      showAlertEmailAlreadyInUse();
      signUp.reset();
    });
}

function signInWithEmailAndPassword(email, password) {
  return auth
    .signInWithEmailAndPassword(email, password)
    .then(() => signUp.reset())
    .catch(() => {
      showAlertWrongEmailOrPassword();
      signUp.reset();
    });
}

function showAlertEmailAlreadyInUse() {
  alert.innerHTML = `
    <p>Email already in use. Try another email.</p>
    <button>
      <span class="close icon-12-close-short" onclick="closeAlert()"></span>
    </button>`;

  alert.classList.add('visible');
}

function showAlertWrongEmailOrPassword() {
  alert.innerHTML = `
    <p>Wrong email or password.</p>
    <button>
      <span class="close icon-12-close-short" onclick="closeAlert()"></span>
    </button>`;

  alert.classList.add('visible');
}


function closeAlert() {
  alert.classList.remove('visible');
}

auth.onSignIn((user) => {
  location.href = '/';
});

