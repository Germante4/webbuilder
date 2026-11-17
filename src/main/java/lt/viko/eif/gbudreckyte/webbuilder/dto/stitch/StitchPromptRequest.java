package lt.viko.eif.gbudreckyte.webbuilder.dto.stitch;

import lt.viko.eif.gbudreckyte.webbuilder.dto.design.DesignSummaryResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.summary.ProjectSummaryResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.asset.ProjectAssetUploadResponse;

public record StitchPromptRequest(
        ProjectSummaryResponse projectSummary,
        DesignSummaryResponse designSummary,
        String websiteCategory,
        String websiteFormat,
        String websiteLanguage,
        String selectedDirection,
        ProjectAssetUploadResponse uploadedAssets,
        WebsiteContentRequest websiteContent
) {
}