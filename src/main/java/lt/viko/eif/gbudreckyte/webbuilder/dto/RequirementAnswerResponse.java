package lt.viko.eif.gbudreckyte.webbuilder.dto;

public record RequirementAnswerResponse(
        Long id,
        Long questionId,
        String answerText
) {}