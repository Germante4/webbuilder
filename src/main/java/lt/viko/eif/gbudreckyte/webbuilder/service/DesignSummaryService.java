package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.design.DesignSummaryRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.design.DesignSummaryResponse;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class DesignSummaryService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public DesignSummaryService(
            GeminiService geminiService,
            ObjectMapper objectMapper
    ) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public DesignSummaryResponse generate(
            DesignSummaryRequest request
    ) {

        String projectSummaryJson =
                toJson(request.projectSummary());

        String designAnswersJson =
                toJson(request);

        String prompt = """
                Tu esi profesionalus interneto svetainių
                UX/UI dizaino analizės asistentas.

                Tavo užduotis – iš vartotojo pateiktos
                informacijos suformuoti aiškų būsimos
                interneto svetainės vizualinį briefą.

                Ši informacija vėliau bus perduota kitam AI
                modeliui, kuris generuos svetainės dizainą.

                Todėl rezultatas turi būti konkretus,
                struktūrizuotas ir naudingas svetainės
                generavimui.

                SVARBU:
                - Nepridėk konkrečių dizaino sprendimų, kurių negalima
                  pagrįsti vartotojo atsakymais.
                
                - Nepriskirk konkrečių spalvų, spalvų pavadinimų ar HEX
                  reikšmių, jeigu vartotojas jų nepateikė.
                
                - Jei vartotojas pasirinko tik bendrą spalvinę kryptį,
                  pvz. "Šviesi ir neutrali", išsaugok būtent bendrą
                  kryptį ir neišgalvok konkrečios paletės.
                
                - Nepriskirk konkretaus elementų išdėstymo, lygiavimo,
                  animacijų ar kitų UI sprendimų, jeigu jie neišplaukia
                  iš vartotojo pasirinkimų.
                
                - Gali pateikti aukšto lygio dizaino rekomendacijas,
                  tačiau aiškiai remkis vartotojo pateikta informacija.

                - Remkis projekto kontekstu ir vartotojo
                  dizaino pasirinkimais.

                - Nesugalvok faktų apie verslą, kurių
                  vartotojas nepateikė.

                - Gali interpretuoti dizaino pasirinkimus.
                  Pavyzdžiui, jei pasirinkta minimalistinė,
                  elegantiška kryptis ir vartotojui svarbios
                  fotografijos, gali nurodyti, kad dizainas
                  turėtų suteikti daug vizualinės erdvės
                  fotografijoms.

                - Nerašyk reklaminio teksto.

                - Nekurk svetainės turinio, kurio vartotojas
                  nepateikė.

                - Nepriskirk konkrečių spalvų HEX kodų,
                  jeigu vartotojas jų nepateikė.

                - Nepriskirk konkrečių šriftų, jeigu
                  vartotojas jų nepateikė.

                - Jei vartotojas pateikė reference svetainę,
                  atsižvelk į jo paaiškinimą, kas konkrečiai
                  joje patinka.

                - Vien URL nepakanka teigti, kaip svetainė
                  atrodo. Tu nematai svetainės turinio,
                  nebent jis pateiktas atskirai.

                - designBrief turi apjungti visą turimą
                  informaciją į aiškią dizaino kryptį.

                =========================
                PROJEKTO SANTRAUKA
                =========================

                %s

                =========================
                DIZAINO INFORMACIJA
                =========================

                %s

                =========================
                LAUKŲ REIKŠMĖS
                =========================

                visualStyles:
                vartotojo pasirinktos pagrindinės
                vizualinio stiliaus kryptys.

                visualDirection:
                trumpas AI suformuotas apibendrinimas,
                kokio bendro vizualinio charakterio
                reikia svetainei.

                colorDirection:
                vartotojo pasirinkta spalvinė kryptis.

                brandColors:
                vartotojo pateiktos prekės ženklo spalvos.
                Jei nepateikė – null.

                typography:
                vartotojo pateikti šriftai.
                Jei nepateikė – null.

                referenceWebsite:
                vartotojo pateikta svetainės nuoroda.
                Jei nėra – null.

                referencePreferences:
                kas vartotojui patinka reference svetainėje
                ir ką norėtų panašaus savo svetainėje.

                hasLogo:
                ar realiai buvo įkeltas logotipo failas.

                hasPhotos:
                ar realiai buvo įkelta bent viena nuotrauka.

                hasBrandFile:
                ar realiai buvo įkeltas brand failas.

                hasPreparedTexts:
                ar realiai buvo įkeltas bent vienas
                tekstų failas.

                designBrief:
                išsamus 1–3 pastraipų vizualinis briefas
                kitam AI modeliui.

                designBrief turi paaiškinti:

                - bendrą vizualinę kryptį;
                - kokį įspūdį turi kurti svetainė;
                - kaip dizainas turėtų palaikyti projekto
                  tikslą ir auditoriją;
                - ką verta akcentuoti vizualiai;
                - kaip panaudoti vartotojo turimą medžiagą;
                - kokių vartotojo nurodytų reference
                  elementų verta siekti.

                =========================
                ATSAKYMO FORMATAS
                =========================

                Grąžink TIK validų JSON:

                {
                  "visualStyles": [],
                  "visualDirection": "...",
                  "colorDirection": "...",
                  "brandColors": null,
                  "typography": null,
                  "referenceWebsite": null,
                  "referencePreferences": null,
                  "hasLogo": false,
                  "hasPhotos": false,
                  "hasBrandFile": false,
                  "hasPreparedTexts": false,
                  "designBrief": "..."
                }

                Jokio Markdown.
                Jokio teksto prieš JSON.
                Jokio teksto po JSON.
                """.formatted(
                projectSummaryJson,
                designAnswersJson
        );

        return generateAndParse(prompt);
    }

    private String toJson(Object object) {

        if (object == null) {
            return "null";
        }

        try {
            return objectMapper.writeValueAsString(object);
        } catch (JacksonException e) {
            throw new RuntimeException(
                    "Nepavyko paruošti dizaino informacijos.",
                    e
            );
        }
    }

    private DesignSummaryResponse generateAndParse(String prompt) {
        RuntimeException lastError = null;

        for (int attempt = 1; attempt <= 2; attempt++) {
            // API ryšio klaidos neturėtų būti painiojamos su blogu JSON.
            String aiResponse = geminiService.generate(prompt);
            try {
                if (aiResponse == null || aiResponse.isBlank()) {
                    throw new IllegalStateException("Gemini grąžino tuščią atsakymą.");
                }
                String cleanJson = aiResponse.replace("```json", "")
                        .replace("```JSON", "")
                        .replace("```", "").trim();
                DesignSummaryResponse response = objectMapper.readValue(
                        cleanJson, DesignSummaryResponse.class);
                validate(response);
                return response;
            } catch (JacksonException | IllegalStateException e) {
                lastError = new IllegalStateException(
                        "Netinkamas Gemini dizaino santraukos atsakymas (bandymas "
                                + attempt + "/2): " + e.getMessage(), e);
            }
        }
        throw lastError;
    }

    private void validate(DesignSummaryResponse response) {
        if (response == null) {
            throw new IllegalStateException("Dizaino santrauka yra null.");
        }
        if (response.visualStyles() == null || response.visualStyles().isEmpty()
                || response.visualStyles().stream().anyMatch(
                style -> style == null || style.isBlank())) {
            throw new IllegalStateException("Trūksta visualStyles.");
        }
        requireText(response.visualDirection(), "visualDirection");
        requireText(response.designBrief(), "designBrief");
        if (response.hasLogo() == null || response.hasPhotos() == null
                || response.hasBrandFile() == null || response.hasPreparedTexts() == null) {
            throw new IllegalStateException("Trūksta failų buvimo požymių.");
        }
        // Kiti laukai neprivalomi: vartotojas gali nenurodyti spalvų ar šriftų.
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Trūksta " + field + ".");
        }
    }
}
