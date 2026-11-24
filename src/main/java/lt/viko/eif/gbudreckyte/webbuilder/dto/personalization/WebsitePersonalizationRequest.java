package lt.viko.eif.gbudreckyte.webbuilder.dto.personalization;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record WebsitePersonalizationRequest(

        @NotNull
        @PositiveOrZero
        Long version,

        @NotNull
        @Size(min = 1, max = 500)
        List<@NotNull @Valid PersonalizationChangeRequest> changes

) {
}