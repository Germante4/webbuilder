package lt.viko.eif.gbudreckyte.webbuilder.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final String apiKey;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.model}") String model,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String generate(String prompt) {
        return generateWithFormat(prompt, "application/json");
    }

    public String generateText(String prompt) {
        return generateWithFormat(prompt, "text/plain");
    }

    private String generateWithFormat(String prompt, String responseMimeType) {
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("Gemini užklausos tekstas negali būti tuščias.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", responseMimeType)
        );

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class
            );

            if (response.getBody() == null || response.getBody().isBlank()) {
                throw new IllegalStateException("Gemini API grąžino tuščią atsakymą.");
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new IllegalStateException(
                        "Gemini negrąžino sugeneruoto atsakymo (galimas saugos filtras)."
                );
            }

            JsonNode parts = candidates.path(0).path("content").path("parts");
            if (!parts.isArray()) {
                throw new IllegalStateException("Gemini atsakyme nėra teksto dalių.");
            }

            StringBuilder result = new StringBuilder();
            for (JsonNode part : parts) {
                JsonNode text = part.path("text");
                if (text.isTextual()) {
                    result.append(text.asText());
                }
            }

            if (result.toString().isBlank()) {
                throw new IllegalStateException("Gemini grąžino atsakymą be teksto.");
            }
            return result.toString().trim();

        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new IllegalStateException(
                    "Viršytas Gemini API užklausų limitas (429). Pabandykite vėliau.", e
            );
        } catch (HttpClientErrorException e) {
            throw new IllegalStateException(
                    "Gemini API atmetė užklausą (HTTP " + e.getStatusCode().value()
                            + "). Patikrinkite API raktą, modelį ir užklausą.", e
            );
        } catch (HttpServerErrorException e) {
            throw new IllegalStateException(
                    "Gemini API serverio klaida (HTTP " + e.getStatusCode().value() + ").", e
            );
        } catch (ResourceAccessException e) {
            throw new IllegalStateException(
                    "Nepavyko prisijungti prie Gemini API arba baigėsi laukimo laikas.", e
            );
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Nepavyko apdoroti Gemini API atsakymo.", e);
        }
    }
}
