package lt.viko.eif.gbudreckyte.webbuilder.dto.personalization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PersonalizationChangeRequest(

        @NotBlank
        @Size(max = 100)
        String elementId,

        @NotBlank
        @Size(max = 50)
        String property,

        @NotNull
        @Size(max = 20000)
        String value

) {
}