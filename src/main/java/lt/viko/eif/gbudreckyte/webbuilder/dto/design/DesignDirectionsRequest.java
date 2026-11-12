package lt.viko.eif.gbudreckyte.webbuilder.dto.design;

import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryResponse;

public record DesignDirectionsRequest(
        ProjectSummaryResponse projectSummary,
        DesignSummaryResponse designSummary
) {
}