package lt.viko.eif.gbudreckyte.webbuilder.dto;

import jakarta.validation.constraints.NotNull;

public record RequirementAnswerRequest(

        @NotNull(message = "Klausimo ID yra privalomas")
        Long questionId,

        String answerText
) {}