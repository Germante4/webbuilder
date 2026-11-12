package lt.viko.eif.gbudreckyte.webbuilder.dto.refinement;

import java.util.List;
import java.util.Map;

public record RequirementRefinementRequest(
        String answer,
        String websiteCategory,
        Map<String, String> projectAnswers,
        List<String> previousAnswers,
        int step
) {
}