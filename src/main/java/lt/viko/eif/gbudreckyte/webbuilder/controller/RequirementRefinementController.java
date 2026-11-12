package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.refinement.RequirementRefinementRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.refinement.RequirementRefinementResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.RequirementRefinementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requirements")
public class RequirementRefinementController {


    private final RequirementRefinementService requirementRefinementService;

    public RequirementRefinementController(
            RequirementRefinementService requirementRefinementService
    ) {
        this.requirementRefinementService = requirementRefinementService;
    }

    @PostMapping("/refine-audience")
    public ResponseEntity<RequirementRefinementResponse> refineAudience(
            @RequestBody RequirementRefinementRequest request
    ) {
        System.out.println("AUDITORIJOS KONTROLERIS PASIEKTAS");
        RequirementRefinementResponse response =
                requirementRefinementService.refineAudience(
                        request.answer(),
                        request.websiteCategory(),
                        request.projectAnswers(),
                        request.previousAnswers(),
                        request.step()
                );

        return ResponseEntity.ok(response);
    }
}