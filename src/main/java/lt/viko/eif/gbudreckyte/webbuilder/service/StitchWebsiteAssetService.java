
package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchWebsiteAssetRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchWebsiteAssetResponse;
import org.springframework.stereotype.Service;

@Service
public class StitchWebsiteAssetService {

    private final StitchGenerationService stitchGenerationService;
    private final StitchHtmlAssetService stitchHtmlAssetService;

    public StitchWebsiteAssetService(
            StitchGenerationService stitchGenerationService,
            StitchHtmlAssetService stitchHtmlAssetService
    ) {
        this.stitchGenerationService = stitchGenerationService;
        this.stitchHtmlAssetService = stitchHtmlAssetService;
    }

    public StitchWebsiteAssetResponse prepareWebsite(
            StitchWebsiteAssetRequest request
    ) {
        if (request == null ||
                request.screenId() == null ||
                request.screenId().isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch ekrano ID."
            );
        }

        String originalHtml =
                stitchGenerationService.getSavedHtml(
                        request.screenId()
                );

        String updatedHtml =
                stitchHtmlAssetService.insertAssets(
                        originalHtml,
                        request.logo(),
                        request.photos()
                );

        return new StitchWebsiteAssetResponse(
                request.screenId(),
                updatedHtml
        );
    }
}
