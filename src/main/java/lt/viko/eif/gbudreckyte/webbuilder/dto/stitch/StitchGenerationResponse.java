
package lt.viko.eif.gbudreckyte.webbuilder.dto.stitch;

import tools.jackson.databind.JsonNode;

public record StitchGenerationResponse(
        String projectId,
        String screenId,
        JsonNode html,
        JsonNode image,
        Long webBuilderProjectId
) {
    public StitchGenerationResponse(
            String projectId,
            String screenId,
            JsonNode html,
            JsonNode image
    ) {
        this(projectId, screenId, html, image, null);
    }
}
