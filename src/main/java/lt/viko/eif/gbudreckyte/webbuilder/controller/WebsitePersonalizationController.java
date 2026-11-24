package lt.viko.eif.gbudreckyte.webbuilder.controller;

import jakarta.validation.Valid;
import lt.viko.eif.gbudreckyte.webbuilder.dto.personalization.WebsitePersonalizationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.personalization.WebsitePersonalizationResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.service.WebsitePersonalizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/projects/{id}/personalization")
public class WebsitePersonalizationController {

    private final WebsitePersonalizationService personalizationService;

    public WebsitePersonalizationController(
            WebsitePersonalizationService personalizationService
    ) {
        this.personalizationService = personalizationService;
    }

    @GetMapping
    public ResponseEntity<WebsitePersonalizationResponse> getPersonalization(
            @PathVariable("id") Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(personalizationService.getPersonalization(
                id, currentUser(authentication)
        ));
    }

    @PutMapping
    public ResponseEntity<WebsitePersonalizationResponse> savePersonalization(
            @PathVariable("id") Long id,
            @Valid @RequestBody WebsitePersonalizationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(personalizationService.savePersonalization(
                id, currentUser(authentication), request
        ));
    }

    @DeleteMapping
    public ResponseEntity<WebsitePersonalizationResponse> resetPersonalization(
            @PathVariable("id") Long id,
            @RequestParam("version") Long version,
            Authentication authentication
    ) {
        if (version < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Personalizavimo versija negali būti neigiama.");
        }
        return ResponseEntity.ok(personalizationService.resetPersonalization(
                id, currentUser(authentication), version
        ));
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Vartotojas neprisijungęs.");
        }
        return user;
    }
}
