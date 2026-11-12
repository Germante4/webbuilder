
package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchSavedHtmlResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class StitchGenerationService {

    private final RestClient restClient;
    private final String internalToken;

    public StitchGenerationService(
            @Value("${stitch.service.url:http://127.0.0.1:3001}")
            String serviceUrl,

            @Value("${stitch.internal.token}")
            String internalToken
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(serviceUrl)
                .build();

        this.internalToken = internalToken;
    }

    public StitchGenerationResponse generate(
            StitchGenerationRequest request
    ) {
        if (request == null ||
                request.prompt() == null ||
                request.prompt().isBlank()) {

            throw new IllegalArgumentException(
                    "Stitch promptas negali būti tuščias."
            );
        }

        System.out.println(
                "\n========== SPRING → STITCH =========="
        );
        System.out.println(request.prompt());
        System.out.println(
                "=====================================\n"
        );

        StitchGenerationResponse response = restClient.post()
                .uri("/generate")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prompt", request.prompt()))
                .retrieve()
                .body(StitchGenerationResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                    "Stitch negrąžino generavimo rezultato."
            );
        }

        return response;
    }


    public StitchGenerationResponse refine(
            String projectId,
            String screenId,
            String instruction,
            String currentHtml
    ) {
        if (projectId == null || projectId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch projekto ID."
            );
        }

        if (screenId == null || screenId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch ekrano ID."
            );
        }

        if (instruction == null ||
                instruction.isBlank() ||
                instruction.length() > 5000) {
            throw new IllegalArgumentException(
                    "AI redagavimo instrukcija turi būti nuo 1 iki 5000 simbolių."
            );
        }

        if (currentHtml == null || currentHtml.isBlank()) {
            throw new IllegalArgumentException(
                    "Projektas neturi išsaugoto HTML redagavimui."
            );
        }

        StitchGenerationResponse response = restClient.post()
                .uri("/refine")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "projectId", projectId,
                        "screenId", screenId,
                        "instruction", instruction,
                        "currentHtml", currentHtml
                ))
                .retrieve()
                .body(StitchGenerationResponse.class);

        if (response == null ||
                response.screenId() == null ||
                response.screenId().isBlank()) {
            throw new IllegalStateException(
                    "Stitch negrąžino AI dizaino kandidato ID."
            );
        }

        if (screenId.equals(response.screenId())) {
            throw new IllegalStateException(
                    "AI redagavimas nesukūrė atskiros kandidato versijos."
            );
        }

        return response;
    }


    public String getSavedHtml(String screenId) {

        if (screenId == null || screenId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch ekrano ID."
            );
        }

        StitchSavedHtmlResponse response = restClient.post()
                .uri("/saved-html")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("screenId", screenId))
                .retrieve()
                .body(StitchSavedHtmlResponse.class);

        if (response == null ||
                response.html() == null ||
                response.html().isBlank()) {

            throw new IllegalStateException(
                    "Nepavyko gauti išsaugoto Stitch HTML."
            );
        }

        return response.html();
    }
}
