package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.refinement.RequirementRefinementResponse;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RequirementRefinementService {

    private static final int MAX_REFINEMENT_STEPS = 2;
    private static final String OTHER_OPTION = "Kita / dar nežinau";

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public RequirementRefinementService(
            GeminiService geminiService,
            ObjectMapper objectMapper
    ) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public RequirementRefinementResponse refineAudience(
            String answer,
            String websiteCategory,
            Map<String, String> projectAnswers,
            List<String> previousAnswers,
            int step
    ) {
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("Tikslinės auditorijos atsakymas negali būti tuščias.");
        }

        int currentStep = Math.max(0, step);
        if (currentStep >= MAX_REFINEMENT_STEPS) {
            return summarizeAudience(answer, websiteCategory, projectAnswers, previousAnswers);
        }

        String prompt = """
                Tu esi interneto svetainių planavimo asistentas.
                Įvertink, ar pakanka informacijos apie tikslinę auditoriją svetainei kurti.

                Svetainės kategorija: %s
                Projekto kontekstas:
                %s
                Pradinė auditorija: %s
                Ankstesni patikslinimo atsakymai:
                %s
                Dabartinis patikslinimo žingsnis: %d iš %d.

                Vertink tik projektui aktualius demografinius, geografinius,
                psichografinius ir elgsenos kriterijus.
                Šios kategorijos nėra privalomas klausimynas.
                Neklausk apie miestą, jei svetainė skirta globaliai auditorijai
                ir vietovė nėra svarbi. Neklausk apie amžių ar pajamas,
                jei tai neturėtų įtakos svetainei.
                Nekartok jau atsakytų klausimų.
                Papildomą klausimą užduok tik jei jo atsakymas realiai pakeistų
                svetainės turinį, struktūrą, funkcionalumą ar komunikaciją.
                Jei informacijos pakanka, klausimo neužduok ir pateik santrauką.
                Vienu kartu užduok daugiausia vieną klausimą.
                Iš viso leidžiama daugiausia du papildomi klausimai.
                Nepriskirk auditorijai savybių, kurių vartotojas nepateikė.

                Grąžink TIK JSON objektą su visais keturiais laukais.
                Jei reikia klausimo:
                {
                  "needsRefinement": true,
                  "question": "Vienas konkretus klausimas lietuviškai",
                  "options": ["Pirmas variantas", "Antras variantas", "Trečias variantas", "Kita / dar nežinau"],
                  "summary": null
                }
                Jei klausimo nereikia:
                {
                  "needsRefinement": false,
                  "question": null,
                  "options": [],
                  "summary": "1–3 sakinių tikslinės auditorijos santrauka"
                }
                Nerašyk patvirtinimų ar instrukcijų pakartojimų.
                Nenaudok laukų status, instruction ar acknowledged.
                """.formatted(
                safe(websiteCategory),
                buildProjectContext(projectAnswers),
                answer,
                buildPreviousAnswers(previousAnswers),
                currentStep + 1,
                MAX_REFINEMENT_STEPS
        );

        return generateAndParse(prompt, false);
    }

    private RequirementRefinementResponse summarizeAudience(
            String answer,
            String websiteCategory,
            Map<String, String> projectAnswers,
            List<String> previousAnswers
    ) {
        String prompt = """
                Tu esi interneto svetainių planavimo asistentas.
                Apibendrink vartotojo tikslinę auditoriją lietuviškai 1–3 sakiniais.

                Svetainės kategorija: %s
                Projekto kontekstas:
                %s
                Pradinė auditorija: %s
                Ankstesni patikslinimo atsakymai:
                %s

                Naudok tik vartotojo pateiktą informaciją.
                Neišgalvok amžiaus, gyvenamosios vietos, pajamų, poreikių ar kitų savybių.
                Išsaugok visas vartotojo nurodytas auditorijos grupes.
                Daugiau klausimų neužduok.

                Grąžink tik JSON:
                {
                  "needsRefinement": false,
                  "question": null,
                  "options": [],
                  "summary": "1–3 sakinių auditorijos apibendrinimas"
                }
                """.formatted(
                safe(websiteCategory),
                buildProjectContext(projectAnswers),
                answer,
                buildPreviousAnswers(previousAnswers)
        );

        return generateAndParse(prompt, true);
    }

    private RequirementRefinementResponse validateDecision(
            RequirementRefinementResponse result
    ) {

        if (result == null) {
            throw new RuntimeException(
                    "Gemini negrąžino auditorijos analizės."
            );
        }

        // Gemini nusprendė, kad papildomų klausimų nereikia.
        if (!result.needsRefinement()) {
            return validateSummary(result);
        }

        String question = result.question();

        if (question == null || question.isBlank()) {
            throw new RuntimeException(
                    "Gemini nurodė, kad reikia patikslinimo, " +
                            "bet nepateikė klausimo."
            );
        }

        List<String> options = normalizeOptions(result.options());

        if (options.size() != 4) {
            throw new RuntimeException(
                    "Gemini nepateikė trijų tinkamų " +
                            "atsakymo variantų."
            );
        }

        return new RequirementRefinementResponse(
                true,
                question.trim(),
                options,
                null
        );
    }

    private RequirementRefinementResponse validateSummary(
            RequirementRefinementResponse result
    ) {

        if (result == null ||
                result.summary() == null ||
                result.summary().isBlank()) {

            throw new RuntimeException(
                    "Gemini negrąžino tinkamos " +
                            "tikslinės auditorijos santraukos."
            );
        }

        return new RequirementRefinementResponse(
                false,
                null,
                List.of(),
                result.summary().trim()
        );
    }

    private List<String> normalizeOptions(
            List<String> options
    ) {

        if (options == null) {
            return List.of();
        }

        Set<String> uniqueOptions = new LinkedHashSet<>();

        for (String option : options) {

            if (option == null || option.isBlank()) {
                continue;
            }

            String cleaned = option.trim();

            if (cleaned.equalsIgnoreCase(OTHER_OPTION)) {
                continue;
            }

            uniqueOptions.add(cleaned);

            if (uniqueOptions.size() == 3) {
                break;
            }
        }

        List<String> result = new ArrayList<>(uniqueOptions);
        result.add(OTHER_OPTION);

        return result;
    }

    private String buildProjectContext(
            Map<String, String> projectAnswers
    ) {

        if (projectAnswers == null || projectAnswers.isEmpty()) {
            return "Papildomo projekto konteksto nėra.";
        }

        StringBuilder context = new StringBuilder();

        projectAnswers.forEach((question, answer) -> {

            if (answer == null || answer.isBlank()) {
                return;
            }

            context.append("Klausimas: ")
                    .append(question)
                    .append("\nAtsakymas: ")
                    .append(answer)
                    .append("\n\n");
        });

        return context.toString();
    }

    private String buildPreviousAnswers(
            List<String> previousAnswers
    ) {

        if (previousAnswers == null || previousAnswers.isEmpty()) {
            return "Ankstesnių patikslinimų nėra.";
        }

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < previousAnswers.size(); i++) {

            String answer = previousAnswers.get(i);

            if (answer == null || answer.isBlank()) {
                continue;
            }

            result.append(i + 1)
                    .append(". ")
                    .append(answer.trim())
                    .append("\n");
        }

        return result.length() == 0
                ? "Ankstesnių patikslinimų nėra."
                : result.toString();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private RequirementRefinementResponse generateAndParse(
            String prompt,
            boolean summaryOnly
    ) {
        Exception lastError = null;

        for (int attempt = 0; attempt < 2; attempt++) {
            String currentPrompt = attempt == 0
                    ? prompt
                    : prompt + """

                            Ankstesnis atsakymas neatitiko reikiamo formato.
                            Grąžink tik JSON objektą su needsRefinement (boolean),
                            question (string arba null), options (masyvas),
                            summary (string arba null).
                            Negrąžink instrukcijų patvirtinimo.
                            """;

            String aiResponse = geminiService.generate(currentPrompt);
            try {
                if (aiResponse == null || aiResponse.isBlank()) {
                    throw new IllegalArgumentException("Gemini grąžino tuščią atsakymą.");
                }

                String cleanJson = aiResponse
                        .replace("```json", "")
                        .replace("```JSON", "")
                        .replace("```", "")
                        .trim();

                var root = objectMapper.readTree(cleanJson);
                if (!root.isObject()
                        || !root.has("needsRefinement")
                        || !root.get("needsRefinement").isBoolean()
                        || !root.has("question")
                        || !root.has("options")
                        || !root.get("options").isArray()
                        || !root.has("summary")) {
                    throw new IllegalArgumentException("Gemini JSON neturi privalomų laukų arba neteisingi jų tipai.");
                }

                RequirementRefinementResponse result = objectMapper.readValue(
                        cleanJson, RequirementRefinementResponse.class
                );
                if (summaryOnly) {
                    if (result.needsRefinement()) {
                        throw new IllegalArgumentException("Vietoje santraukos Gemini pateikė papildomą klausimą.");
                    }
                    return validateSummary(result);
                }
                return validateDecision(result);
            } catch (Exception e) {
                lastError = e;
                System.err.println("Gemini atsakymo klaida, bandymas "
                        + (attempt + 1) + ": " + e.getMessage());
            }
        }

        throw new RuntimeException(
                "Gemini nepavyko pateikti tinkamo auditorijos atsakymo po 2 bandymų.",
                lastError
        );
    }
}

