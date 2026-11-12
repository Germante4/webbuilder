package lt.viko.eif.gbudreckyte.webbuilder.dto.asset;

import java.util.List;

public record ProjectAssetUploadResponse(
        String logo,
        List<String> photos,
        String brandFile,
        List<String> textFiles
) {
}