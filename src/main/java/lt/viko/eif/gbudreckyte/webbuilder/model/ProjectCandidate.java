
package lt.viko.eif.gbudreckyte.webbuilder.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "project_candidates",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_candidate_project",
                columnNames = "project_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "stitch_project_id")
    private String stitchProjectId;

    @Column(name = "stitch_screen_id", nullable = false)
    private String stitchScreenId;

    @Column(name = "generated_html", columnDefinition = "TEXT", nullable = false)
    private String generatedHtml;

    @Column(name = "instruction", columnDefinition = "TEXT", nullable = false)
    private String instruction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
