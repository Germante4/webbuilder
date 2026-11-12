package lt.viko.eif.gbudreckyte.webbuilder.dto.design;

public record DesignDirectionResponse(
        String id,
        String name,
        String tagline,
        String description,
        String layoutDirection,
        String typographyDirection,
        String imageDirection,
        String colorDirection,
        String mood
) {
}