package lt.viko.eif.gbudreckyte.webbuilder.repository;

import lt.viko.eif.gbudreckyte.webbuilder.model.RequirementQuestion;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequirementQuestionRepository
        extends JpaRepository<RequirementQuestion, Long> {

    List<RequirementQuestion>
    findAllByCategoryOrderByDisplayOrderAsc(
            WebsiteCategory category
    );

    List<RequirementQuestion>
    findAllByCategoryInOrderByDisplayOrderAsc(
            List<WebsiteCategory> categories
    );
}