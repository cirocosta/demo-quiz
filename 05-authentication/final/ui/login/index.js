'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const auth = WeDeploy.auth(`auth.${DOMAIN}`);

function signInWithGithub() {
  const githubProvider = new auth.provider.Github();

  githubProvider.setProviderScope('user:email');
  auth.signInWithRedirect(githubProvider);
}

function signInWithGoogle() {
  return false;
}

auth.onSignIn((user) => {
  location.href = '/';
});
