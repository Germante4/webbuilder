package lt.viko.eif.gbudreckyte.webbuilder.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "requirement_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WebsiteCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType questionType;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "placeholder")
    private String placeholder;

    @Column(name = "ai_refinement_enabled")
    private boolean aiRefinementEnabled;
}