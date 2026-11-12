package lt.viko.eif.gbudreckyte.webbuilder.dto.summary;

import java.util.Map;

public record ProjectSummaryRequest(
        String websiteCategory,
        Map<String, String> projectAnswers,
        ProjectSummaryResponse currentSummary
) {
}