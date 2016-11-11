'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const ELEMS = {
  title: document.querySelector('.content-header.question #title'),
  body: document.querySelector('body'),
  grid: document.querySelector('.grid-quiz.question'),
  footer: document.querySelector('footer'),

  validation: document.getElementById('validation'),
  nextButton: document.querySelector('#next')
};

let questions = [];
let qndx = 0;


function main() {
  getQuestions()
    .then(showNextQuestion);
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


main();
