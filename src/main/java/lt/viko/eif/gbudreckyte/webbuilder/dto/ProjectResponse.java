
package lt.viko.eif.gbudreckyte.webbuilder.dto;

import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
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
        String stitchScreenId
) {}
