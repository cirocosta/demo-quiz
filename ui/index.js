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

let auth = WeDeploy.auth(`auth.${DOMAIN}`);
let generator = WeDeploy.url(`generator.${DOMAIN}`);

let questions = [];
let qndx = 0;

function main() {
  if (!auth.currentUser) {
    window.location = "/login";
  }

  renderUser(auth.currentUser);

  getQuestions()
    .then(showNextQuestion);

  getRanking()
    .then(watchRanking);
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
  return generator
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

      return data
        .update(`users/${auth.currentUser.id}`, userStats);
    })
    .catch((error) => {
      let userStats = {
        id: auth.currentUser.id,
        correctAnswers: (isCorrect ? 1 : 0),
        wrongAnswers: (isCorrect ? 0 : 1),
        email: auth.currentUser.email
      };

      return data
        .create(`users`, userStats);
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
    .param('limit', 3)
    .get()
    .then((clientResponse) => {
      questions = clientResponse.body();

      return questions;
    });
}

function getRanking () {
  let data = WeDeploy.data(`data.${DOMAIN}`);

  return data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .get('users')
    .then((users) => {
      users.forEach(renderUserRanking);
    });
}

function watchRanking () {
  let data = WeDeploy.data(`data.${DOMAIN}`);

  return data
    .orderBy('correctAnswers', 'desc')
    .limit(10)
    .watch('users')
    .on('changes', (users) => {
      users.forEach(renderUserRanking);
    });
}

// update entire table
function renderUserRanking(userStats, index) {
  let row = ELEMS.rankingTable.insertRow(-1);

  let positionCell = row.insertCell(0);
  positionCell.innerHTML = index+1;

  let nameCell = row.insertCell(1);
  nameCell.innerHTML = userStats.email;

  let pointsCell = row.insertCell(2);
  pointsCell.innerHTML = userStats.correctAnswers;
}

main();
