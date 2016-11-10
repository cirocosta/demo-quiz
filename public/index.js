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
let data = WeDeploy.data(`data.${DOMAIN}`);
let generator = WeDeploy.url(`generator.${DOMAIN}`);

let questions = [];
let qndx = 0;


function main() {
  let { currentUser } = auth;

  if (!currentUser) {
    window.location = "/login";
  }

  getQuestions()
    .then(showNextQuestion);

  if (currentUser.photoUrl) {
    ELEMS.userPhoto.src = currentUser.photoUrl;
  }

  if(auth.currentUser.name) {
    ELEMS.userName.innerHTML = currentUser.name;
    ELEMS.userInitials.innerHTML = currentUser.name.charAt(0);
  } else {
    ELEMS.userName.innerHTML = currentUser.email;
    ELEMS.userInitials.innerHTML = currentUser.email.charAt(0);
  }
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

function renderQuestion(question) {
  ELEMS.title.innerHTML = question.text;
  ELEMS.title.classList.add('visible');

  question
    .answers
    .forEach((answer) => renderAnswer(ELEMS.grid, answer));
}

function renderAnswer(component, answer) {
  component.innerHTML += `
    <section class="half">
     <div onclick=" ${answer.correct ? 'success' : 'error'}(this)" class="content-body clickable flex-column-center-center">
       <h3>${answer.text}</h3>
       <p>${answer.description}</p>
     </div>
    </section>`;
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

function handleAnswerSubtitle (correct, stats) {
  let validationSubTitle = validation.querySelector('p');

    validationSubTitle.innerHTML =
    `This question was answered <span>${correct ? stats.oks : stats.errors}</span> times correctly.`;
}

function handleAnswer(event, isCorrect) {
  const className = isCorrect ? 'correct' : 'error'
  ELEMS.body.classList.add(className);

  const card = event.parentNode;
  card.classList.add(className);

  const otherCard = card.parentNode.querySelector(`.half:not(.${className})`);
  otherCard.style.display = 'none';

  incrementUserStats(auth.currentUser.id, isCorrect);

  let idxQuestion = questions[qndx];

  // TODO: If questions = 0. Show something different on UI.
  if (qndx > 0) {
    idxQuestion = questions[qndx - 1]
  }

  incrementQuestionStats(idxQuestion.id, isCorrect);
}

function incrementUserStats(userId, correct) {
  return data
    .get(`userStats/${userId}`)
    .then((stats) => {
      if (correct) {
        stats.oks += 1;
      }
      else {
        stats.errors += 1;
      }

      return data
        .update(`userStats/${userId}`, stats)
        .then((userStats) => {
          // todo userStats == ""?
          showNextButton(stats);
        });
    })
    .catch((err) => {
      if (err.code != 404) {
        throw err;
      }

      let stats = {
        'id': userId,
        'oks': 0,
        'errors': 0,
      }

      if (correct) {
        stats.oks += 1;
      } else {
        stats.errors += 1;
      }

      return data
        .create('userStats', stats)
        .then((userStats) => {
          showNextButton(userStats);
        });
    });
}

function incrementQuestionStats(questionId, correct) {
  return data
    .get(`questionStats/${questionId}`)
    .then((stats) => {
      if (correct) {
        stats.oks += 1;
      } else {
        stats.errors += 1;
      }

      handleAnswerSubtitle(correct, stats);

      return data
        .update(`questionStats/${questionId}`, stats);
    })
    .catch((err) => {
      if (err.code == 404) {
        let stats = {
          id: questionId,
          oks: 0,
          errors: 0,
        }

        correct ? stats.oks += 1 : stats.errors += 1;

        return data
          .create('questionStats', stats);
      }

      throw err;
    });
}

function showNextButton(userStats) {
  // todo show next button
}

function updateRanking(questionStats) {
  let correctRankingContainer = document.getElementById("ranking-correct");
  let correctBody = correctRankingContainer.querySelector('tbody');

  correctBody.innerHTML = '';

  var sortedOks = sortQuestions(questionStats, 'oks');
  for (qs of sortedOks) {
    findQuestionById(qs.id, correctBody);
  }

  let wrongRankingContainer = document.getElementById("ranking-wrong");
  let wrongBody = wrongRankingContainer.querySelector('tbody');
  wrongBody.innerHTML = '';

  let sortedErrs = sortQuestions(questionStats, 'errors');

  for (qs of sortedErrs) {
    findQuestionById(qs.id, wrongBody);
  }
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


function sortQuestions(questionStats, property) {
  const compare = (a,b) => {
    if (a[property] < b[property]) return -1;
    if (a[property] > b[property]) return 1;

    return 0;
  };

  return questionStats.sort(compare).reverse();
}

function findQuestionById(id, body) {
  for (q of questions) {
    if (q.id == id) {
      addRankingRow(q, body)
      return q;
    }
  }
  return null;
}

function addRankingRow(question, body) {
  let innerHTML =
    `<tr>
      <td> ${question.id}</td>
      <td class="left">${question.text}</td>
    </tr>`;

  body.innerHTML += innerHTML;
}

main();
