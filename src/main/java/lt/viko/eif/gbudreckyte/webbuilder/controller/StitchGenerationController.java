package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.contact.ProjectContactRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchSavedHtmlResponse;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.model.GenerationStatus;

import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import lt.viko.eif.gbudreckyte.webbuilder.service.WebsiteGenerationJobService;

import org.springframework.core.task.TaskRejectedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/stitch")
public class StitchGenerationController {

    private final WebsiteGenerationJobService websiteGenerationJobService;
    private final ProjectService projectService;

    public StitchGenerationController(
            WebsiteGenerationJobService websiteGenerationJobService,
            ProjectService projectService
    ) {
        this.websiteGenerationJobService =
                websiteGenerationJobService;

        this.projectService = projectService;
    }

    // =====================================================
    // ASINCHRONINIS SVETAINĖS GENERAVIMAS
    // =====================================================

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @RequestBody StitchGenerationRequest request,
            Authentication authentication
    ) {

        User currentUser =
                (User) authentication.getPrincipal();

        // 1. Patikriname užklausos duomenis.

        if (request.projectName() == null ||
                request.projectName().isBlank() ||
                request.websiteCategory() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trūksta projekto pavadinimo arba kategorijos."
            );
        }

        if (request.prompt() == null ||
                request.prompt().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trūksta svetainės generavimo instrukcijos."
            );
        }

        // 2. Išsaugome projektą prieš generavimą.
        // Projekto būsena nustatoma į PENDING.

        Project savedProject =
                projectService.prepareProjectForGeneration(
                        request.projectName(),
                        request.projectDescription(),
                        request.websiteCategory(),
                        request.webBuilderProjectId(),
                        currentUser,
                        request.contactInformation()
                );

        // 3. Gauname išsaugotus kontaktinius duomenis.
        // Jeigu nauji kontaktai neperduoti,
        // išlieka anksčiau išsaugoti kontaktai.

        ProjectContactRequest effectiveContacts =
                savedProject.getContactInformation();

        // 4. Paruošiame generavimo užklausą.

        StitchGenerationRequest generationRequest =
                new StitchGenerationRequest(
                        request.prompt(),
                        request.projectName(),
                        request.projectDescription(),
                        request.websiteCategory(),
                        savedProject.getId(),
                        effectiveContacts
                );

        // 5. Paleidžiame generavimą atskiroje gijoje.

        try {

            websiteGenerationJobService.generateWebsite(
                    savedProject.getId(),
                    generationRequest
            );

        } catch (TaskRejectedException exception) {

            projectService.markGenerationFailed(
                    savedProject.getId(),
                    "Generavimo sistema šiuo metu užimta. Bandykite vėliau."
            );

            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.<String, Object>of(
                            "webBuilderProjectId",
                            savedProject.getId(),

                            "generationStatus",
                            GenerationStatus.FAILED.name(),

                            "message",
                            "Generavimo sistema šiuo metu užimta."
                    ));
        }

        // 6. Grąžiname atsakymą nelaukdami
        // svetainės generavimo pabaigos.

        return ResponseEntity.accepted()
                .body(Map.<String, Object>of(
                        "webBuilderProjectId",
                        savedProject.getId(),

                        "generationStatus",
                        GenerationStatus.PENDING.name(),

                        "message",
                        "Svetainės generavimo užduotis priimta."
                ));
    }

    // =====================================================
    // GENERAVIMO BŪSENOS TIKRINIMAS
    // =====================================================

    @GetMapping("/generation-status/{projectId}")
    public ResponseEntity<Map<String, Object>> getGenerationStatus(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        User currentUser =
                (User) authentication.getPrincipal();

        // Tikriname, ar projektas priklauso
        // prisijungusiam vartotojui.

        Project project =
                projectService.getProjectById(
                        projectId,
                        currentUser
                );

        GenerationStatus generationStatus =
                project.getGenerationStatus();

        // Suderinamumas su anksčiau sukurtais projektais,
        // kurie dar neturėjo generavimo būsenos.

        if (generationStatus == null &&
                project.getStitchScreenId() != null &&
                project.getGeneratedHtml() != null &&
                !project.getGeneratedHtml().isBlank()) {

            generationStatus = GenerationStatus.COMPLETED;
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "webBuilderProjectId",
                project.getId()
        );

        response.put(
                "generationStatus",
                generationStatus != null
                        ? generationStatus.name()
                        : null
        );

        response.put(
                "generationError",
                project.getGenerationError()
        );

        response.put(
                "projectId",
                project.getStitchProjectId()
        );

        response.put(
                "screenId",
                project.getStitchScreenId()
        );

        return ResponseEntity.ok(response);
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