package io.wedeploy.demo.quiz.questionsgenerator;

public class Answer {

	private final String id;
	private final String text;
	private final String description;
	private final boolean correct;

	public Answer(String id, String text, String description, boolean correct) {
		this.id = id;
		this.text = text;
		this.description = description;
		this.correct = correct;
	}

	public String getId() {
		return id;
	}

	public String getText() {
		return text;
	}

	public String getDescription() {
		return description;
	}

	public boolean isCorrect() {
		return correct;
	}
}
