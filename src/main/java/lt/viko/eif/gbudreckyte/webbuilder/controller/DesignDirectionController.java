package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.design.*;
import lt.viko.eif.gbudreckyte.webbuilder.service.DesignDirectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/design-directions")
public class DesignDirectionController {

    private final DesignDirectionService designDirectionService;

    public DesignDirectionController(
            DesignDirectionService designDirectionService
    ) {
        this.designDirectionService =
                designDirectionService;
    }

    @PostMapping("/generate")
    public ResponseEntity<DesignDirectionsResponse> generate(
            @RequestBody DesignDirectionsRequest request
    ) {

        return ResponseEntity.ok(
                designDirectionService.generate(request)
        );
    }
}