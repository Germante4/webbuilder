package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchPromptRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchPromptResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.StitchPromptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stitch-prompt")
public class StitchPromptController {

    private final StitchPromptService stitchPromptService;

    public StitchPromptController(
            StitchPromptService stitchPromptService
    ) {
        this.stitchPromptService = stitchPromptService;
    }

    @PostMapping("/generate")
    public ResponseEntity<StitchPromptResponse> generate(
            @RequestBody StitchPromptRequest request
    ) {

        StitchPromptResponse response =
                stitchPromptService.generate(request);

        return ResponseEntity.ok(response);
    }
}