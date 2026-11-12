package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.RequirementAnswerRequest;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementAnswer;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.repository.RequirementAnswerRepository;
import lt.viko.eif.gbudreckyte.webbuilder.repository.RequirementQuestionRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RequirementAnswerService {

    private final RequirementAnswerRepository requirementAnswerRepository;
    private final RequirementQuestionRepository requirementQuestionRepository;
    private final ProjectService projectService;

    public RequirementAnswerService(
            RequirementAnswerRepository requirementAnswerRepository,
            RequirementQuestionRepository requirementQuestionRepository,
            ProjectService projectService
    ) {
        this.requirementAnswerRepository = requirementAnswerRepository;
        this.requirementQuestionRepository = requirementQuestionRepository;
        this.projectService = projectService;
    }

    public RequirementAnswer saveAnswer(
            Long projectId,
            RequirementAnswerRequest request,
            User user
    ) {
        Project project = projectService.getProjectById(projectId, user);

        RequirementQuestion question = requirementQuestionRepository
                .findById(request.questionId())
                .orElseThrow(() -> new RuntimeException("Klausimas nerastas"));

        RequirementAnswer answer = requirementAnswerRepository
                .findByProjectAndQuestion(project, question)
                .orElse(
                        RequirementAnswer.builder()
                                .project(project)
                                .question(question)
                                .build()
                );

        answer.setAnswerText(request.answerText());

        return requirementAnswerRepository.save(answer);
    }
    public List<RequirementAnswer> getProjectAnswers(
            Long projectId,
            User user
    ) {
        Project project = projectService.getProjectById(projectId, user);

        return requirementAnswerRepository.findAllByProject(project);
    }
}