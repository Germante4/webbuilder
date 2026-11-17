package lt.viko.eif.gbudreckyte.webbuilder.dto.stitch;

import java.util.List;
import java.util.Map;

public record WebsiteContentRequest(
        Map<String, List<Map<String, String>>> sections,
        List<String> priorities,
        String emphasis
) {
}