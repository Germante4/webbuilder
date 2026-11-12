package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.QuestionOptionResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.RequirementQuestionResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import lt.viko.eif.gbudreckyte.webbuilder.repository.QuestionOptionRepository;
import lt.viko.eif.gbudreckyte.webbuilder.repository.RequirementQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RequirementQuestionService {

    private final RequirementQuestionRepository requirementQuestionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    public RequirementQuestionService(
            RequirementQuestionRepository requirementQuestionRepository,
            QuestionOptionRepository questionOptionRepository
    ) {
        this.requirementQuestionRepository = requirementQuestionRepository;
        this.questionOptionRepository = questionOptionRepository;
    }

    public List<RequirementQuestionResponse> getQuestionsByCategory(
            WebsiteCategory category
    ) {
        List<WebsiteCategory> categories =
                List.of(WebsiteCategory.GENERAL, category);

        List<RequirementQuestion> questions =
                requirementQuestionRepository
                        .findAllByCategoryInOrderByDisplayOrderAsc(categories);

        return questions.stream()
                .map(question -> {

                    List<QuestionOptionResponse> options =
                            questionOptionRepository
                                    .findAllByQuestionOrderByDisplayOrderAsc(question)
                                    .stream()
                                    .map(option -> new QuestionOptionResponse(
                                            option.getId(),
                                            option.getOptionText()
                                    ))
                                    .toList();

                    return new RequirementQuestionResponse(
                            question.getId(),
                            question.getQuestionText(),
                            question.getQuestionType(),
                            question.isRequired(),
                            question.getDisplayOrder(),
                            question.getPlaceholder(),
                            question.isAiRefinementEnabled(),
                            options
                    );
                })
                .toList();
    }
}