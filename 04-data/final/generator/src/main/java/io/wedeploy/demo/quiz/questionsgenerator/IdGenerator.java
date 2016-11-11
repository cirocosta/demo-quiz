package io.wedeploy.demo.quiz.questionsgenerator;

public class IdGenerator {

	private int id;

	public IdGenerator(int initialValue) {
		this.id = initialValue;
	}

	public String nextId() {
		return String.valueOf(id++);
	}

}
