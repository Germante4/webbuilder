
package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.asset.ProjectAssetUploadResponse;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ProjectAssetContentService {

    private static final int MAX_DOCUMENT_CHARS = 20_000;
    private static final int MAX_TOTAL_CHARS = 60_000;

    private final ProjectAssetService projectAssetService;

    public ProjectAssetContentService(
            ProjectAssetService projectAssetService
    ) {
        this.projectAssetService = projectAssetService;
    }

    public String extractProjectContent(
            ProjectAssetUploadResponse assets
    ) {
        if (assets == null) {
            return "No uploaded project documents.";
        }

        StringBuilder result = new StringBuilder();

        if (assets.brandFile() != null) {
            appendDocument(
                    result,
                    "BRAND DOCUMENT",
                    assets.brandFile()
            );
        }

        List<String> textFiles = assets.textFiles();

        if (textFiles != null) {
            for (String filename : textFiles) {
                if (result.length() >= MAX_TOTAL_CHARS) {
                    break;
                }

                appendDocument(
                        result,
                        "CONTENT DOCUMENT",
                        filename
                );
            }
        }

        if (result.isEmpty()) {
            return "No readable text documents provided.";
        }

        return result.toString();
    }

    private void appendDocument(
            StringBuilder result,
            String label,
            String filename
    ) {
        if (filename == null || filename.isBlank()) {
            return;
        }

        int remaining = MAX_TOTAL_CHARS - result.length();

        if (remaining <= 0) {
            return;
        }

        try {
            Path path = projectAssetService.getAssetPath(filename);

            String content = readDocument(path);

            if (content == null || content.isBlank()) {
                return;
            }

            int limit = Math.min(
                    MAX_DOCUMENT_CHARS,
                    remaining
            );

            if (limit <= 0) {
                return;
            }

            String truncated = content.substring(
                    0,
                    Math.min(content.length(), limit)
            );

            result.append("\n\n")
                    .append(label)
                    .append(" (")
                    .append(filename)
                    .append("):\n")
                    .append(truncated);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Nepavyko perskaityti dokumento: " + filename,
                    e
            );
        }
    }

    private String readDocument(Path path) throws IOException {

        String filename = path.getFileName()
                .toString()
                .toLowerCase(Locale.ROOT);

        if (filename.endsWith(".txt")) {
            return Files.readString(
                    path,
                    StandardCharsets.UTF_8
            );
        }

        if (filename.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(
                    Files.readAllBytes(path)
            )) {
                return new PDFTextStripper().getText(document);
            }
        }

        if (filename.endsWith(".docx")) {
            try (
                    InputStream input = Files.newInputStream(path);
                    XWPFDocument document = new XWPFDocument(input)
            ) {
                List<String> paragraphs = new ArrayList<>();

                document.getParagraphs().forEach(paragraph -> {
                    String text = paragraph.getText();

                    if (text != null && !text.isBlank()) {
                        paragraphs.add(text);
                    }
                });

                document.getTables().forEach(table ->
                        table.getRows().forEach(row ->
                                row.getTableCells().forEach(cell -> {
                                    String text = cell.getText();

                                    if (text != null && !text.isBlank()) {
                                        paragraphs.add(text);
                                    }
                                })
                        )
                );

                return String.join("\n", paragraphs);
            }
        }

        // Brandbook may be an image; image analysis
        // will be implemented in a separate step.
        if (filename.endsWith(".png")
                || filename.endsWith(".jpg")
                || filename.endsWith(".jpeg")) {
            return "";
        }

        throw new IllegalArgumentException(
                "Nepalaikomas dokumento formatas: " + filename
        );
    }
}
