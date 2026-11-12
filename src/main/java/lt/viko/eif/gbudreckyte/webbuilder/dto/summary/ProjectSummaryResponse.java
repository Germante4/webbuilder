package lt.viko.eif.gbudreckyte.webbuilder.dto.summary;

public record ProjectSummaryResponse(
        String websiteType,
        String projectName,
        String description,
        String targetAudience,
        String differentiation,
        String customerNeed,
        String customerResult
) {
}