package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryResponse;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ProjectSummaryService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public ProjectSummaryService(
            GeminiService geminiService,
            ObjectMapper objectMapper
    ) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public ProjectSummaryResponse updateSummary(
            String websiteCategory,
            Map<String, String> projectAnswers,
            ProjectSummaryResponse currentSummary
    ) {

        String answersText = buildAnswersContext(projectAnswers);

        String currentSummaryText;

        try {
            currentSummaryText = currentSummary == null
                    ? "Santrauka dar nesukurta."
                    : objectMapper.writeValueAsString(currentSummary);
        } catch (JacksonException e) {
            throw new RuntimeException(
                    "Nepavyko paruošti esamos projekto santraukos.",
                    e
            );
        }

        String prompt = """
        Tu kuri faktinę struktūrizuotą būsimos interneto svetainės
        projekto santrauką.

        Ši santrauka yra vidinė projekto atmintis kitoms AI užduotims.
        Tai NĖRA reklaminis tekstas ir NĖRA svetainės turinys.

        PAGRINDINĖ TAISYKLĖ:
        Į santrauką gali patekti tik informacija, kurią vartotojas
        aiškiai pateikė savo atsakymuose arba kuri jau yra dabartinėje
        santraukoje.

        DRAUDŽIAMA:
        - išgalvoti naujus faktus;
        - daryti prielaidas apie verslą;
        - pridėti savybes, kurių vartotojas nepaminėjo;
        - pridėti marketinginius teiginius;
        - bandyti padaryti verslą patrauklesnį;
        - pridėti savo interpretacijas;
        - iš vartotojo atsakymo išvesti papildomas savybes,
          kurių jis tiesiogiai nepasakė.

        LEIDŽIAMA:
        - sutrumpinti vartotojo pateiktą informaciją;
        - sujungti kelis vartotojo pateiktus faktus;
        - pataisyti gramatiką;
        - performuluoti tekstą aiškesne lietuvių kalba;
        - papildyti ankstesnę santrauką naujais vartotojo pateiktais faktais.

        SVARBU:
        Jei faktas nėra tiesiogiai pagrįstas vartotojo atsakymais
        arba dabartine santrauka, jo nerašyk.

        Jei konkrečiam laukui informacijos nėra, grąžink null.

        Neištrink teisingos informacijos iš dabartinės santraukos,
        jeigu nauji vartotojo atsakymai jos nepaneigia ir nepatikslina.

        Rašyk taisyklinga, natūralia lietuvių kalba.
        Naudok trumpus, informatyvius sakinius.
        Venk abstrakčių frazių ir perteklinių būdvardžių.

        =========================
        SVETAINĖS KATEGORIJA
        =========================

        %s

        Svetainės kategoriją naudok tik websiteType laukui
        ir kontekstui suprasti.
        Vien iš kategorijos nedaryk jokių išvadų apie verslą.

        =========================
        DABARTINĖ SANTRAUKA
        =========================

        %s

        Tai yra anksčiau patvirtinta projekto informacija.
        Išsaugok ją, nebent nauji vartotojo atsakymai ją patikslina.

        =========================
        NAUJI VARTOTOJO ATSAKYMAI
        =========================

        %s

        Naujuose atsakymuose ieškok tik faktų, kuriuos vartotojas
        aiškiai pasakė.

        =========================
        LAUKŲ REIKŠMĖS
        =========================

        websiteType:
        Svetainės kategorija. Naudok pateiktą SVETAINĖS KATEGORIJĄ.

        projectName:
        Tik vartotojo nurodytas projekto, veiklos, įmonės
        ar prekės ženklo pavadinimas.

        description:
        Ką vartotojo veikla, verslas ar projektas realiai daro.
        Įtrauk tik vartotojo pateiktą informaciją.

        targetAudience:
        Kokius žmones vartotojas nori pasiekti.
        Nerašyk papildomų jų savybių, poreikių ar motyvų,
        jeigu vartotojas jų nepaminėjo.

        differentiation:
        Kuo vartotojo veikla ar pasiūlymas išsiskiria.
        Pildyk tik tada, kai vartotojas apie tai pateikė informaciją.
        Kitu atveju null.

        customerNeed:
        Kokią problemą, poreikį, norą ar situaciją klientas turi
        prieš pasirinkdamas šį verslą.
        Pildyk tik iš vartotojo pateiktos informacijos.
        Kitu atveju null.

        customerResult:
        Kokį rezultatą arba naudą klientas gauna.
        Pildyk tik iš vartotojo pateiktos informacijos.
        Kitu atveju null.

        =========================
        PATIKRA PRIEŠ ATSAKANT
        =========================

        Prieš generuodamas JSON patikrink kiekvieną teiginį:
        "Ar vartotojas tai iš tikrųjų pasakė?"

        Jei atsakymas ne – pašalink tą teiginį.

        =========================
        ATSAKYMO FORMATAS
        =========================

        Grąžink TIK validų JSON su tiksliai šiais laukais:

        {
          "websiteType": "...",
          "projectName": "...",
          "description": "...",
          "targetAudience": "...",
          "differentiation": null,
          "customerNeed": null,
          "customerResult": null
        }

        Vietoje null naudok tekstą tik tada, kai tam laukui
        vartotojas iš tikrųjų pateikė informaciją.

        Jokio Markdown.
        Jokio ```json.
        Jokio teksto prieš JSON.
        Jokio teksto po JSON.
        """.formatted(
                websiteCategory,
                currentSummaryText,
                answersText
        );

        return generateAndParse(prompt);
    }

    private String buildAnswersContext(
            Map<String, String> projectAnswers
    ) {

        if (projectAnswers == null || projectAnswers.isEmpty()) {
            return "Naujų atsakymų nėra.";
        }

        StringBuilder context = new StringBuilder();

        projectAnswers.forEach((question, answer) -> {
            context
                    .append("Klausimas: ")
                    .append(question)
                    .append("\n")
                    .append("Vartotojo atsakymas: ")
                    .append(answer)
                    .append("\n\n");
        });

        return context.toString();
    }

    private ProjectSummaryResponse generateAndParse(
            String prompt
    ) {

        String aiResponse = geminiService.generate(prompt);

        String cleanJson = aiResponse
                .replace("```json", "")
                .replace("```", "")
                .trim();

        try {
            return objectMapper.readValue(
                    cleanJson,
                    ProjectSummaryResponse.class
            );
        } catch (JacksonException e) {
            throw new RuntimeException(
                    "Nepavyko apdoroti AI projekto santraukos: "
                            + aiResponse,
                    e
            );
        }
    }
}