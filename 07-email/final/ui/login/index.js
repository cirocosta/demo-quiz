'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
const alert = document.getElementById('alert');

function signInWithEmailAndPassword() {
  auth.signInWithEmailAndPassword(signIn.email.value, signIn.password.value)
    .then(() => signIn.reset())
    .catch(() => {
      showAlertWrongEmailOrPassword();
      signIn.reset();
    });
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

function signInWithGithub() {
  const githubProvider = new auth.provider.Github();

  githubProvider.setProviderScope('user:email');
  auth.signInWithRedirect(githubProvider);
}

function signInWithGoogle() {
  const googleProvider = new auth.provider.Google();

  googleProvider.setProviderScope('email');
  auth.signInWithRedirect(googleProvider);
}

auth.onSignIn((user) => {
  location.href = '/';
});
