package lt.viko.eif.gbudreckyte.webbuilder.controller;

import jakarta.servlet.http.HttpServletResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.GenerationStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectAssetService;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.io.OutputStream;
import java.net.http.HttpClient;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
public class WebsiteExportController {

    private static final Pattern PROJECT_IMAGE = Pattern.compile(
            "(?<![^,\\s])(?:(?:https?:)?//[^/\\s]+)?"
                    + "/api/project-assets/images/"
                    + "((?:logo|photo)-[0-9a-fA-F-]{36}\\.(?:jpg|jpeg|png|webp))"
                    + "(?=[,\\s]|$)"
    );

    private final ProjectService projectService;
    private final ProjectAssetService projectAssetService;
    private final RestClient netlify;
    private final String netlifyToken;
    private final String netlifySite;
    private final String publishProjectId;

    private record WebsiteArchive(byte[] html, Map<String, Path> assets) {}
    private record NetlifyDeploy(String id, String state) {}
    public record Publication(String url, boolean ready) {}

    public WebsiteExportController(
            ProjectService projectService,
            ProjectAssetService projectAssetService,
            @Value("${NETLIFY_AUTH_TOKEN:}") String netlifyToken,
            @Value("${NETLIFY_SITE_HOST:}") String netlifySite,
            @Value("${NETLIFY_WEBBUILDER_PROJECT_ID:}") String publishProjectId
    ) {
        this.projectService = projectService;
        this.projectAssetService = projectAssetService;
        this.netlifyToken = netlifyToken;
        this.netlifySite = netlifySite;
        this.publishProjectId = publishProjectId;
        var requestFactory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build());
        requestFactory.setReadTimeout(Duration.ofSeconds(35));
        this.netlify = RestClient.builder()
                .baseUrl("https://api.netlify.com/api/v1")
                .requestFactory(requestFactory)
                .build();
    }

    @GetMapping("/api/projects/{id}/export")
    public void download(
            @PathVariable("id") Long projectId,
            Authentication authentication,
            HttpServletResponse response
    ) throws IOException {
        WebsiteArchive archive = buildArchive(projectId, authentication);
        response.setContentType("application/zip");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename("svetaine-" + projectId + ".zip")
                .build().toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        writeArchive(archive, response.getOutputStream());
    }

    @PostMapping("/api/projects/{id}/publish")
    public Publication publish(
            @PathVariable("id") Long projectId,
            Authentication authentication
    ) throws IOException {
        if (!projectId.toString().equals(publishProjectId)
                || netlifyToken.isBlank()
                || !netlifySite.matches("[a-z0-9][a-z0-9-]*\\.netlify\\.app")) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Šiam projektui Netlify publikavimas nesukonfigūruotas.");
        }

        WebsiteArchive archive = buildArchive(projectId, authentication);
        Path temporaryZip = Files.createTempFile("webbuilder-site-", ".zip");

        try {
            writeArchive(archive, Files.newOutputStream(temporaryZip));
            NetlifyDeploy deploy = netlify.post()
                    .uri("/sites/{site}/deploys", netlifySite)
                    .headers(headers -> headers.setBearerAuth(netlifyToken))
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .body(new FileSystemResource(temporaryZip))
                    .retrieve()
                    .body(NetlifyDeploy.class);

            if (deploy == null || deploy.id() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Netlify negrąžino publikavimo ID.");
            }
            return awaitPublication(deploy);
        } catch (RestClientException error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Netlify užklausa nepavyko. Patikrinkite projekto adresą ir prieigos raktą.");
        } finally {
            Files.deleteIfExists(temporaryZip);
        }
    }

    private Publication awaitPublication(NetlifyDeploy deploy) {
        String url = "https://" + netlifySite;

        for (int attempt = 0; ; attempt++) {
            if ("ready".equals(deploy.state())) return new Publication(url, true);
            if ("error".equals(deploy.state()) || "failed".equals(deploy.state())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Netlify nepavyko paskelbti svetainės.");
            }
            if (attempt == 10) return new Publication(url, false);

            try {
                Thread.sleep(1000);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                return new Publication(url, false);
            }

            NetlifyDeploy updated = netlify.get()
                    .uri("/deploys/{id}", deploy.id())
                    .headers(headers -> headers.setBearerAuth(netlifyToken))
                    .retrieve()
                    .body(NetlifyDeploy.class);
            if (updated == null) return new Publication(url, false);
            deploy = updated;
        }
    }

    private WebsiteArchive buildArchive(Long projectId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User owner)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        Project project = projectService.getProjectById(projectId, owner);
        if (project.getGenerationStatus() == GenerationStatus.PENDING
                || project.getGenerationStatus() == GenerationStatus.GENERATING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Palaukite, kol bus baigtas generavimas.");
        }

        String html = project.getPersonalizedHtml();
        if (html == null || html.isBlank()) {
            html = project.getGeneratedHtml();
        }
        if (html == null || html.isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Projektas dar neturi svetainės.");
        }

        Document document = Jsoup.parse(html);
        document.outputSettings().prettyPrint(false);
        document.charset(StandardCharsets.UTF_8);
        document.select("[data-wb-id]").removeAttr("data-wb-id");
        Map<String, Path> assets = new LinkedHashMap<>();

        for (Element image : document.select("img[src]")) {
            String original = image.attr("src");
            String rewritten = rewriteImages(original, assets);
            image.attr("src", rewritten);

            // An uploaded replacement takes precedence over generated picture sources.
            if (!original.equals(rewritten) && rewritten.startsWith("assets/photo-")) {
                image.removeAttr("srcset");
                Element picture = image.closest("picture");
                if (picture != null) picture.children().select("source").remove();
            }
        }
        for (Element element : document.select("img[srcset], picture source[srcset]")) {
            element.attr("srcset", rewriteImages(element.attr("srcset"), assets));
        }

        return new WebsiteArchive(document.outerHtml().getBytes(StandardCharsets.UTF_8), assets);
    }

    private void writeArchive(WebsiteArchive archive, OutputStream output) throws IOException {
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("index.html"));
            zip.write(archive.html());
            zip.closeEntry();

            for (Map.Entry<String, Path> asset : archive.assets().entrySet()) {
                zip.putNextEntry(new ZipEntry(asset.getKey()));
                Files.copy(asset.getValue(), zip);
                zip.closeEntry();
            }
        }
    }

    private String rewriteImages(String value, Map<String, Path> assets) {
        Matcher matcher = PROJECT_IMAGE.matcher(value);
        return matcher.replaceAll(match -> {
            String filename = match.group(1);
            String entry = "assets/" + filename;
            try {
                assets.computeIfAbsent(entry, key -> projectAssetService.getWebsiteImagePath(filename));
            } catch (IllegalArgumentException error) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Eksportui nerasta nuotrauka: " + filename, error);
            }
            return Matcher.quoteReplacement(entry);
        });
    }
}
