
package lt.viko.eif.gbudreckyte.webbuilder.controller;

import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/website-categories")
public class WebsiteCategoryController {

    @GetMapping
    public List<WebsiteCategoryResponse> getWebsiteCategories() {

        return Arrays.stream(WebsiteCategory.values())
                .filter(WebsiteCategory::isSelectable)
                .map(category -> new WebsiteCategoryResponse(
                        category.name(),
                        category.getDisplayName(),
                        category.getDescription()
                ))
                .toList();
    }

    public record WebsiteCategoryResponse(
            String value,
            String displayName,
            String description
    ) {
    }
}
