
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/ProjectValuePage.css";

import {
  updateProjectSummary,
  type ProjectSummary,
} from "../services/requirementService";

import {
  getProjectDraft,
  saveProjectDraft,
} from "../services/projectDraftService";

interface ValueAnswers {
  difference: string;
  problem: string;
  result: string;
}

interface ValueDraft {
  category?: string;
  answers?: ValueAnswers;
  projectSummary?: ProjectSummary;
}

const EMPTY_ANSWERS: ValueAnswers = {
  difference: "",
  problem: "",
  result: "",
};

function ProjectValuePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = location.state as {
    websiteCategory?: string;
    websiteFormat?: string;
    projectSummary?: ProjectSummary;
  } | null;

  const draft = getProjectDraft();

  const websiteCategory =
    routeState?.websiteCategory ??
    draft.websiteCategory ??
    "";

  const websiteFormat =
    routeState?.websiteFormat ??
    draft.websiteFormat;

  const savedValueDraft =
    draft.fields?.projectValue as
      | ValueDraft
      | undefined;

  const validSavedDraft =
    savedValueDraft?.category === websiteCategory
      ? savedValueDraft
      : undefined;

  const savedDetails =
    draft.fields?.projectDetails as
      | {
          projectSummary?: ProjectSummary;
        }
      | undefined;

  const initialProjectSummary =
    routeState?.projectSummary ??
    validSavedDraft?.projectSummary ??
    savedDetails?.projectSummary ??
    null;

  const [currentProjectSummary, setCurrentProjectSummary] =
    useState<ProjectSummary | null>(
      initialProjectSummary
    );

  const [answers, setAnswers] =
    useState<ValueAnswers>(() => ({
      ...EMPTY_ANSWERS,
      ...(validSavedDraft?.answers ?? {}),
    }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Automatiškai išsaugome atsakymus.
  useEffect(() => {
    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectValue: {
          category: websiteCategory,
          answers,
          projectSummary: currentProjectSummary ?? undefined,
        } satisfies ValueDraft,
      },
    });
  }, [
    answers,
    websiteCategory,
    websiteFormat,
    currentProjectSummary,
  ]);

  const handleChange = (
    field: keyof ValueAnswers,
    value: string
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const isFormValid =
    answers.difference.trim() !== "" &&
    answers.problem.trim() !== "" &&
    answers.result.trim() !== "";

  const handleContinue = async () => {
    if (!isFormValid || loading) {
      return;
    }

    if (!websiteCategory) {
      setError(
        "Trūksta svetainės kategorijos. Grįžkite į pirmą etapą."
      );
      return;
    }

    if (!currentProjectSummary) {
      setError(
        "Trūksta ankstesnės projekto santraukos. Grįžkite į projekto klausimus."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const valueAnswers: Record<string, string> = {
        "Kuo jūsų verslas išsiskiria iš kitų?":
          answers.difference.trim(),

        "Dėl ko klientai dažniausiai kreipiasi į jus?":
          answers.problem.trim(),

        "Kokį rezultatą klientas gauna pasirinkęs jus?":
          answers.result.trim(),
      };

      console.log(
        "ANKSTESNĖ PROJEKTO SANTRAUKA:",
        currentProjectSummary
      );

      console.log(
        "04–06 ATSAKYMAI:",
        valueAnswers
      );

      const updatedProjectSummary =
        await updateProjectSummary(
          websiteCategory,
          valueAnswers,
          currentProjectSummary
        );

      console.log(
        "ATNAUJINTA AI PROJEKTO SANTRAUKA:",
        updatedProjectSummary
      );

      // Išsaugome AI rezultatą.
      setCurrentProjectSummary(updatedProjectSummary);

      saveProjectDraft({
        websiteCategory,
        websiteFormat,
        fields: {
          ...getProjectDraft().fields,
          projectValue: {
            category: websiteCategory,
            answers,
            projectSummary: updatedProjectSummary,
          } satisfies ValueDraft,
        },
      });

      navigate("/projects/new/design", {
        state: {
          websiteCategory,
          websiteFormat,
          projectSummary: updatedProjectSummary,
        },
      });
    } catch (err) {
      console.error(
        "Nepavyko atnaujinti projekto santraukos:",
        err
      );

      setError(
        "Nepavyko išanalizuoti atsakymų. Bandykite dar kartą."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="value-page">
      <header className="value-header">
        <Link
          to="/projects/new/details"
          state={{
            websiteCategory,
            websiteFormat,
            projectSummary: currentProjectSummary,
          }}
          className="value-back"
        >
          ← Atgal
        </Link>

        <Link to="/" className="value-logo">
          WebBuilder
        </Link>

        <span className="value-step">
          03 / Jūsų vertė
        </span>
      </header>

      <main className="value-main">
        <section className="value-intro">
          <p className="value-eyebrow">
            03 / SUPRASKIME JŪSŲ VERTĘ
          </p>

          <h1>
            Kuo jūsų verslas
            <br />
            svarbus klientui?
          </h1>

          <p className="value-description">
            Dabar norime geriau suprasti, kodėl klientai
            renkasi jus ir kokią vertę jiems sukuriate.
            Atsakykite paprastai — sistema padės išgryninti
            jūsų mintis.
          </p>

          <div className="value-info">
            <span className="value-info-icon">✦</span>

            <div>
              <strong>Kodėl to klausiame?</strong>

              <p>
                Šie atsakymai padės sistemai suprasti, ką
                svetainėje verta akcentuoti ir kokią
                pagrindinę žinutę perduoti lankytojui.
              </p>
            </div>
          </div>
        </section>

        <section className="value-form-section">
          <div className="value-form-heading">
            <span>VERTĖ KLIENTUI</span>
            <span>3 klausimai</span>
          </div>

          <div className="value-questions">
            {/* QUESTION 04 */}
            <div className="value-question">
              <div className="value-question-header">
                <span className="value-question-number">
                  04
                </span>

                <label htmlFor="difference">
                  Kuo jūsų verslas išsiskiria iš kitų?
                  <span className="value-required">*</span>
                </label>
              </div>

              <div className="value-input">
                <textarea
                  id="difference"
                  rows={5}
                  value={answers.difference}
                  placeholder="Pvz. specializuojamės investiciniame NT ir padedame klientui ne tik rasti objektą, bet ir įvertinti jo investicinį potencialą."
                  onChange={(event) =>
                    handleChange(
                      "difference",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* QUESTION 05 */}
            <div className="value-question">
              <div className="value-question-header">
                <span className="value-question-number">
                  05
                </span>

                <label htmlFor="problem">
                  Dėl ko klientai dažniausiai kreipiasi į jus?
                  <span className="value-required">*</span>
                </label>
              </div>

              <div className="value-input">
                <textarea
                  id="problem"
                  rows={5}
                  value={answers.problem}
                  placeholder="Papasakokite, kokią problemą, poreikį ar norą klientas turi prieš pasirinkdamas jūsų paslaugą."
                  onChange={(event) =>
                    handleChange(
                      "problem",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* QUESTION 06 */}
            <div className="value-question">
              <div className="value-question-header">
                <span className="value-question-number">
                  06
                </span>

                <label htmlFor="result">
                  Kokį rezultatą klientas gauna pasirinkęs jus?
                  <span className="value-required">*</span>
                </label>
              </div>

              <div className="value-input">
                <textarea
                  id="result"
                  rows={5}
                  value={answers.result}
                  placeholder="Kas pasikeičia klientui pasinaudojus jūsų paslauga ar produktu?"
                  onChange={(event) =>
                    handleChange(
                      "result",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="value-error" role="alert">
              {error}
            </p>
          )}

          <div className="value-footer">
            <div className="value-footer-text">
              <strong>
                Nebūtina rašyti kaip reklamoje.
              </strong>

              <span>
                Papasakokite savais žodžiais — sistema
                padės jūsų atsakymus paversti aiškia
                svetainės žinute.
              </span>
            </div>

            <button
              type="button"
              className="value-continue"
              disabled={!isFormValid || loading}
              onClick={handleContinue}
            >
              {loading
                ? "Analizuojame..."
                : "Tęsti"}

              <span>→</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProjectValuePage;
