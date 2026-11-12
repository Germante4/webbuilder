package lt.viko.eif.gbudreckyte.webbuilder.repository;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementAnswer;
import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RequirementAnswerRepository
        extends JpaRepository<RequirementAnswer, Long> {

    List<RequirementAnswer> findAllByProject(Project project);

    Optional<RequirementAnswer> findByProjectAndQuestion(
            Project project,
            RequirementQuestion question
    );
}