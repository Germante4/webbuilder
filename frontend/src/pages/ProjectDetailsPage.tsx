import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getProjectDraft, saveProjectDraft } from "../services/projectDraftService";



import {
  getRequirementQuestions,
  refineAudience,
  updateProjectSummary,
  type RequirementQuestion,
  type RequirementRefinementResponse,
} from "../services/requirementService";
import "../styles/ProjectDetailsPage.css";

function ProjectDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const draft = getProjectDraft();
  const websiteCategory = (location.state?.websiteCategory ?? draft.websiteCategory) as string | undefined;
  const websiteFormat = (location.state?.websiteFormat ?? draft.websiteFormat) as string | undefined;

  type DetailsDraft = {
    category?: string;
    answers?: Record<number, string>;
    audienceRefinement?: RequirementRefinementResponse | null;
    selectedRefinement?: string;
    refinementStep?: number;
    refinementAnswers?: string[];
  };

const getSavedDetails = (): DetailsDraft => {
  const saved = getProjectDraft().fields?.projectDetails as
    | DetailsDraft
    | undefined;

  if (saved && saved.category === websiteCategory) {
    return saved;
  }

  return {};
};

  const [questions, setQuestions] = useState<RequirementQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>(() => getSavedDetails().answers ?? {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [audienceRefinement, setAudienceRefinement] =
    useState<RequirementRefinementResponse | null>(() => getSavedDetails().audienceRefinement ?? null);

  const [refinementLoading, setRefinementLoading] =
    useState(false);

  const [selectedRefinement, setSelectedRefinement] =
    useState(() => getSavedDetails().selectedRefinement ?? "");

  const [refinementStep, setRefinementStep] =
    useState(() => getSavedDetails().refinementStep ?? 0);

  const [refinementAnswers, setRefinementAnswers] =
    useState<string[]>(() => getSavedDetails().refinementAnswers ?? []);

  useEffect(() => {
    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectDetails: {
          category: websiteCategory,
          answers,
          audienceRefinement,
          selectedRefinement,
          refinementStep,
          refinementAnswers,
        },
      },
    });
  }, [websiteCategory, websiteFormat, answers, audienceRefinement, selectedRefinement, refinementStep, refinementAnswers]);

  useEffect(() => {
    if (!websiteCategory) {
      setError("Nepasirinkta svetainės kategorija.");
      setLoading(false);
      return;
    }

    getRequirementQuestions(websiteCategory)
      .then((data) => {
        setQuestions(data);
      })
      .catch((error) => {
        console.error(
          "Nepavyko gauti klausimų:",
          error
        );

        setError(
          "Nepavyko gauti projekto klausimų."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [websiteCategory]);

  const handleAnswerChange = (
    questionId: number,
    value: string
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: value,
    }));
    // Jei pakeistas auditorijos atsakymas, senas AI patikslinimas nebegalioja.
    if (questions.some((question) => question.id === questionId && question.aiRefinementEnabled)) {
      setAudienceRefinement(null);
      setSelectedRefinement("");
      setRefinementStep(0);
      setRefinementAnswers([]);
    }
  };

  const buildProjectAnswers = () => {
    return questions.reduce<Record<string, string>>(
      (result, question) => {
        const questionAnswer =
          answers[question.id];

        if (questionAnswer?.trim()) {
          result[question.questionText] =
            questionAnswer.trim();
        }

        return result;
      },
      {}
    );
  };
  const handleContinue = async () => {
  if (!websiteCategory) {
    return;
  }

  try {
    setLoading(true);
    setError("");

    const projectAnswers = buildProjectAnswers();

    /*
     * Jeigu auditorija buvo patikslinta su AI,
     * summary naudojame kaip galutinį auditorijos atsakymą.
     */
    if (
      audienceRefinement &&
      !audienceRefinement.needsRefinement &&
      audienceRefinement.summary
    ) {
      const audienceQuestion = questions.find(
        (question) => question.aiRefinementEnabled
      );

      if (audienceQuestion) {
        projectAnswers[audienceQuestion.questionText] =
          audienceRefinement.summary;
      }
    }

    const projectSummary = await updateProjectSummary(
      websiteCategory,
      projectAnswers,
      null
    );

    console.log(
      "AI projekto santrauka:",
      projectSummary
    );

    navigate("/projects/new/value", {
      state: {
        websiteCategory,
        websiteFormat,
        basicAnswers: projectAnswers,
        projectSummary,
      },
    });
  } catch (error) {
    console.error(
      "Nepavyko sukurti projekto santraukos:",
      error
    );

    setError(
      "Nepavyko apdoroti projekto informacijos. Bandykite dar kartą."
    );
  } finally {
    setLoading(false);
  }
};

  const handleRefineAudience = async (
    questionId: number
  ) => {
    const answer = answers[questionId];

    if (
      !answer ||
      !answer.trim() ||
      !websiteCategory
    ) {
      return;
    }

    try {
      setRefinementLoading(true);

      setAudienceRefinement(null);
      setSelectedRefinement("");
      setRefinementStep(0);
      setRefinementAnswers([]);

      const projectAnswers =
        buildProjectAnswers();

      const result = await refineAudience(
        answer,
        websiteCategory,
        projectAnswers,
        [],
        0
      );

      setAudienceRefinement(result);
    } catch (error) {
      console.error(
        "Nepavyko patikslinti auditorijos:",
        error
      );
    } finally {
      setRefinementLoading(false);
    }
  };

  const handleRefinementSelect = async (
    option: string,
    questionId: number
  ) => {
    setSelectedRefinement(option);

    const originalAnswer =
      answers[questionId];

    if (
      !originalAnswer ||
      !websiteCategory
    ) {
      return;
    }

    const updatedAnswers = [
      ...refinementAnswers,
      option,
    ];

    const nextStep =
      refinementStep + 1;

    setRefinementAnswers(updatedAnswers);
    setRefinementStep(nextStep);

    const projectAnswers =
      buildProjectAnswers();

    try {
      setRefinementLoading(true);

      const result = await refineAudience(
        originalAnswer,
        websiteCategory,
        projectAnswers,
        updatedAnswers,
        nextStep
      );

      setAudienceRefinement(result);
      setSelectedRefinement("");
    } catch (error) {
      console.error(
        "Nepavyko gauti kito auditorijos patikslinimo:",
        error
      );
    } finally {
      setRefinementLoading(false);
    }
  };

  const renderQuestionInput = (
    question: RequirementQuestion
  ) => {
    const value =
      answers[question.id] || "";

    switch (question.questionType) {
      case "TEXT":
        return (
          <input
            id={`question-${question.id}`}
            type="text"
            value={value}
            placeholder={
              question.placeholder ||
              "Įrašykite savo atsakymą..."
            }
            onChange={(event) =>
              handleAnswerChange(
                question.id,
                event.target.value
              )
            }
          />
        );

      case "TEXTAREA":
        return (
          <textarea
            id={`question-${question.id}`}
            value={value}
            rows={5}
            placeholder={
              question.placeholder ||
              "Trumpai papasakokite..."
            }
            onChange={(event) =>
              handleAnswerChange(
                question.id,
                event.target.value
              )
            }
          />
        );

      case "SINGLE_SELECT":
        return (
          <select
            id={`question-${question.id}`}
            value={value}
            onChange={(event) =>
              handleAnswerChange(
                question.id,
                event.target.value
              )
            }
          >
            <option value="">
              Pasirinkite variantą
            </option>

            {question.options.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.optionText}
                >
                  {option.optionText}
                </option>
              )
            )}
          </select>
        );

      case "BOOLEAN":
        return (
          <select
            id={`question-${question.id}`}
            value={value}
            onChange={(event) =>
              handleAnswerChange(
                question.id,
                event.target.value
              )
            }
          >
            <option value="">
              Pasirinkite
            </option>

            <option value="true">
              Taip
            </option>

            <option value="false">
              Ne
            </option>
          </select>
        );

      default:
        return (
          <input
            id={`question-${question.id}`}
            type="text"
            value={value}
            placeholder="Įrašykite savo atsakymą..."
            onChange={(event) =>
              handleAnswerChange(
                question.id,
                event.target.value
              )
            }
          />
        );
    }
  };

  return (
    <div className="details-page">
      <header className="details-header">
        <Link
          to="/projects/new"
          state={{ websiteCategory, websiteFormat }}
          className="details-back"
        >
          ← Atgal
        </Link>

        <Link
          to="/"
          className="details-logo"
        >
          WebBuilder
        </Link>

        <span className="details-step">
          02 / Apie projektą
        </span>
      </header>

      <main className="details-main">
        <section className="details-intro">
          <p className="details-eyebrow">
            02 / SUSIPAŽINKIME SU JŪSŲ PROJEKTU
          </p>

          <h1>
            Papasakokite apie
            <br />
            savo projektą.
          </h1>

          <p className="details-description">
            Pradėkime nuo kelių pagrindinių
            klausimų. Atsakykite savais
            žodžiais — techninių terminų
            žinoti nereikia.
          </p>

          <div className="details-next-info">
            <span className="details-next-icon">
              ✦
            </span>

            <div>
              <strong>
                Kas bus toliau?
              </strong>

              <p>
                Pagal jūsų atsakymus sistema
                galės pateikti tikslesnius
                klausimus ir jūsų projektui
                tinkamas vizualines kryptis.
              </p>
            </div>
          </div>
        </section>

        <section className="details-form-section">
          {loading && (
            <p className="details-loading">
              Kraunami klausimai...
            </p>
          )}

          {error && (
            <p className="details-error">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div className="details-form-heading">
                <span>
                  PAGRINDINĖ INFORMACIJA
                </span>

                <span>
                  {questions.length} klausimai
                </span>
              </div>

              <div className="details-questions">
                {questions.map(
                  (question, index) => (
                    <div
                      className="details-question"
                      key={question.id}
                    >
                      <div className="details-question-header">
                        <span className="details-question-number">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <label
                          htmlFor={`question-${question.id}`}
                        >
                          {question.questionText}

                          {question.required && (
                            <span className="details-required">
                              *
                            </span>
                          )}
                        </label>
                      </div>

                      <div className="details-input">
                        {renderQuestionInput(
                          question
                        )}

                        {question.aiRefinementEnabled && (
                          <div className="audience-refinement">
                            <button
                              type="button"
                              className="audience-refine-button"
                              disabled={
                                !answers[
                                  question.id
                                ]?.trim() ||
                                refinementLoading
                              }
                              onClick={() =>
                                handleRefineAudience(
                                  question.id
                                )
                              }
                            >
                              {refinementLoading
                                ? "Galvojame..."
                                : "✦ Patikslinti su AI"}
                            </button>

                            {audienceRefinement
                              ?.needsRefinement && (
                              <div className="audience-refinement-result">
                                <span className="audience-refinement-label">
                                  ✦ PATIKSLINKIME
                                </span>

                                <p className="audience-refinement-question">
                                  {
                                    audienceRefinement.question
                                  }
                                </p>

                                <div className="audience-refinement-options">
                                  {audienceRefinement.options.map(
                                    (
                                      option
                                    ) => (
                                      <label
                                        key={
                                          option
                                        }
                                        className={`audience-option ${
                                          selectedRefinement ===
                                          option
                                            ? "selected"
                                            : ""
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name="audience-refinement"
                                          value={
                                            option
                                          }
                                          checked={
                                            selectedRefinement ===
                                            option
                                          }
                                          onChange={() =>
                                            handleRefinementSelect(
                                              option,
                                              question.id
                                            )
                                          }
                                        />

                                        <span>
                                          {
                                            option
                                          }
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {audienceRefinement &&
                              !audienceRefinement.needsRefinement &&
                              audienceRefinement.summary && (
                                <div className="audience-refinement-result">
                                  <span className="audience-refinement-label">
                                    ✦ AUDITORIJA
                                    IŠGRYNINTA
                                  </span>

                                  <p className="audience-refinement-question">
                                    {
                                      audienceRefinement.summary
                                    }
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {questions.length > 0 && (
                <div className="details-footer">
                  <div className="details-footer-text">
                    <strong>
                      Nesijaudinkite dėl
                      formuluočių.
                    </strong>

                    <span>
                      Kuo natūraliau aprašysite
                      savo projektą, tuo geriau
                      sistema supras jūsų
                      viziją.
                    </span>
                  </div>

                  <button
  type="button"
  className="details-continue"
  onClick={handleContinue}
  disabled={loading}
>
  {loading ? "Analizuojame..." : "Tęsti"}
  <span>→</span>
</button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProjectDetailsPage;