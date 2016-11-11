# devQA

Learn how to create the [devQA](http://devqa.wedeploy.io) on *WeDeploy™* with this step-by-step tutorial.

The final steps include iteraction with WeDeploy Dashboard, so go ahead and create your [account](http://dashboard.wedeploy.com/signup)! Its FREE!

All of the following steps are covered by our [documentation](http://wedeploy.com/docs).



## Getting started

We will be using WeDeploy Command-line. Follow [instalation guide](http://wedeploy.com/docs/intro/using-the-command-line.html).

For a better experience in docker for Mac or Windows, improve your docker to have at least **6GB** or RAM and **6** CPUs.

For this specific demo, you'll also need to install [Java](https://java.com/en/download/help/index_installing.xml).

Run our local server in a separate terminal. You should keep it running through this entire tutorial.

	we run

Fetch this repository, build and deploy locally

	git clone -b tutorial https://github.com/wedeploy/demo-quiz.git
	cd demo-quiz
	we build
	we link
	open devqa.wedeploy.me

You should see the demo home page in your browser.

Once you're able to run it locally, stop it and switch to this tutorial branch

	we unlink
	git checkout -b tutorial origin/tutorial

Create your workspace folder next to the cloned tutorial

	cd ..
	mkdir devqa
	cd devqa

You will find in each step a folder `final` containing the final state your workspace should be at after that step. You can start this tutorial at any step by copying the final state of the previous one into your `devqa` folder.



## Tutorials


### 01 - Hosting

The simplest service we provide is the static hosting. 

Go to your workspace and copy our assets for this step

	cp -r ../demo-quiz/01-hosting/assets/ui ./
	cd ui

And create a file `container.json` with the content

```json
{
  "id": "ui",
  "type": "wedeploy/hosting"
}
```

Now you can try it locally in the command line bellow

	we link --project devqa

You should see the output

	devqa.wedeploy.me                            UP
	 ● ui.devqa.wedeploy.me                wedeploy/hosting       up

You can see the main page of the quiz in your browser at http://ui.devqa.wedeploy.me.

The `link` command does more than just deploy your service. It links your folder with the service running locally, so you can apply changes on-the-fly. Try to change the content of `index.html`, for example, and see it take imediate effect.

You can stop it by running

	we unlink --project devqa


### 02 - Java

We can also host your code in our infrastructure. Lets take a simple java http server as an example. 

Go to your workspace and copy our assets for this step

	cp -r ../demo-quiz/02-java/assets/generator ./
	cd generator

This is a generic microservice that gerenates a random round of questions for our quiz. It uses [gradle](https://gradle.org/) for build management. The server listens to the port `8080`. You can try it locally by running

	./gradlew run

You should be able to request questions through the url http://localhost:8080/questions.

To turn this into a WeDeploy service, create a file `container.json` with the content

```json
{
  "id": "generator",
  "type": "wedeploy/java",
  "port": 8080
}
```

Now you can try it locally in the command line bellow

	we link --project devqa

You should see the output

	devqa.wedeploy.me                              UP
	 ● generator.devqa.wedeploy.me           wedeploy/java          up

You can check your service logs by running

	we log -w generator.devqa

Your logs should end with something like

	generator.devqa.wedeploy.me[3089605] 2016-11-10 18:01:41.583  INFO 65 --- [           main] s.b.c.e.t.TomcatEmbeddedServletContainer : Tomcat started on port(s): 8080 (http)
	generator.devqa.wedeploy.me[3089605] 2016-11-10 18:01:41.584 DEBUG 65 --- [           main] o.s.w.c.s.StandardServletEnvironment     : Adding [server.ports] PropertySource with highest search precedence
	generator.devqa.wedeploy.me[3089605] 2016-11-10 18:01:41.591  INFO 65 --- [           main] i.w.d.q.questionsgenerator.Application   : Started Application in 6.173 seconds (JVM running for 6.859)

Now that your server is up, you can reach it using http://generator.devqa.wedeploy.me/questions.

To improve startup time on server deployment we can specify a `build` hook

```
{
  "id": "generator",
  "type": "wedeploy/java",
    "hooks": {
        "build": "./gradlew clean build"
    }
}
```

And we can manually build our project before we link it

  we build
  we link


### 03 - Project

Lets combine those containers into a project. We did this manually by linking each contaner using the same project id in `--project` argument.

To persist this configuration go to your workspace and create a file `project.json` with the content

```json
{
  "id": "devqa",
  "name": "devQA"
}
```

Make sure no container of this project is running

	we unlink --project devqa

Now you just need to link the project folder without arguments

	we link

You should see the output

	devqa.wedeploy.me                              UP
	 ● generator.devqa.wedeploy.me           wedeploy/java          up
	 ● ui.devqa.wedeploy.me                  wedeploy/hosting       up

You can also change some configuration on the project level. You can configure the container that handles requests to project domain `devqa.wedeploy.me` in our `project.json` file

```json
{
  "id": "devqa",
  "name": "devQA",
  "homeContainer": "ui"
}
```

To apply changes at the configuration level, you need to unlink it first

	we unlink
	we link

You can see the main page of the quiz in your browser at http://devqa.wedeploy.me.	

Now that those containers are tightened up, its easy to integrate them. You can use our [javascript client](http://wedeploy.com/docs/intro/using-the-api-client.html) to load questions from the *generator* service.

For simplicity, its already downloaded and added to your html

```html
<script src="./assets/wedeploy.js"></script>
  <script src="./index.js"></script>
</body>
```

Change the function `getQuestions` on `ui/index.js` as follows

```js
function getQuestions() {
  return WeDeploy
    .url(`generator.${DOMAIN}`)
    .path('questions')
    .param('random', 'true')
    .param('limit', 3)
    .get()
    .then((clientResponse) => {
      questions = clientResponse.body();
    });
}
```

> Note that in our script we don't hardcode the local domain `devqa.wedeploy.me`. We extract it from `window.location`. This is a good practice that we recomend, as your code should be able to work both locally and in the cloud (`devqa.wedeploy.io`). By doing this we could also deploy the `ui` service to any project.

You need to change also the `checkAnswer` function on `ui/index.js` to validate against the server

```js
function checkAnswer(event, questionId, answerId) {
  return WeDeploy
    .url(`generator.${DOMAIN}`)
    .path('check')
    .param('questionId', questionId)
    .param('answerId', answerId)
    .get()
    .then((response) => {
      response.body()
        ? success(event)
        : error(event);
    });
}
```

You can try it now, with just the refresh of a page on the browser.


### 04 - Data

Lets start collecting data on our project. We provide a NoSQL datastore with simple Rest API and search and real-time capabilities.

Go to your workspace and create a folder inside our project

	mkdir data
	cd data

Create a file `container.json` with the content

```json
{
  "id": "data",
  "type": "wedeploy/data"
}
```

And create a file `api.json` with the content

```json
[
  {
    "path": "/*",
    "data": true
  }
]
```

This enables any request on the data service. To see what you are able to do in this file, check out the session [configuring data](http://wedeploy.com/docs/data/js/configuring-data.html) in our docs.

Now we can link it to your project

	we link

You should see the output

	devqa.wedeploy.me                               UP
	 ● data.devqa.wedeploy.me                 wedeploy/data          up

Lets save every answer we receive in a collection of answers. Create the function `storeAnswer`

```js
function storeAnswer(questionId, isCorrect) {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .create('answers', {
      questionId: questionId,
      correct: isCorrect,
      timestamp: new Date()
    });
}
```

And we should call it from the function `handleAnswer`

```js
function handleAnswer(event, isCorrect) {
  // existing handler code

  let idxQuestion = questions[qndx-1];
  storeAnswer(idxQuestion.id, isCorrect);
}
```

We can check the stored answers in the browser at http://data.devqa.wedeploy.me/answers.

For more information on this see the [saving data](http://wedeploy.com/docs/data/js/saving-data.html) session in our docs.

To consume the datastore, lets add some information after the user answers a question.

Add a function `handleAnswerSubTitle` that will add a sub-title on the answer page

```js
function handleAnswerSubTitle(questionId) {
  WeDeploy
    .data(`data.${DOMAIN}`)
    .where('questionId', questionId)
    .aggregate('dist', 'correct', 'terms')
    .count()
    .get('answers')
    .then((result) => {
      let validationSubTitle = validation.querySelector('p');
      let aggregations = result.aggregations.dist;

      let correctCount = aggregations['1'] || 0;
      let wrongCount = aggregations['0'] || 0;

      validationSubTitle.innerHTML = `This question was answered`;
      validationSubTitle.innerHTML += ` ${correctCount} time${correctCount > 1 ? 's' : ''} correctly`;
      validationSubTitle.innerHTML += ` and ${wrongCount} time${wrongCount > 1 ? 's' : ''} wrong.`;
    });
}
```

And call if after we store the answer on datastore

```diff
function storeAnswer(questionId, isCorrect) {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .create('answers', {
      questionId: questionId,
      correct: isCorrect,
      timestamp: new Date()
-   });
+   })
+   .then((response) => {
+     handleAnswerSubTitle(questionId, isCorrect);
+   });
}
```

You can check it by refreshing the page on the browser.

For more information on this see the [retrieving](http://wedeploy.com/docs/data/js/retrieving-data.html) and [searching](http://wedeploy.com/docs/data/js/searching-data.html) sessions in our docs.


### 05 - Authentication

WeDeploy offers [user authentication](http://wedeploy.com/docs/auth/js) as a service. To add authentication to your project is as simple as it was to add data.

Go to your workspace and create a folder inside our project

	mkdir auth
	cd auth

Create a file `container.json` with the content

```json
{
  "id": "auth",
  "type": "wedeploy/auth"
}
```

Now we can link it to your project

	we link

You should see the output

	devqa.wedeploy.me                               UP
	 ● auth.devqa.wedeploy.me                 wedeploy/auth          up

We already give you a simple login page. Go to your workspace and copy our assets for this step

	cp -r ../demo-quiz/05-authentication/assets/login ./ui/

If you're already running your project, check the new page on the browser at `http://devqa.wedeploy.me/login`.

You can see its a simple page that enables you to sign-in with [github](http://wedeploy.com/docs/auth/js/sign-in-with-github.html) or [google](http://wedeploy.com/docs/auth/js/sign-in-with-google.html). There are more providers that we offer in our [docs](http://wedeploy.com/docs/auth/js#key-capabilities).

Here we'll guide you through the GitHub flow, but the second is analogous to this one. First, you need to [create an application](http://wedeploy.com/docs/auth/js/sign-in-with-github.html#setup-app-client-id-and-secret). Now, with your `<your-github-client-id>` and `<your-github-client-secret>`, you can configure yout *auth* service by adding to its `container.json`

```diff
{
    "id": "auth",
    "name": "Auth",
-   "type": "wedeploy/auth"
+   "type": "wedeploy/auth",
+   "env": {
+       "WEDEPLOY_AUTH_GITHUB": "true",
+       "WEDEPLOY_AUTH_GITHUB_CLIENT_ID": "<your-github-client-id>",
+       "WEDEPLOY_AUTH_GITHUB_CLIENT_SECRET": "<your-github-client-secret>"
+   }
}
```

> Be sure you added the local url `http://auth.devqa.wedeploy.me/oauth/token` as your *Authorization callback URL* on GitHub.

As we changed a configuration, we need to unlink and link the service with our local server

	we unlink auth.devqa
	we link auth.devqa

To integrate with our WebServer, add the global reference to `auth` on `ui/login/index.js`

```js
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
```

And change the function `signInWithGithub`

```js
function signInWithGithub() {
  const githubProvider = new auth.provider.Github();

  githubProvider.setProviderScope('user:email');
  auth.signInWithRedirect(githubProvider);
}
```

And at the end of the `ui/login/index.js` file add the lines

```js
auth.onSignIn((user) => {
  location.href = '/';
});
```

You can now login with your GitHub account and try it out. For more information on this see [sign in with github](http://wedeploy.com/docs/auth/js/sign-in-with-github.html) session in our docs.

To make sure authentication is mandatory, add the global reference to `auth` on `ui/index.js`

```json
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
```

And add to the function `main`

```diff
function main() {
+ if (!auth.currentUser) {
+   window.location = "/login";
+ }
+
  getQuestions()
    .then(showNextQuestion);
}
```

You should be redirected to login page if you are not logged in.

To complete the flow, you can fetch user basic information and add a signout button. First, add this snippet into your `ui/index.html`

```diff
    <div class="wrapper ranking-offset flex-column-center-center">

+     <div class="menu">
+       <button class="avatar">
+         <span id="userInitials"></span>
+         <img id="userPhoto" src="" />
+         <div id="userName" class="btn-tooltip"></div>
+       </button>
+       <button class="logout" onclick="signOut();">
+         <span class="icon-12-leave"></span>
+         <div class="btn-tooltip">Sign Out</div>
+       </button>
+     </div>
+
      <header class="grid-quiz">
```

Add those elements to your `ui/index.js`

```diff
const ELEMS = {
  title: document.querySelector('.content-header.question #title'),
  body: document.querySelector('body'),
  grid: document.querySelector('.grid-quiz.question'),
  footer: document.querySelector('footer'),

  validation: document.getElementById('validation'),
- nextButton: document.querySelector('#next')
+ nextButton: document.querySelector('#next'),
+
+ userPhoto: document.getElementById('userPhoto'),
+ userName: document.getElementById('userName'),
+ userInitials: document.getElementById('userInitials')
};
```

Implement the function `signOut` in your `ui/index.js`

```js
function signOut() {
  auth
    .signOut()
    .then(() => {
      location.href = '/login';
    });
}
```

And the function `renderUserHeader`

```js
function renderUserHeader(user) {
  if (user.photoUrl) {
    ELEMS.userPhoto.src = user.photoUrl;
  }

  ELEMS.userName.innerHTML = user.name || user.email;
  ELEMS.userInitials.innerHTML = user.name
    ? user.name.charAt(0)
    : user.email.charAt(0);
}
```

You can call it from your `main` function

```diff
function main() {
  if (!auth.currentUser) {
    window.location = "/login";
  }

+ renderUserHeader(auth.currentUser);
+
  getQuestions()
    .then(showNextQuestion);
}
```

Now you should be able to see the user *name* and *photo* on your main page, and the signout button should redirect you to the login page.


### 06 - Sign Up

The WeDeploy Auth service enables by default user authentication via *email* and *password*. To leverage on that you need to create users in your *auth* service.

We already give you a simple sign up page, and the complete login page. Go to your workspace and copy our assets for this step

	cp -r ../demo-quiz/06-signup/assets/signup ./ui/
	cp ../demo-quiz/06-signup/assets/login/* ./ui/login/

You can check that your login with GitHub still works, and the login with Google is implemented as well. To integrate the sinup page, add the global reference to `auth` on `ui/signup/index.js`

```js
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
```

And change the function `submitForm` 

```js
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
      location.href = '/login';
    }).catch(() => {
      showAlertEmailAlreadyInUse();
      signUp.reset();
    });
}
```

For more information on this see [user management](http://wedeploy.com/docs/auth/js/manage-users.html) session in our docs.

To integrate the login page, change the function `signInWithEmailAndPassword` on `ui/login/index.js`

```js
function signInWithEmailAndPassword() {
  auth.signInWithEmailAndPassword(signIn.email.value, signIn.password.value)
    .then(() => signIn.reset())
    .catch(() => {
      showAlertWrongEmailOrPassword();
      signIn.reset();
    });
}
```

For more information on this see [sign in with password](http://wedeploy.com/docs/auth/js/sign-in-with-password.html) session in our docs.

This should work well, but we can improve it by signing in after sign up. Create the same functions from `ui/login/index.js` on `ui/signup/index.js`

```js
function signInWithEmailAndPassword(email, password) {
  return auth
    .signInWithEmailAndPassword(email, password)
    .then(() => signUp.reset())
    .catch(() => {
      showAlertWrongEmailOrPassword();
      signUp.reset();
    });
}

function showAlertWrongEmailOrPassword () {
  alert.innerHTML = `
    <p>Wrong email or password.</p>
    <button>
      <span class="close icon-12-close-short" onclick="closeAlert()"></span>
    </button>`;

  alert.classList.add('visible');
}
```

And add the same `onSignIn` callback at the end of `ui/signup/index.js`

```js
auth.onSignIn((user) => {
  location.href = '/';
});
```

Change the callback for sign up on `ui/signup/index.js` to automatically log in

```diff
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
-     location.href = '/login';
+     signInWithEmailAndPassword(email, password);
    }).catch(() => {
      showAlertEmailAlreadyInUse();
      signUp.reset();
    });
}
```

This should give a better user experience after sign up. Try it by refreshing your page on the browser.


### 07 - Email

To complete the user management, WeDeploy Auth offers the password recovery functionality out-of-the-box. You will need to send an password recovery email to your user to implement the flow. WeDeploy offers an *email* service as simples as the previous *data* and *auth* ones.

Go to your workspace and create a folder inside our project

	mkdir email
	cd email

Create a file `container.json` with the content

```json
{
  "id": "email",
  "type": "wedeploy/email"
}
```

Now we can link it to your project

  we link

You should see the output

  devqa.wedeploy.me                               UP
   ● email.devqa.wedeploy.me                wedeploy/email          up

For more information on how to use the *email* service see [email](http://wedeploy.com/docs/email/js) session in our docs.

Now go to your workspace and copy our assets for this step

  cp -r ../demo-quiz/07-email/assets/forgot-password ./ui/

You can see this WebPage by accessing in your browser http://devqa.wedeploy.me/forgot-password.

You can first add a link to it in your login page by adding the snipped into your `ui/login/index.html`

```diff
<div class="form-group">
 <div class="col-flex-row-spacebetween-center">
    <label>Password</label>
+   <a class="forgot-password" href="../forgot-password/" tabindex="-1">Forgot your password?</a>
  </div>
  <input type="password" placeholder="Password (at least 6 characters)" class="form-control" name="password" value="" maxlength="100" required="" />
</div>
```

To integrate the page add the global reference to `auth` on `ui/forgot-password/index.js`

```
const auth = WeDeploy.auth(`auth.${DOMAIN}`);
```

And change the function `resetPassword`

```js
function resetPassword() {
  auth
    .sendPasswordResetEmail(forgotPassword.email.value)
    .then(showAlertEmailSent);
}
```

You should receive an email with instructions in a few minutes after reseting the password of an existing user.


### 08 - Real-time

One of the biggest features of WeDeploy *Data* service is its real-time capabilities. Lets apply them to the quiz by integrating our signed users with stored data.

First, change your function `storeAnswer` in `ui/index.js` to also store the user *id*

```diff
function storeAnswer(questionId, isCorrect) {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .create('answers', {
      questionId: questionId,
+     userId: auth.currentUser.id,
      correct: isCorrect,
      timestamp: new Date()
    })
    .then((response) => {
      handleAnswerSubTitle(questionId, isCorrect);
    });
}
```

Then we can also store counters for correct and wrong answers given by `currentUser`. First, implement the function `incrementUserStats` in `ui/index.js`

```js
function incrementUserStats(isCorrect) {
  let data = WeDeploy.data(`data.${DOMAIN}`);

  return data
    .get(`users/${auth.currentUser.id}`)
    .then((userStats) => {
      if (isCorrect) {
        userStats.correctAnswers += 1;
      } else {
        userStats.wrongAnswers += 1;
      }

      data.update(`users/${auth.currentUser.id}`, stats);
    })
    .catch((error) => {
      let userStats = {
        id: auth.currentUser.id,
        email: auth.currentUser.email,
        correctAnswers: (isCorrect ? 1 : 0),
        wrongAnswers: (isCorrect ? 0 : 1)
      };

      data.create('users', userStats);
    });
}
```

And call it from `handleAnswer`

```diff
function handleAnswer(event, isCorrect) {
  // ...
+
+  incrementUserStats(isCorrect);
}
```

We can check the counters by accessing on the browser http://data.devqa.wedeploy.me/users.

Now lets add this information to our WebServer. First, add the following snippet to your `ui/index.html`

```diff
  <footer>
    <button id="next" onclick="showNextQuestion();" class="btn btn-next">Next</button>
  </footer>
</div>

+<div id="ranking-container" class="ranking-container flex-column-top-center">
+
+  <div class="ranking">
+    <header>
+      <div class="content-header">
+        <a href="#ranking-container"><h1>Ranking</h1></a>
+      </div>
+    </header>
+    <table>
+      <thead>
+        <tr>
+          <th width="10%">
+            #
+          </th>
+          <th width="60%">
+            Name
+          </th>
+          <th width="30%">
+            Points
+          </th>
+        </tr>
+      </thead>
+      <tbody id="user-ranking"></tbody>
+    </table>
+  </div>
+</div>
+
</div>
```

Add the element to your `ui/index.js`

```diff
const ELEMS = {
  title: document.querySelector('.content-header.question #title'),
  body: document.querySelector('body'),
  grid: document.querySelector('.grid-quiz.question'),
  footer: document.querySelector('footer'),

  validation: document.getElementById('validation'),
  nextButton: document.querySelector('#next'),

  userPhoto: document.getElementById('userPhoto'),
  userName: document.getElementById('userName'),
- userInitials: document.getElementById('userInitials')
+ userInitials: document.getElementById('userInitials'),
+
+ rankingTable: document.getElementById('user-ranking')  
};
```

And add the following functions to your `ui/index.js` to load and render the user ranking

```js
function getUsers() {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .get('users');
}

function renderTable(users) {
  ELEMS.rankingTable.innerHTML = users
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
```

To use real-time, create the function `watchRanking` to your `ui/index.js`

```js
function watchUsers() {
  WeDeploy
    .data(`data.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .watch('users')
    .on('changes', renderTable);
}
```

Now call them from the `main` function on your `ui/index.js`

```diff
function main() {
  // ...
+
+ getUsers()
+   .then(renderTable)
+   .then(watchUsers);
}
```

You should see the ranking on the right side of your main page.

We also added this in a separate page, to be used instead of the current final page of the quiz.

Go to your workspace and copy our assets for this step

  cp ../demo-quiz/08-realtime/assets/ui/ranking/* ./ui/ranking

You can access the ranking page on your browser at http://devqa.wedeploy.me/ranking.


### 09 - Authorization

WeDeploy services are already integrated with the authentication service. To secure our datastore, for example, you can apply the [auth](http://wedeploy.com/docs/data/js/configuring-data.html#auth) configuration to your data's `api.json`. file.

First, we can narrow down the access on *data* service to only enable the collections we need by changing `data/api.json`

```json
[
  {
    "path": "/answers",
    "method": [ "post", "get" ],
    "data": true
  },
  {
    "path": "/users",
    "method": [ "get", "post" ],
    "data": true
  },
  {
    "path": "/users/:userId",
    "method": [ "get", "put" ],
    "data": true
  }
]
```

Now we can only access the datastore at the collection level, and only with the methods we need. They cannot delete data in this scenario. You can now separate by method to add *auth* rules as apropriate.

For example, we can validate the creation of answers

```json
{
  "path": "/answers",
  "method": "post",
  "data": true,
  "auth": {
    "validator": "$auth.id === $body.userId"
  }
}
```

And add a filter on any requets to load answers

```json
{
  "path": "/answers",
  "method": "get",
  "data": true,
  "auth": {
    "validator": "$auth != null"
  },
  "parameters": {
    "filter": {
      "value": {
        "userId": "$auth.id"
      }
    }
  }
}
```

The last think to add is parameter validation for POST/PUT requests

```json
{
  "path": "/answers",
  "method": "post",
  "data": true,
  "auth": {
    "validator": "$auth.id === $body.userId"
  },
  "parameters": {
    "userId": {
      "type": "string",
      "required": true
    },
    "questionId": {
      "type": "string",
      "required": true
    },
    "correct": {
      "type": "boolean",
      "required": true
    },
    "timestamp": {
      "type": "string",
      "required": true
    }
  }
}
```

The final `api.json` should be as follows

```json
[
  {
    "path": "/answers",
    "method": "post",
    "data": true,
    "auth": {
      "validator": "$auth.id === $body.userId"
    },
    "parameters": {
      "userId": {
        "type": "string",
        "required": true
      },
      "questionId": {
        "type": "string",
        "required": true
      },
      "correct": {
        "type": "boolean",
        "required": true
      },
      "timestamp": {
        "type": "string",
        "required": true
      }
    }
  },
  {
    "path": "/answers",
    "method": "get",
    "data": true,
    "auth": {
      "validator": "$auth != null"
    },
    "parameters": {
      "filter": {
        "value": {
          "userId": "$auth.id"
        }
      }
    }
  },
  {
    "path": "/users/*",
    "method": "get",
    "data": true
  },
  {
    "path": "/users",
    "method": "post",
    "data": true,
    "auth": {
      "validator": "$auth.id === $body.id"
    },
    "parameters": {
      "id": {
        "type": "string",
        "required": true
      },
      "email": {
        "type": "string",
        "required": true
      },
      "correctAnswers": {
        "type": "number",
        "required": true
      },
      "wrongAnswers": {
        "type": "number",
        "required": true
      }
    }
  },
  {
    "path": "/users/:userId",
    "method": "put",
    "data": true,
    "auth": {
      "validator": "$auth.id == $params.userId"
    },
    "parameters": {
      "email": {
        "type": "string",
        "required": true
      },
      "correctAnswers": {
        "type": "number",
        "required": true
      },
      "wrongAnswers": {
        "type": "number",
        "required": true
      }
    }
  }
]
```

Now you only need to restart the data service by running

  cd data
  we restart

And these rules should be applied. You can try to access in your browser http://data.devqa.wedeploy.me/answers and receive an empty list.


### 10 - Deployment

Now that you have the complete quiz, go to the dashboard and create a project with any id. Follow the [guide](http://wedeploy.com/docs/intro/using-the-dashboard.html) from our documentation page.

Go to the *Deployment* session of your new project and follow the steps to push to our git server.

Access your quiz in the browser at http://<your-project-id>.wedeploy.io


