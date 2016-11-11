package io.wedeploy.demo.quiz.questionsgenerator;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

	@Value(value = "classpath:qa.json")
	private Resource questionsJson;

	private List<Question> questionList;

	@PostConstruct
	public void init() throws IOException {

		List<List<?>> questionsAndAnswers;

		try (InputStream inputStream = questionsJson.getInputStream()) {
			ObjectMapper mapper = new ObjectMapper();
			questionsAndAnswers = mapper.readValue(inputStream, List.class);
		}
		catch (Exception ex) {
			ex.printStackTrace();
			return;
		}

		questionList = new ArrayList<>();

		IdGenerator questionIdGenerator = new IdGenerator(100);

		questionsAndAnswers.forEach((List<?> data) -> {
			List<Answer> answers = new ArrayList<>(data.size() - 1);

			IdGenerator answerIdGenerator = new IdGenerator(300);

			for (int i = 1; i < data.size(); i++) {
				List<String> arrayAndDescription = (List<String>) data.get(i);

				answers.add(new Answer(
					answerIdGenerator.nextId(),
					arrayAndDescription.get(0),
					arrayAndDescription.get(1),
					i == 1));
			}

			String questionId = questionIdGenerator.nextId();
			String question = (String)data.get(0);

			questionList.add(new Question(questionId, question, answers));
		});
	}

	/**
	 * Returns list of all questions and answers.
	 */
	public List<Question> getQuestions() {
		return questionList;
	}

	/**
	 * Returns {@code true} if question and ID is correct.
	 */
	public boolean checkAnswer(String questionId, String answerId) {
		return questionList.stream()
			.filter(question -> question.getId().equals(questionId))
			.flatMap(question -> question.getAnswers().stream())
			.filter(answer -> answer.getId().equals(answerId))
			.filter(Answer::isCorrect)
			.findFirst()
			.isPresent();

	}
}
