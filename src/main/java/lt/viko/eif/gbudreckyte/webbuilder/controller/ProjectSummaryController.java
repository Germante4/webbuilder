package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectSummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/project-summary")
public class ProjectSummaryController {

    private final ProjectSummaryService projectSummaryService;

    public ProjectSummaryController(
            ProjectSummaryService projectSummaryService
    ) {
        this.projectSummaryService = projectSummaryService;
    }

    @PostMapping("/update")
    public ResponseEntity<ProjectSummaryResponse> updateSummary(
            @RequestBody ProjectSummaryRequest request
    ) {

        ProjectSummaryResponse summary =
                projectSummaryService.updateSummary(
                        request.websiteCategory(),
                        request.projectAnswers(),
                        request.currentSummary()
                );

        return ResponseEntity.ok(summary);
    }
}