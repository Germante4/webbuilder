package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.dto.asset.ProjectAssetUploadResponse;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectAssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.nio.file.Path;
import java.net.MalformedURLException;
import java.util.Locale;

import java.util.List;

@RestController
@RequestMapping("/api/project-assets")
public class ProjectAssetController {

    private final ProjectAssetService projectAssetService;

    public ProjectAssetController(
            ProjectAssetService projectAssetService
    ) {
        this.projectAssetService = projectAssetService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ProjectAssetUploadResponse> uploadAssets(
            @RequestParam(required = false) MultipartFile logo,
            @RequestParam(required = false) List<MultipartFile> photos,
            @RequestParam(required = false) MultipartFile brandFile,
            @RequestParam(required = false) List<MultipartFile> textFiles
    ) {

        ProjectAssetUploadResponse response =
                projectAssetService.uploadAssets(
                        logo,
                        photos,
                        brandFile,
                        textFiles
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String filename
    ) throws MalformedURLException {

        Path path =
                projectAssetService.getWebsiteImagePath(filename);

        Resource resource = new UrlResource(
                path.toUri()
        );

        String extension = filename
                .substring(filename.lastIndexOf(".") + 1)
                .toLowerCase(Locale.ROOT);

        MediaType mediaType = switch (extension) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "webp" -> MediaType.parseMediaType("image/webp");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline"
                )
                .contentType(mediaType)
                .body(resource);
    }

}