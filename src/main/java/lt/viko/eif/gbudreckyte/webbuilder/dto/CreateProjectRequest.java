package lt.viko.eif.gbudreckyte.webbuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;

@Getter
@Setter
public class CreateProjectRequest {

    @NotBlank(message = "Projekto pavadinimas yra privalomas")
    @Size(max = 100, message = "Projekto pavadinimas negali būti ilgesnis nei 100 simbolių")
    private String name;

    @Size(max = 2000, message = "Aprašymas negali būti ilgesnis nei 2000 simbolių")
    private String description;

    @NotNull(message = "Svetainės kategorija yra privaloma")
    private WebsiteCategory websiteCategory;
}