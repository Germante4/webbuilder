
package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectCandidate;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectCandidateService;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import lt.viko.eif.gbudreckyte.webbuilder.service.StitchGenerationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class ProjectCandidateController {

    private final ProjectService projectService;
    private final ProjectCandidateService candidateService;
    private final StitchGenerationService stitchService;

    public ProjectCandidateController(
            ProjectService projectService,
            ProjectCandidateService candidateService,
            StitchGenerationService stitchService
    ) {
        this.projectService = projectService;
        this.candidateService = candidateService;
        this.stitchService = stitchService;
    }

    public record RefineRequest(String instruction) {}

    public record ChooseRequest(String selectedVersion) {}

    public record CandidateResponse(
            Long id,
            Long projectId,
            String screenId,
            String html,
            String instruction
    ) {}

    public record SelectionResponse(
            Long projectId,
            String selectedVersion,
            String screenId
    ) {}

    @PostMapping("/refine")
    public ResponseEntity<CandidateResponse> refine(
            @PathVariable Long projectId,
            @RequestBody RefineRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        Project project = projectService.getProjectById(
                projectId, user
        );

        if (request == null ||
                request.instruction() == null ||
                request.instruction().isBlank() ||
                request.instruction().length() > 5000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nurodykite AI redagavimo instrukciją."
            );
        }

        if (project.getStitchProjectId() == null ||
                project.getStitchScreenId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Projektas dar neturi sugeneruotos svetainės."
            );
        }

        // Tikriname prieš generavimą, kad neeikvotume AI užklausos.
        if (candidateService.hasCandidate(projectId, user)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pirmiausia pasirinkite jau sugeneruotą versiją."
            );
        }

        StitchGenerationResponse result = stitchService.refine(
                project.getStitchProjectId(),
                project.getStitchScreenId(),
                request.instruction(),
                project.getGeneratedHtml()
        );

        String html = stitchService.getSavedHtml(
                result.screenId()
        );

        ProjectCandidate candidate = candidateService.saveCandidate(
                projectId,
                result.projectId(),
                result.screenId(),
                html,
                request.instruction(),
                user
        );

        return ResponseEntity.ok(toResponse(candidate));
    }

    @GetMapping("/candidate")
    public ResponseEntity<CandidateResponse> getCandidate(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        ProjectCandidate candidate =
                candidateService.getCandidate(projectId, user);

        return ResponseEntity.ok(toResponse(candidate));
    }

    @PostMapping("/candidate/choose")
    public ResponseEntity<SelectionResponse> choose(
            @PathVariable Long projectId,
            @RequestBody ChooseRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        if (request == null ||
                (!"CURRENT".equals(request.selectedVersion()) &&
                        !"NEW".equals(request.selectedVersion()))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pasirinkite CURRENT arba NEW."
            );
        }

        Project project = candidateService.chooseVersion(
                projectId,
                request.selectedVersion(),
                user
        );

        return ResponseEntity.ok(
                new SelectionResponse(
                        project.getId(),
                        request.selectedVersion(),
                        project.getStitchScreenId()
                )
        );
    }

    private CandidateResponse toResponse(ProjectCandidate candidate) {
        return new CandidateResponse(
                candidate.getId(),
                candidate.getProject().getId(),
                candidate.getStitchScreenId(),
                candidate.getGeneratedHtml(),
                candidate.getInstruction()
        );
    }
}
