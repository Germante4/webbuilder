
package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.asset.ProjectAssetUploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ProjectAssetService {

    private final Path uploadDirectory =
            Paths.get("uploads")
                    .toAbsolutePath()
                    .normalize();

    private static final Set<String> IMAGE_EXTENSIONS =
            Set.of(".png", ".jpg", ".jpeg", ".webp");

    private static final Set<String> BRAND_EXTENSIONS =
            Set.of(".pdf", ".png", ".jpg", ".jpeg");

    private static final Set<String> TEXT_EXTENSIONS =
            Set.of(".pdf", ".docx", ".txt");

    public ProjectAssetService() {
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Nepavyko sukurti failų katalogo.",
                    e
            );
        }
    }

    public ProjectAssetUploadResponse uploadAssets(
            MultipartFile logo,
            List<MultipartFile> photos,
            MultipartFile brandFile,
            List<MultipartFile> textFiles
    ) {

        String savedLogo = saveFile(
                logo,
                "logo",
                IMAGE_EXTENSIONS
        );

        List<String> savedPhotos = saveFiles(
                photos,
                "photo",
                IMAGE_EXTENSIONS
        );

        String savedBrandFile = saveFile(
                brandFile,
                "brand",
                BRAND_EXTENSIONS
        );

        List<String> savedTextFiles = saveFiles(
                textFiles,
                "text",
                TEXT_EXTENSIONS
        );

        return new ProjectAssetUploadResponse(
                savedLogo,
                savedPhotos,
                savedBrandFile,
                savedTextFiles
        );
    }

    private List<String> saveFiles(
            List<MultipartFile> files,
            String prefix,
            Set<String> allowedExtensions
    ) {

        List<String> savedFiles = new ArrayList<>();

        if (files == null) {
            return savedFiles;
        }

        for (MultipartFile file : files) {
            String saved = saveFile(
                    file,
                    prefix,
                    allowedExtensions
            );

            if (saved != null) {
                savedFiles.add(saved);
            }
        }

        return savedFiles;
    }

    private String saveFile(
            MultipartFile file,
            String prefix,
            Set<String> allowedExtensions
    ) {

        if (file == null || file.isEmpty()) {
            return null;
        }

        String extension = getExtension(
                file.getOriginalFilename()
        );


        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException(
                    "Nepalaikomas failo tipas: " + extension
            );
        }

        String filename =
                prefix + "-" + UUID.randomUUID() + extension;

        Path target = uploadDirectory
                .resolve(filename)
                .normalize();

        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException(
                    "Neteisingas failo kelias."
            );
        }

        try {
            Files.copy(
                    file.getInputStream(),
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return filename;

        } catch (IOException e) {
            throw new RuntimeException(
                    "Nepavyko išsaugoti failo.",
                    e
            );
        }
    }

    public Path getAssetPath(String filename) {

        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas failo pavadinimas."
            );
        }

        Path target = uploadDirectory
                .resolve(filename)
                .normalize();

        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException(
                    "Neteisingas failo kelias."
            );
        }

        if (!Files.isRegularFile(target)) {
            throw new IllegalArgumentException(
                    "Failas nerastas."
            );
        }

        return target;
    }

    public Path getWebsiteImagePath(String filename) {

        if (filename == null ||
                !filename.matches(
                        "(logo|photo)-[0-9a-fA-F-]{36}\\.(png|jpg|jpeg|webp)"
                )) {
            throw new IllegalArgumentException(
                    "Netinkamas svetainės paveikslėlio pavadinimas."
            );
        }

        return getAssetPath(filename);
    }

    private String getExtension(String filename) {

        if (filename == null || filename.isBlank()) {
            return "";
        }

        int dotIndex = filename.lastIndexOf(".");

        if (dotIndex < 0) {
            return "";
        }

        return filename
                .substring(dotIndex)
                .toLowerCase(Locale.ROOT);
    }
}
