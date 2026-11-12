package lt.viko.eif.gbudreckyte.webbuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(

        @NotBlank(message = "Projekto pavadinimas yra privalomas")
        @Size(max = 100)
        String name,

        @Size(max = 2000)
        String description

) {}