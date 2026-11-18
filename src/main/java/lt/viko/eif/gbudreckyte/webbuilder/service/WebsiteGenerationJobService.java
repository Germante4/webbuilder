package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class WebsiteGenerationJobService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    WebsiteGenerationJobService.class
            );

    private final StitchGenerationService stitchGenerationService;
    private final ProjectService projectService;

    public WebsiteGenerationJobService(
            StitchGenerationService stitchGenerationService,
            ProjectService projectService
    ) {
        this.stitchGenerationService = stitchGenerationService;
        this.projectService = projectService;
    }

    // =====================================================
    // ASINCHRONINIS SVETAINĖS GENERAVIMAS
    // =====================================================

    @Async("websiteGenerationExecutor")
    public void generateWebsite(
            Long projectId,
            StitchGenerationRequest request
    ) {

        log.info(
                "Pradedamas svetainės generavimas. Projekto ID: {}",
                projectId
        );

        // ========================================
        // 1. ATNAUJINAME GENERAVIMO BŪSENĄ
        // ========================================

        try {

            projectService.markGenerationStarted(projectId);

        } catch (Exception exception) {

            log.error(
                    "Nepavyko pradėti generavimo. Projekto ID: {}",
                    projectId,
                    exception
            );

            return;
        }

        try {

            // ========================================
            // 2. GENERUOJAME SVETAINĘ SU STITCH
            // ========================================

            StitchGenerationResponse response =
                    stitchGenerationService.generate(request);

            if (response == null) {

                throw new IllegalStateException(
                        "Stitch negrąžino generavimo rezultato."
                );
            }

            if (response.projectId() == null ||
                    response.projectId().isBlank()) {

                throw new IllegalStateException(
                        "Stitch negrąžino projekto ID."
                );
            }

            if (response.screenId() == null ||
                    response.screenId().isBlank()) {

                throw new IllegalStateException(
                        "Stitch negrąžino ekrano ID."
                );
            }

            log.info(
                    "Stitch sugeneravo dizainą. Projekto ID: {}, Screen ID: {}",
                    projectId,
                    response.screenId()
            );

            // ========================================
            // 3. GAUNAME SUGENERUOTĄ HTML
            // ========================================

            String html =
                    stitchGenerationService.getSavedHtml(
                            response.screenId()
                    );

            if (html == null || html.isBlank()) {

                throw new IllegalStateException(
                        "Sugeneruotos svetainės HTML yra tuščias."
                );
            }

            // ========================================
            // 4. IŠSAUGOME REZULTATĄ POSTGRESQL
            // ========================================

            projectService.completeGeneration(
                    projectId,
                    response.projectId(),
                    response.screenId(),
                    html
            );

            log.info(
                    "Svetainė sėkmingai sugeneruota ir išsaugota. Projekto ID: {}",
                    projectId
            );

        } catch (Exception exception) {

            // ========================================
            // 5. APDOROJAME GENERAVIMO KLAIDAS
            // ========================================

            log.error(
                    "Svetainės generavimas nepavyko. Projekto ID: {}",
                    projectId,
                    exception
            );

            try {

                projectService.markGenerationFailed(
                        projectId,
                        "Nepavyko sugeneruoti svetainės. Bandykite dar kartą."
                );

            } catch (Exception saveException) {

                log.error(
                        "Nepavyko išsaugoti generavimo klaidos. Projekto ID: {}",
                        projectId,
                        saveException
                );
            }
        }
    }
}