package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.personalization.*;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.model.GenerationStatus;
import lt.viko.eif.gbudreckyte.webbuilder.repository.ProjectRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.*;

@Service
public class WebsitePersonalizationService {

    private static final String ID = "data-wb-id";
    private static final Set<String> TEXT_TAGS = Set.of(
            "h1", "h2", "h3", "h4", "h5", "h6", "p", "span",
            "a", "button", "li", "label", "strong", "em", "small");
    private final ProjectService projectService;
    private final ProjectRepository projectRepository;

    public WebsitePersonalizationService(ProjectService projectService,
                                         ProjectRepository projectRepository) {
        this.projectService = projectService;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public WebsitePersonalizationResponse getPersonalization(Long id, User owner) {
        Project project = projectService.getProjectById(id, owner);
        checkReady(project);
        return response(project, prepareDocument(project));
    }

    @Transactional
    public WebsitePersonalizationResponse savePersonalization(
            Long id, User owner, WebsitePersonalizationRequest request) {
        Project project = projectService.getProjectByIdForUpdate(id, owner);
        checkReady(project);
        checkVersion(project, request.version());
        Document document = prepareDocument(project);
        Map<String, Element> elements = new HashMap<>();
        for (Element element : document.select("[data-wb-id]")) {
            elements.put(element.attr(ID), element);
        }
        for (PersonalizationChangeRequest change : request.changes()) {
            Element element = elements.get(change.elementId());
            if (element == null || !properties(element).containsKey(change.property())) {
                throw badRequest("Neleistinas elementas arba savybė.");
            }
            applyChange(element, change.property(), change.value());
        }
        project.setPersonalizedHtml(document.outerHtml());
        project.setPersonalizationVersion(version(project) + 1L);
        projectRepository.save(project);
        return response(project, document);
    }

    @Transactional
    public WebsitePersonalizationResponse resetPersonalization(Long id, User owner, Long expectedVersion) {
        Project project = projectService.getProjectByIdForUpdate(id, owner);
        checkReady(project);
        checkVersion(project, expectedVersion);
        project.setPersonalizedHtml(null);
        project.setPersonalizationVersion(version(project) + 1L);
        projectRepository.save(project);
        return response(project, prepareDocument(project));
    }

    private Document prepareDocument(Project project) {
        boolean personalized = project.getPersonalizedHtml() != null;
        Document document = Jsoup.parse(personalized
                ? project.getPersonalizedHtml() : project.getGeneratedHtml());
        document.outputSettings().prettyPrint(false);
        if (!personalized) {
            document.select("[data-wb-id]").removeAttr(ID);
        }
        Set<String> used = new HashSet<>();
        for (Element element : document.select("[data-wb-id]")) {
            String id = element.attr(ID);
            if (!id.matches("wb-[0-9]+") || !used.add(id)) {
                element.removeAttr(ID);
            }
        }
        int counter = 1;
        for (Element element : document.body().getAllElements()) {
            if (properties(element).isEmpty() || element.hasAttr(ID)) continue;
            String id;
            do { id = "wb-" + counter++; } while (!used.add(id));
            element.attr(ID, id);
        }
        return document;
    }

    private Map<String, String> properties(Element element) {
        Map<String, String> result = new LinkedHashMap<>();
        String tag = element.normalName();
        if (TEXT_TAGS.contains(tag) && element.childrenSize() == 0
                && !element.hasClass("material-symbols-outlined")
                && !element.hasClass("material-icons")) {
            result.put("text", element.wholeText());
        }
        if (tag.equals("img")) {
            result.put("src", element.attr("src"));
            result.put("alt", element.attr("alt"));
        }
        if (tag.equals("a")) result.put("href", element.attr("href"));
        if (tag.equals("section")) {
            String color = "";
            for (String declaration : element.attr("style").split(";")) {
                String[] pair = declaration.split(":", 2);
                if (pair.length == 2 && pair[0].trim().equalsIgnoreCase("background-color")) {
                    color = pair[1].trim().replaceFirst("(?i)\\s*!important\\s*$", "");
                }
            }
            result.put("backgroundColor", color);
        }
        return result;
    }

    private void applyChange(Element element, String property, String value) {
        switch (property) {
            case "text" -> element.text(value);
            case "alt" -> element.attr("alt", value);
            case "href" -> element.attr("href", validateUrl(value, false));
            case "src" -> {
                element.attr("src", validateUrl(value, true));
                element.removeAttr("srcset");
            }
            case "backgroundColor" -> {
                if (!value.matches("#[0-9a-fA-F]{6}")) {
                    throw badRequest("Spalva turi būti HEX formato (#RRGGBB).");
                }
                element.attr("style", element.attr("style") + ";background-color:" + value + " !important;");
            }
            default -> throw badRequest("Neleistina savybė.");
        }
    }

    private String validateUrl(String value, boolean image) {
        String url = value.trim();
        if (url.chars().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c))
                || url.contains("\\")) throw badRequest("Neteisingas URL.");
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme != null && (scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))
                    && uri.getHost() != null && uri.getUserInfo() == null) return url;
            if (!image && (url.startsWith("#") || (scheme != null &&
                    Set.of("mailto", "tel").contains(scheme.toLowerCase(Locale.ROOT))))) return url;
        } catch (IllegalArgumentException ignored) { }
        throw badRequest("Neleistinas URL adresas.");
    }

    private WebsitePersonalizationResponse response(Project project, Document document) {
        List<EditableElementResponse> elements = new ArrayList<>();
        for (Element element : document.select("[data-wb-id]")) {
            Map<String, String> props = properties(element);
            if (props.isEmpty()) continue;
            String label = switch (element.normalName()) {
                case "img" -> "Nuotrauka";
                case "a" -> "Nuoroda";
                case "button" -> "Mygtukas";
                case "section" -> "Sekcija";
                case "h1", "h2", "h3", "h4", "h5", "h6" -> "Antraštė";
                default -> "Tekstas";
            };
            elements.add(new EditableElementResponse(element.attr(ID), element.normalName(), label, props));
        }
        return new WebsitePersonalizationResponse(project.getId(), project.getName(),
                document.outerHtml(), version(project), project.getPersonalizedHtml() != null, elements);
    }

    private void checkReady(Project project) {
        if (project.getGenerationStatus() == GenerationStatus.PENDING ||
                project.getGenerationStatus() == GenerationStatus.GENERATING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Palaukite, kol bus baigtas generavimas.");
        }
        if (project.getGeneratedHtml() == null || project.getGeneratedHtml().isBlank()) {
            throw badRequest("Projektas dar neturi sugeneruotos svetainės.");
        }
    }

    private long version(Project project) {
        return project.getPersonalizationVersion() == null ? 0L : project.getPersonalizationVersion();
    }

    private void checkVersion(Project project, Long expected) {
        if (expected == null || expected.longValue() != version(project)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Svetainės versija pasikeitė. Atnaujinkite redaktorių.");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
