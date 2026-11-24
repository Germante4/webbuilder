
package lt.viko.eif.gbudreckyte.webbuilder.repository;

import jakarta.persistence.LockModeType;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwnerOrderByCreatedAtDesc(User owner);

    Optional<Project> findByIdAndOwner(Long id, User owner);

    Optional<Project> findByStitchScreenId(String stitchScreenId);

    // ========================================
    // PROJEKTO UŽRAKINIMAS REDAGAVIMO METU
    // ========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Project p
            WHERE p.id = :id
            AND p.owner = :owner
            """)
    Optional<Project> findByIdAndOwnerForUpdate(
            @Param("id") Long id,
            @Param("owner") User owner
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Project p
            WHERE p.id = :id
            """)
    Optional<Project> findByIdForUpdate(
            @Param("id") Long id
    );
}
