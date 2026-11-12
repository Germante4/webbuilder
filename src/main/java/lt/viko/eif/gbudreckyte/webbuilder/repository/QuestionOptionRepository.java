package lt.viko.eif.gbudreckyte.webbuilder.repository;

import lt.viko.eif.gbudreckyte.webbuilder.model.QuestionOption;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionOptionRepository
        extends JpaRepository<QuestionOption, Long> {

    List<QuestionOption>
    findAllByQuestionOrderByDisplayOrderAsc(RequirementQuestion question);
}