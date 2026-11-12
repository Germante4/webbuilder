package lt.viko.eif.gbudreckyte.webbuilder.dto.refinement;

import java.util.List;

public record RequirementRefinementResponse(
        boolean needsRefinement,
        String question,
        List<String> options,
        String summary
) {}