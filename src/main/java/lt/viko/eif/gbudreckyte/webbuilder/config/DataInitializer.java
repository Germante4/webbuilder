package lt.viko.eif.gbudreckyte.webbuilder.config;

import lt.viko.eif.gbudreckyte.webbuilder.model.QuestionType;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import lt.viko.eif.gbudreckyte.webbuilder.repository.RequirementQuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRequirementQuestions(
            RequirementQuestionRepository requirementQuestionRepository
    ) {
        return args -> {

            if (requirementQuestionRepository.count() > 0) {
                return;
            }

            RequirementQuestion question1 = RequirementQuestion.builder()
                    .questionText("Koks yra jūsų verslo arba prekės ženklo pavadinimas?")
                    .category(WebsiteCategory.SERVICES)
                    .questionType(QuestionType.TEXT)
                    .required(true)
                    .displayOrder(1)
                    .build();

            RequirementQuestion question2 = RequirementQuestion.builder()
                    .questionText("Trumpai papasakokite apie savo veiklą.")
                    .category(WebsiteCategory.SERVICES)
                    .questionType(QuestionType.TEXTAREA)
                    .required(true)
                    .displayOrder(2)
                    .build();

            RequirementQuestion question3 = RequirementQuestion.builder()
                    .questionText("Kokius klientus norėtumėte pritraukti savo svetaine?")
                    .category(WebsiteCategory.SERVICES)
                    .questionType(QuestionType.TEXTAREA)
                    .required(true)
                    .displayOrder(3)
                    .build();

            requirementQuestionRepository.save(question1);
            requirementQuestionRepository.save(question2);
            requirementQuestionRepository.save(question3);
        };
    }
}