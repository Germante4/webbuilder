package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.design.DesignSummaryRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.design.DesignSummaryResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.DesignSummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/design-summary")
public class DesignSummaryController {

    private final DesignSummaryService designSummaryService;

    public DesignSummaryController(
            DesignSummaryService designSummaryService
    ) {
        this.designSummaryService = designSummaryService;
    }

    @PostMapping("/generate")
    public ResponseEntity<DesignSummaryResponse> generate(
            @RequestBody DesignSummaryRequest request
    ) {

        DesignSummaryResponse response =
                designSummaryService.generate(request);

        return ResponseEntity.ok(response);
    }
}