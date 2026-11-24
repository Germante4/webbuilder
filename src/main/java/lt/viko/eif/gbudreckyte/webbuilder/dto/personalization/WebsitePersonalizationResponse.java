package lt.viko.eif.gbudreckyte.webbuilder.dto.personalization;

import java.util.List;

public record WebsitePersonalizationResponse(

        Long projectId,

        String projectName,

        String html,

        Long version,

        boolean personalized,

        List<EditableElementResponse> elements

) {
}