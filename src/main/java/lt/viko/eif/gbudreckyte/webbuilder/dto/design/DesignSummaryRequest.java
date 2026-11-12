package lt.viko.eif.gbudreckyte.webbuilder.dto.design;

import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryResponse;

import java.util.List;

public record DesignSummaryRequest(
        ProjectSummaryResponse projectSummary,

        List<String> styles,
        String colorDirection,

        List<String> assets,
        Boolean hasNoAssets,

        String brandColors,
        String fonts,

        String referenceUrl,
        String referenceLikes,

        UploadedAssets uploadedAssets
) {

    public record UploadedAssets(
            String logo,
            List<String> photos,
            String brandFile,
            List<String> textFiles
    ) {
    }
}