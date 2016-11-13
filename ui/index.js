'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const ELEMS = {
  title: document.querySelector('.content-header.question #title'),
  body: document.querySelector('body'),
  grid: document.querySelector('.grid-quiz.question'),
  footer: document.querySelector('footer'),

  validation: document.getElementById('validation'),
  nextButton: document.querySelector('#next'),

  userPhoto: document.getElementById('userPhoto'),
  userName: document.getElementById('userName'),
  userInitials: document.getElementById('userInitials'),

  rankingTable: document.getElementById('user-ranking')
};

let questions = [];
let qndx = 0;

const auth = WeDeploy.auth(`auth.${DOMAIN}`);

function main() {
  if (!auth.currentUser) {
    window.location = "/login";
  }

  renderUserHeader(auth.currentUser);

  getQuestions()
    .then(showNextQuestion);

  getUsers()
    .then(renderTable)
    .then(watchUsers);
}

function signOut() {
  auth
    .signOut()
    .then(() => {
      location.href = '/login';
    });
}

function showNextQuestion() {
  if (qndx == questions.length) {
    location.href = "/ranking";
    return;
  }

  let question = questions[qndx++];

  restartQuestionUI();
  renderQuestion(question);
}

function restartQuestionUI() {
  ELEMS.title.classList.remove('visible');

  ELEMS.body.classList.remove('correct');
  ELEMS.body.classList.remove('error');

  ELEMS.grid.innerHTML = '';

  ELEMS.footer.classList.remove('visible');
}

function renderUserHeader(user) {
  if (user.photoUrl) {
    ELEMS.userPhoto.src = user.photoUrl;
  }

  ELEMS.userName.innerHTML = user.name || user.email;
  ELEMS.userInitials.innerHTML = user.name
    ? user.name.charAt(0)
    : user.email.charAt(0);
}

function renderQuestion(question) {
  ELEMS.title.innerHTML = question.text;
  ELEMS.title.classList.add('visible');

  question
    .answers
    .forEach((answer) =>
      renderAnswer(ELEMS.grid, question, answer));
}

function renderAnswer(component, question, answer) {
  component.innerHTML += `
    <section class="half">
     <div onclick="checkAnswer(this, ${question.id}, ${answer.id})" class="content-body clickable flex-column-center-center">
       <h3>${answer.text}</h3>
       <p>${answer.description}</p>
     </div>
    </section>`;
}

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

function success(event) {
  let validationTitle = validation.querySelector('h1');

  validationTitle.innerHTML = 'Correct!';
  ELEMS.footer.classList.add('visible');
  handleAnswer(event, true);
}

function error(event) {
  let validationTitle = validation.querySelector('h1');

  validationTitle.innerHTML = 'Wrong :(';
  ELEMS.footer.classList.add('visible');
  handleAnswer(event, false);
}

function handleAnswer(event, isCorrect) {
  const className = isCorrect ? 'correct' : 'error'
  ELEMS.body.classList.add(className);

  const card = event.parentNode;
  card.classList.add(className);

  const otherCard = card.parentNode.querySelector(`.half:not(.${className})`);
  otherCard.style.display = 'none';

  let idxQuestion = questions[qndx-1];
  storeAnswer(idxQuestion.id, isCorrect);

  incrementUserStats(isCorrect);
}

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

      data.update(`users/${auth.currentUser.id}`, userStats);
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

function storeAnswer(questionId, isCorrect) {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .create('answers', {
      questionId: questionId,
      userId: auth.currentUser.id,
      correct: isCorrect,
      timestamp: new Date()
    })
    .then(() => {
      handleAnswerSubTitle(questionId, isCorrect);
    });
}

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

function getUsers() {
  return WeDeploy
    .data(`data.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .get('users');
}

function watchUsers() {
  WeDeploy
    .data(`data.${DOMAIN}`)
    .orderBy('correctAnswers', 'desc')
    .limit(5)
    .watch('users')
    .on('changes', renderTable);
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


main();
