package io.wedeploy.demo.quiz.questionsgenerator;

import java.util.List;

public class Question {

	private final String id;
	private final String text;
	private final List<Answer> answers;

	public Question(String id, String text, List<Answer> answers) {
		this.id = id;
		this.text = text;
		this.answers = answers;
	}

	public List<Answer> getAnswers() {
		return answers;
	}

	public String getId() {
		return id;
	}

	public String getText() {
		return text;
	}
}
