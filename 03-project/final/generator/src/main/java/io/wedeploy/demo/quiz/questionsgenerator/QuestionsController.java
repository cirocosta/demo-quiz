package io.wedeploy.demo.quiz.questionsgenerator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
public class QuestionsController {

	private static final Logger log = LoggerFactory.getLogger(QuestionsController.class);

	@Autowired
	private QuestionService questionService;

	@RequestMapping("/questions")
	public List<Question> questions(
			@RequestParam(value="random", defaultValue="true") boolean random,
			@RequestParam(value="limit", required=false) Integer limit) {

		List<Question> questionList = questionService.getQuestions();

		if (random) {
			questionList = new ArrayList<>(questionList);

			questionList.forEach(
				question -> Collections.shuffle(question.getAnswers()));
			Collections.shuffle(questionList);
		}

		if (limit != null) {
			questionList = questionList
				.subList(0, Math.min(limit, questionList.size()));
		}

		log.debug("Questions provided: " + questionList.size());

		return questionList;
	}

	@RequestMapping("/check")
	public boolean check(
		@RequestParam(value = "questionId") String questionId,
		@RequestParam(value = "answerId") String answerId) {

		return questionService.checkAnswer(questionId, answerId);
	}
}
