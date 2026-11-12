package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.RequirementAnswerRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.RequirementAnswerResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementAnswer;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.service.RequirementAnswerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/requirements/answers")
public class RequirementAnswerController {

    private final RequirementAnswerService requirementAnswerService;

    public RequirementAnswerController(
            RequirementAnswerService requirementAnswerService
    ) {
        this.requirementAnswerService = requirementAnswerService;
    }

    @PostMapping
    public ResponseEntity<RequirementAnswerResponse> saveAnswer(
            @PathVariable Long projectId,
            @RequestBody RequirementAnswerRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        RequirementAnswer answer =
                requirementAnswerService.saveAnswer(
                        projectId,
                        request,
                        user
                );

        RequirementAnswerResponse response =
                new RequirementAnswerResponse(
                        answer.getId(),
                        answer.getQuestion().getId(),
                        answer.getAnswerText()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<RequirementAnswerResponse>> getProjectAnswers(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        List<RequirementAnswerResponse> responses =
                requirementAnswerService
                        .getProjectAnswers(projectId, user)
                        .stream()
                        .map(answer -> new RequirementAnswerResponse(
                                answer.getId(),
                                answer.getQuestion().getId(),
                                answer.getAnswerText()
                        ))
                        .toList();

        return ResponseEntity.ok(responses);
    }
}