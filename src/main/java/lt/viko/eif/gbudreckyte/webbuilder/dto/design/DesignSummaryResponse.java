package lt.viko.eif.gbudreckyte.webbuilder.dto.design;

import java.util.List;

public record DesignSummaryResponse(
        List<String> visualStyles,
        String visualDirection,
        String colorDirection,
        String brandColors,
        String typography,
        String referenceWebsite,
        String referencePreferences,
        Boolean hasLogo,
        Boolean hasPhotos,
        Boolean hasBrandFile,
        Boolean hasPreparedTexts,
        String designBrief
) {
}