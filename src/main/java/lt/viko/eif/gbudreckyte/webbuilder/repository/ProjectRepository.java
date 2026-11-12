
package lt.viko.eif.gbudreckyte.webbuilder.repository;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwnerOrderByCreatedAtDesc(User owner);

    Optional<Project> findByIdAndOwner(Long id, User owner);

    Optional<Project> findByStitchScreenId(String stitchScreenId);
}
