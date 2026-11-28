package lt.viko.eif.gbudreckyte.webbuilder.dto;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;

import org.jsoup.Jsoup;

import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        String name,
        String description,
        ProjectStatus status,
        WebsiteCategory websiteCategory,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String stitchProjectId,
        String stitchScreenId,
        String publishedUrl,
        LocalDateTime lastPublishedAt
) {
    public static ProjectResponse fromProject(Project project) {
        return new ProjectResponse(
                project.getId(),
                displayName(project),
                project.getDescription(),
                project.getStatus(),
                project.getWebsiteCategory(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getStitchProjectId(),
                project.getStitchScreenId(),
                project.getPublishedUrl(),
                project.getLastPublishedAt()
        );
    }

    private static String displayName(Project project) {
        String name = project.getName();
        if (!name.isBlank() && !"Nauja svetainė".equalsIgnoreCase(name.strip())
                && !"Naujas projektas".equalsIgnoreCase(name.strip())) {
            return name;
        }

        String html = project.getPersonalizedHtml();
        if (html == null || html.isBlank()) {
            html = project.getGeneratedHtml();
        }

        if (html != null && !html.isBlank()) {
            String title = Jsoup.parse(html).title();
            if (!title.isBlank()) {
                return title;
            }
        }

        return name;
    }
}
