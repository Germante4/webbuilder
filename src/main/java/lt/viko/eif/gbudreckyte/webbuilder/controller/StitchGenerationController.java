
package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.contact.ProjectContactRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchSavedHtmlResponse;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;

import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import lt.viko.eif.gbudreckyte.webbuilder.service.StitchGenerationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stitch")
public class StitchGenerationController {

    private final StitchGenerationService stitchGenerationService;
    private final ProjectService projectService;

    public StitchGenerationController(
            StitchGenerationService stitchGenerationService,
            ProjectService projectService
    ) {
        this.stitchGenerationService = stitchGenerationService;
        this.projectService = projectService;
    }

    // =====================================================
    // SVETAINĖS GENERAVIMAS
    // =====================================================

    @PostMapping("/generate")
    public ResponseEntity<StitchGenerationResponse> generate(
            @RequestBody StitchGenerationRequest request,
            Authentication authentication
    ) {
        User currentUser =
                (User) authentication.getPrincipal();

        if (request.projectName() == null ||
                request.projectName().isBlank() ||
                request.websiteCategory() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trūksta projekto pavadinimo arba kategorijos."
            );
        }

        // Jei projektas jau egzistuoja, patikriname
        // jo savininką prieš kviesdami Stitch.
        Project existingProject = null;

        if (request.webBuilderProjectId() != null) {
            existingProject = projectService.getProjectById(
                    request.webBuilderProjectId(),
                    currentUser
            );
        }

        // Jei kontaktai neperduoti, naudojame anksčiau
        // išsaugotus, kad jie liktų ir naujame dizaine.
        ProjectContactRequest effectiveContacts =
                request.contactInformation();

        if (effectiveContacts == null &&
                existingProject != null) {

            effectiveContacts =
                    existingProject.getContactInformation();
        }

        // Paruošiame užklausą Stitch generavimui.
        StitchGenerationRequest generationRequest =
                new StitchGenerationRequest(
                        request.prompt(),
                        request.projectName(),
                        request.projectDescription(),
                        request.websiteCategory(),
                        request.webBuilderProjectId(),
                        effectiveContacts
                );

        // 1. Sugeneruojame svetainę.
        StitchGenerationResponse response =
                stitchGenerationService.generate(
                        generationRequest
                );

        if (response.screenId() == null ||
                response.screenId().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stitch negrąžino ekrano ID."
            );
        }

        // 2. Gauname sugeneruotą HTML.
        String html = stitchGenerationService.getSavedHtml(
                response.screenId()
        );

        // 3. Išsaugome naują projektą arba
        // atnaujiname esamą.
        Project savedProject;

        if (existingProject == null) {

            savedProject = projectService.saveGeneratedProject(
                    request.projectName(),
                    request.projectDescription(),
                    request.websiteCategory(),
                    response.projectId(),
                    response.screenId(),
                    html,
                    currentUser,
                    effectiveContacts
            );

        } else {

            savedProject = projectService.updateGeneratedDesign(
                    existingProject,
                    response.projectId(),
                    response.screenId(),
                    html,
                    effectiveContacts
            );
        }

        return ResponseEntity.ok(
                new StitchGenerationResponse(
                        response.projectId(),
                        response.screenId(),
                        response.html(),
                        response.image(),
                        savedProject.getId()
                )
        );
    }

    // =====================================================
    // IŠSAUGOTO HTML GAVIMAS
    // =====================================================

    @GetMapping("/saved-html/{screenId}")
    public ResponseEntity<StitchSavedHtmlResponse> getSavedHtml(
            @PathVariable String screenId,
            Authentication authentication
    ) {
        User currentUser =
                (User) authentication.getPrincipal();

        Project project = projectService
                .getProjectByStitchScreenId(
                        screenId,
                        currentUser
                );

        return ResponseEntity.ok(
                new StitchSavedHtmlResponse(
                        screenId,
                        project.getGeneratedHtml()
                )
        );
    }
}
