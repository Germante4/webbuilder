package lt.viko.eif.gbudreckyte.webbuilder.dto.personalization;

import java.util.Map;

public record EditableElementResponse(

        String elementId,

        String tagName,

        String label,

        Map<String, String> properties

) {
}