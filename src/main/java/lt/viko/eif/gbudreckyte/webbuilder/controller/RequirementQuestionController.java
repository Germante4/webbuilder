package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.RequirementQuestionResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import lt.viko.eif.gbudreckyte.webbuilder.service.RequirementQuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RequirementQuestionController {

    private final RequirementQuestionService requirementQuestionService;
    private final ProjectService projectService;

    public RequirementQuestionController(
            RequirementQuestionService requirementQuestionService,
            ProjectService projectService
    ) {
        this.requirementQuestionService = requirementQuestionService;
        this.projectService = projectService;
    }

    @GetMapping("/requirements/questions")
    public ResponseEntity<List<RequirementQuestionResponse>> getQuestions(
            @RequestParam WebsiteCategory category
    ) {
        return ResponseEntity.ok(
                requirementQuestionService.getQuestionsByCategory(category)
        );
    }

    @GetMapping("/projects/{projectId}/requirements/questions")
    public ResponseEntity<List<RequirementQuestionResponse>> getProjectQuestions(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        Project project = projectService.getProjectById(projectId, user);

        return ResponseEntity.ok(
                requirementQuestionService.getQuestionsByCategory(
                        project.getWebsiteCategory()
                )
        );
    }
}