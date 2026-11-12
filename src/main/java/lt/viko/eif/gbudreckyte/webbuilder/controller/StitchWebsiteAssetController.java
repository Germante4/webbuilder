
package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchWebsiteAssetRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchWebsiteAssetResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.StitchWebsiteAssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stitch")
public class StitchWebsiteAssetController {

    private final StitchWebsiteAssetService stitchWebsiteAssetService;

    public StitchWebsiteAssetController(
            StitchWebsiteAssetService stitchWebsiteAssetService
    ) {
        this.stitchWebsiteAssetService = stitchWebsiteAssetService;
    }

    @PostMapping("/prepare-website")
    public ResponseEntity<StitchWebsiteAssetResponse> prepareWebsite(
            @RequestBody StitchWebsiteAssetRequest request
    ) {
        return ResponseEntity.ok(
                stitchWebsiteAssetService.prepareWebsite(request)
        );
    }
}
