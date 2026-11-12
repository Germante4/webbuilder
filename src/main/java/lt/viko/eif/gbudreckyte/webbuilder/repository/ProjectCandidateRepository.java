
package lt.viko.eif.gbudreckyte.webbuilder.repository;

import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectCandidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectCandidateRepository
        extends JpaRepository<ProjectCandidate, Long> {

    Optional<ProjectCandidate> findByProjectId(Long projectId);

    boolean existsByProjectId(Long projectId);
}
