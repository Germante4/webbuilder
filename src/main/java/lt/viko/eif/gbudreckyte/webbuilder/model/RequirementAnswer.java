package lt.viko.eif.gbudreckyte.webbuilder.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "requirement_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private RequirementQuestion question;

    @Column(columnDefinition = "TEXT")
    private String answerText;
}