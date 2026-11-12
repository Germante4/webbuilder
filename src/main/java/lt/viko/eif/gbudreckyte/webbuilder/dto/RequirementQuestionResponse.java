package lt.viko.eif.gbudreckyte.webbuilder.dto;

import lt.viko.eif.gbudreckyte.webbuilder.model.QuestionType;

import java.util.List;
 public record RequirementQuestionResponse(
        Long id,
        String questionText,
        QuestionType questionType,
        boolean required,
        int displayOrder,
        String placeholder,
        boolean aiRefinementEnabled,
        List<QuestionOptionResponse> options
) {
}