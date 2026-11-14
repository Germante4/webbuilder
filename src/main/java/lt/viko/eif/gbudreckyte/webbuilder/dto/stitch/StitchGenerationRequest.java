
package lt.viko.eif.gbudreckyte.webbuilder.dto.stitch;

import lt.viko.eif.gbudreckyte.webbuilder.dto.contact.ProjectContactRequest;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;

public record StitchGenerationRequest(
        String prompt,
        String projectName,
        String projectDescription,
        WebsiteCategory websiteCategory,
        Long webBuilderProjectId,
        ProjectContactRequest contactInformation
) {
}
