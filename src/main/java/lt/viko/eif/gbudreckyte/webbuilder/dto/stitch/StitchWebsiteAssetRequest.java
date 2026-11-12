
package lt.viko.eif.gbudreckyte.webbuilder.dto.stitch;

import java.util.List;

public record StitchWebsiteAssetRequest(
        String screenId,
        String logo,
        List<String> photos
) {
}
