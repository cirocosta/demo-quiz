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
  userInitials: document.getElementById('userName'),
};

let auth = WeDeploy.auth(`auth.${DOMAIN}`);
let generator = WeDeploy.url(`generator.${DOMAIN}`);

let questions = [];
let qndx = 0;

function main() {
  let { currentUser } = auth;

  if (!currentUser) {
    window.location = "/login";
  }

  renderUser(currentUser);

  getQuestions()
    .then(showNextQuestion);
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

function renderUser(user) {
  if (user.photoUrl) {
    ELEMS.userPhoto.src = user.photoUrl;
  }

  if(user.name) {
    ELEMS.userName.innerHTML = user.name;
    ELEMS.userInitials.innerHTML = user.name.charAt(0);
  } else {
    ELEMS.userName.innerHTML = user.email;
    ELEMS.userInitials.innerHTML = user.email.charAt(0);
  }
}

function renderQuestion(question) {
  ELEMS.title.innerHTML = question.text;
  ELEMS.title.classList.add('visible');

  question
    .answers
    .forEach((answer) => renderAnswer(ELEMS.grid, question, answer));
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
  generator
    .path('check')
    .param('questionId', questionId)
    .param('answerId', answerId)
    .get()
    .then((response) => {
      let isSuccess = response.body;

      if (isSuccess) {
        success(event);
      } else {
        error(event);
      }
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

  incrementUserStats(isCorrect);

  let idxQuestion = questions[qndx-1];
  storeAnswer(idxQuestion.id, isCorrect);
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

      var x = aggregations['1'];
      var y = aggregations['0'];

      if (x === undefined) {
        x = 0;
      }
      if (y === undefined) {
        y = 0;
      }

      validationSubTitle.innerHTML = `This question was answered ${x} times correctly `;
      validationSubTitle.innerHTML += `and ${y} times wrong.`;
    });
}

function incrementUserStats(isCorrect) {
  return auth
    .getUser(auth.currentUser.id)
    .then((user) => {
      let stats = {};

      if (isCorrect) {
        stats.correctAnswers = (user.correctAnswers || 0) + 1;
      }
      else {
        stats.wrongAnswers = (user.wrongAnswers || 0) + 1;;
      }

      return auth
        .currentUser
        .updateUser(stats);
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
    .then((response) => {
      handleAnswerSubTitle(questionId, isCorrect);
    });
}

function getQuestions () {
  return generator
    .path('questions')
    .param('random', 'true')
    .get()
    .then((clientResponse) => {
      questions = clientResponse.body();

      return questions;
    });
}

main();
