const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");

const body = document.querySelector('body');
const validation = document.getElementById('validation');
const nextButton = document.querySelector('#next');

var questions;
var qndx = 0;

function main() {
	WeDeploy
	    .url('http://questions-generator.' + DOMAIN)
	    .path('questions')
	    .param('random', 'true')
	    .get()
	    .then(function(clientResponse) {
			questions = clientResponse.body();
			showNextQuestion();
	    });
}

function showNextQuestion() {
	if (qndx == questions.length) {
		qndx = 0;
	}
	var question = questions[qndx];
	qndx = qndx + 1;
	renderQuestion(question);
}

function renderQuestion(question) {
	const title = document.querySelector('.content-header.question #title');
	title.innerHTML = question.text;
	const grid = document.querySelector('.grid-quiz.question');
	question.answers.forEach(function(answer) {
		renderAnswer(grid, answer);
	});
}

function renderAnswer(component, answer) {
	component.innerHTML += '<section class="half">' +
		'	<div onclick="' + (answer.correct ? 'success' : 'error') + '(this)" class="content-body clickable flex-column-center-center">' +
		'		<h3>' + answer.text + '</h3>' +
		'		<p>' + answer.description + '</p>' +
		'	</div>' +
		'</section>';
}

function success(event) {
	validation.innerHTML = 'Correct!';
	handleAnswer(event, true);
}

function error(event) {
	validation.innerHTML = 'Wrong :(';
	handleAnswer(event, false);
}

function handleAnswer(event, isCorrect) {
	var className = isCorrect ? 'correct' : 'error'
	body.classList.add(className);
	const card = event.parentNode;
	card.classList.add(className);
	const otherCard = card.parentNode.querySelector('.half:not(.' + className + ')');
	otherCard.style.display = 'none';

	incrementUserStats('userNN', isCorrect);
	var qid = questions[qndx].id;
	incrementQuestionStats(qid, isCorrect);
}

function incrementUserStats(userId, correct) {
	WeDeploy
		.data('data.' + DOMAIN)
		.get('userStats/' + userId)
		.then(function(stats) {
			if (correct) {
				stats.oks += 1;
			}
			else {
				stats.errors += 1;
			}

			return WeDeploy
				.data('data.' + DOMAIN)
				.update('userStats/' + userId, stats)
				.then(function(userStats) {
					// todo userStats == ""?
					showNextButton(stats);
				});
		})
		.catch(function(err) {
			if (err.code == 404) {
				var stats = {
					'id' : userId,
					'oks' : 0,
					'errors' : 0,
				}

				if (correct) {
					stats.oks += 1;
				}
				else {
					stats.errors += 1;
				}

				return WeDeploy
					.data('data.' + DOMAIN)
					.create('userStats', stats)
					.then(function(userStats) {
						showNextButton(userStats);
					});
			}
			throw err;
		});
}

function incrementQuestionStats(questionId, correct) {
	WeDeploy
		.data('data.' + DOMAIN)
		.get('questionStats/' + questionId)
		.then(function(stats) {
			if (correct) {
				stats.oks += 1;
			}
			else {
				stats.errors += 1;
			}

			return WeDeploy
				.data('data.' + DOMAIN)
				.update('questionStats/' + questionId, stats);
		})
		.catch(function(err) {
			if (err.code == 404) {
				var stats = {
					'id' : questionId,
					'oks' : 0,
					'errors' : 0,
				}

				if (correct) {
					stats.oks += 1;
				}
				else {
					stats.errors += 1;
				}

				return WeDeploy
					.data('data.' + DOMAIN)
					.create('questionStats', stats);
			}
			throw err;
		});
}



function showNextButton(userStats) {
	console.log("Next Button!");
	console.log(userStats);
	// todo show next button
}

main();