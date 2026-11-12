package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.design.*;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class DesignDirectionService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public DesignDirectionService(
            GeminiService geminiService,
            ObjectMapper objectMapper
    ) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public DesignDirectionsResponse generate(
            DesignDirectionsRequest request
    ) {

        String projectSummary =
                toJson(request.projectSummary());

        String designSummary =
                toJson(request.designSummary());

        String prompt = """
                Tu esi profesionalus web dizaineris.

                Tavo užduotis – pagal pateiktą projekto informaciją
                sukurti 3 SKIRTINGAS būsimos svetainės vizualines
                kryptis.

                Tai dar nėra galutinis svetainės dizainas.

                Vartotojas matys šias tris kryptis ir pasirinks,
                kuri geriausiai atitinka jo viziją.

                =========================
                PROJEKTO INFORMACIJA
                =========================

                %s

                =========================
                DIZAINO INFORMACIJA
                =========================

                %s

                =========================
                SVARBU
                =========================

                Visos 3 kryptys turi atitikti vartotojo pateiktą
                informaciją, tačiau turi ją interpretuoti skirtingai.

                Kryptys turi būti aiškiai vizualiai skirtingos.

                Nekeisk:
                - verslo esmės;
                - tikslinės auditorijos;
                - vartotojo pateiktų reikalavimų;
                - pateiktų prekės ženklo spalvų;
                - pateiktų šriftų;
                - turimų failų.

                Gali keisti:
                - kompozicijos charakterį;
                - vizualinę hierarchiją;
                - fotografijų naudojimą;
                - informacijos tankį;
                - tipografijos charakterį;
                - erdvės naudojimą;
                - bendrą dizaino nuotaiką.

                Jeigu konkrečios spalvos nebuvo pateiktos,
                nesugalvok HEX kodų.

                Jeigu konkretūs šriftai nebuvo pateikti,
                nesugalvok šriftų pavadinimų.

                =========================
                3 KRYPTYS
                =========================

                Sukurk būtent 3 kryptis.

                Jos NEGALI būti tik nežymios tos pačios
                idėjos variacijos.

                Pavyzdžiui viena gali labiau akcentuoti
                fotografiją, kita – istorijos pasakojimą,
                trečia – minimalizmą.

                Tačiau pasirink konkrečiam projektui tinkamiausius
                skirtumus.

                Kryptims suteik trumpus, profesionalius
                pavadinimus.

                Aprašymus rašyk LIETUVIŠKAI ir taip, kad juos
                suprastų žmogus, kuris nėra dizaineris.

                =========================
                JSON
                =========================

                Grąžink TIK validų JSON:

                {
                  "directions": [
                    {
                      "id": "direction-1",
                      "name": "...",
                      "tagline": "...",
                      "description": "...",
                      "layoutDirection": "...",
                      "typographyDirection": "...",
                      "imageDirection": "...",
                      "colorDirection": "...",
                      "mood": "..."
                    },
                    {
                      "id": "direction-2",
                      "name": "...",
                      "tagline": "...",
                      "description": "...",
                      "layoutDirection": "...",
                      "typographyDirection": "...",
                      "imageDirection": "...",
                      "colorDirection": "...",
                      "mood": "..."
                    },
                    {
                      "id": "direction-3",
                      "name": "...",
                      "tagline": "...",
                      "description": "...",
                      "layoutDirection": "...",
                      "typographyDirection": "...",
                      "imageDirection": "...",
                      "colorDirection": "...",
                      "mood": "..."
                    }
                  ]
                }

                Jokio Markdown.
                Jokio papildomo teksto.
                """.formatted(
                projectSummary,
                designSummary
        );

        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            String aiResponse = geminiService.generate(prompt);
            try {
                if (aiResponse == null || aiResponse.isBlank()) {
                    throw new IllegalStateException("Gemini grąžino tuščią atsakymą.");
                }
                String cleanJson = aiResponse.replace("```json", "")
                        .replace("```JSON", "")
                        .replace("```", "").trim();
                DesignDirectionsResponse response = objectMapper.readValue(
                        cleanJson, DesignDirectionsResponse.class);
                validate(response);
                return response;
            } catch (JacksonException | IllegalStateException e) {
                lastError = new IllegalStateException(
                        "Netinkamas Gemini dizaino krypčių atsakymas (bandymas "
                                + attempt + "/2): " + e.getMessage(), e);
            }
        }
        throw lastError;
    }

    private void validate(DesignDirectionsResponse response) {
        if (response == null || response.directions() == null
                || response.directions().size() != 3) {
            throw new IllegalStateException("Gemini turi grąžinti tiksliai 3 kryptis.");
        }
        java.util.Set<String> ids = new java.util.HashSet<>();
        for (int i = 0; i < 3; i++) {
            DesignDirectionResponse direction = response.directions().get(i);
            if (direction == null) {
                throw new IllegalStateException("Tuščia dizaino kryptis.");
            }
            requireText(direction.id(), "id");
            requireText(direction.name(), "name");
            requireText(direction.tagline(), "tagline");
            requireText(direction.description(), "description");
            requireText(direction.layoutDirection(), "layoutDirection");
            requireText(direction.typographyDirection(), "typographyDirection");
            requireText(direction.imageDirection(), "imageDirection");
            requireText(direction.colorDirection(), "colorDirection");
            requireText(direction.mood(), "mood");
            if (!ids.add(direction.id().trim())) {
                throw new IllegalStateException("Dizaino krypčių ID turi būti skirtingi.");
            }
        }
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Trūksta dizaino krypties lauko: " + field);
        }
    }

    private String toJson(Object object) {

        try {
            return objectMapper.writeValueAsString(object);
        } catch (JacksonException e) {
            throw new RuntimeException(
                    "Nepavyko paruošti projekto informacijos.",
                    e
            );
        }
    }
}