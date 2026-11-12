
package lt.viko.eif.gbudreckyte.webbuilder.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StitchHtmlAssetService {

    private final ProjectAssetService projectAssetService;

    public StitchHtmlAssetService(
            ProjectAssetService projectAssetService
    ) {
        this.projectAssetService = projectAssetService;
    }

    public String insertAssets(
            String originalHtml,
            String logoFilename,
            List<String> photoFilenames
    ) {
        if (originalHtml == null || originalHtml.isBlank()) {
            throw new IllegalArgumentException(
                    "Nepateiktas sugeneruotos svetainės HTML."
            );
        }

        Document document = Jsoup.parse(originalHtml);

        insertLogo(document, logoFilename);
        insertPhotos(document, photoFilenames);

        return document.outerHtml();
    }

    private void insertLogo(
            Document document,
            String logoFilename
    ) {
        if (logoFilename == null || logoFilename.isBlank()) {
            return;
        }

        // Patikriname, ar failas tikrai egzistuoja.
        projectAssetService.getWebsiteImagePath(logoFilename);

        Element logoLink = document.selectFirst(
                "header a[href='#']"
        );

        if (logoLink == null) {
            return;
        }

        logoLink.empty();

        logoLink.appendElement("img")
                .attr("src", imageUrl(logoFilename))
                .attr("alt", "Logotipas")
                .addClass("h-12")
                .addClass("w-auto")
                .addClass("max-w-48")
                .addClass("object-contain");
    }

    private void insertPhotos(
            Document document,
            List<String> photoFilenames
    ) {
        if (photoFilenames == null || photoFilenames.isEmpty()) {
            return;
        }

        List<Element> images = document.select(
                "main img"
        );

        int photoIndex = 0;

        for (Element image : images) {
            if (photoIndex >= photoFilenames.size()) {
                break;
            }

            String filename = photoFilenames.get(photoIndex);

            if (filename == null || filename.isBlank()) {
                continue;
            }

            projectAssetService.getWebsiteImagePath(filename);

            image.attr("src", imageUrl(filename));
            image.removeAttr("srcset");
            image.removeAttr("data-alt");
            image.attr(
                    "alt",
                    "Vartotojo įkelta nuotrauka"
            );

            photoIndex++;
        }
    }

    private String imageUrl(String filename) {
        return "/api/project-assets/images/" + filename;
    }
}
