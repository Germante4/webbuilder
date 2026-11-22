
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";


import type { ProjectSummary } from "../services/requirementService";
import type { DesignSummary } from "../services/designSummaryService";
import type { ProjectAssetUploadResponse } from "../services/projectAssetService";
import type { DesignDirection } from "../services/designDirectionService";
import { getProjectDraft } from "../services/projectDraftService";

import DesktopWebsitePreview from "../pages/DesktopWebsitePreview";
import { getToken } from "../services/authService";

import {
  generateStitchPrompt,
  generateStitchDesign,
  getStitchGenerationStatus,
  type StitchGenerationStatus,
  type ProjectContactInformation,
  type WebsiteContent,
} from "../services/stitchService";

import "../styles/ProjectPreviewPage.css";
import WebsiteGenerationScreen from "../components/WebsiteGenerationScreen";

// ========================================
// TYPES
// ========================================

interface PreviewState {
  websiteCategory?: string;
  websiteFormat?: string;
  websiteLanguage?: string;
  projectSummary?: ProjectSummary;
  designSummary?: DesignSummary;
  selectedDirection?: DesignDirection;
  uploadedAssets?: ProjectAssetUploadResponse;
  webBuilderProjectId?: number | null;
  openSavedProject?: boolean;
}

interface SavedProject {
  id: number;
  name: string;
  stitchProjectId: string | null;
  stitchScreenId: string | null;
  generatedHtml?: string | null;
  generationStatus?: StitchGenerationStatus | null;
  generationError?: string | null;
}

interface DesignCandidate {
  id: number;
  projectId: number;
  screenId: string;
  html: string;
  instruction: string | null;
}

type DesignChoice = "CURRENT" | "NEW";

interface PreviewResult {
  projectId: string;
  screenId: string;
}

const GENERATION_POLL_INTERVAL_MS = 5000;

function DesignComparisonPreview({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const desktopWidth = 1440;
  const desktopHeight = 900;
  const scale = containerWidth
    ? Math.min(containerWidth / desktopWidth, 1)
    : 0;

  return (
    <>
      <div className="comparison-preview-toolbar">
        <span>Desktop · 1440 px</span>

        <button
          type="button"
          onClick={() => setExpanded(true)}
        >
          ⛶ Peržiūrėti visu dydžiu
        </button>
      </div>

      <div
        ref={containerRef}
        className="comparison-preview-viewport"
        style={{
          height: scale
            ? `${desktopHeight * scale}px`
            : "280px",
        }}
      >
        {scale > 0 && (
          <iframe
            title={title}
            srcDoc={html}
            sandbox="allow-scripts"
            style={{
              width: desktopWidth,
              height: desktopHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        )}
      </div>

      {expanded && (
        <div
          className="comparison-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="comparison-fullscreen-header">
            <div>
              <strong>{title}</strong>
              <span>Desktop peržiūra</span>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(false)}
            >
              ✕ Uždaryti
            </button>
          </div>

          <div className="comparison-fullscreen-content">
            <iframe
              title={`${title} – pilna peržiūra`}
              srcDoc={html}
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </>
  );
}


const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

// ========================================
// API HELPERS
// ========================================

function authHeaders(): HeadersInit {
  const token = getToken();

  if (!token) {
    throw new Error("Prisijunkite iš naujo.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function readApiError(
  response: Response
): Promise<string> {
  const text = await response.text();

  try {
    const data = JSON.parse(text);

    return (
      data.message ??
      data.details ??
      data.error ??
      `Serverio klaida (${response.status})`
    );
  } catch {
    return text || `Serverio klaida (${response.status})`;
  }
}

// ========================================
// FETCH PROJECT FROM POSTGRESQL
// ========================================

async function fetchProject(
  projectId: number,
  signal?: AbortSignal
): Promise<SavedProject> {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}`,
    {
      headers: authHeaders(),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

// ========================================
// FETCH SAVED STITCH HTML
// ========================================

async function fetchSavedHtml(
  screenId: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(
    `${API_BASE}/api/stitch/saved-html/${encodeURIComponent(
      screenId
    )}`,
    {
      headers: authHeaders(),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data: { html?: string } =
    await response.json();

  if (
    typeof data.html !== "string" ||
    !data.html.trim()
  ) {
    throw new Error(
      "Serveris negrąžino svetainės HTML."
    );
  }

  return data.html;
}

// ========================================
// REFINE DESIGN
// ========================================

async function refineDesign(
  projectId: number,
  instruction: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/refine`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ instruction }),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

// ========================================
// GET CANDIDATE
// ========================================

async function fetchCandidate(
  projectId: number,
  signal?: AbortSignal
): Promise<DesignCandidate | null> {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/candidate`,
    {
      headers: authHeaders(),
      signal,
    }
  );

  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const candidate: DesignCandidate = await response.json();

  if (
    typeof candidate.html !== "string" ||
    !candidate.html.trim()
  ) {
    throw new Error(
      "AI sugeneruotas variantas neturi HTML."
    );
  }

  return candidate;
}

// ========================================
// CHOOSE DESIGN
// ========================================

async function chooseDesign(
  projectId: number,
  choice: DesignChoice
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/candidate/choose`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedVersion: choice,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

// ========================================
// COMPONENT
// ========================================

function isProjectContactInformation(
  value: unknown
): value is ProjectContactInformation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const contact = value as Record<string, unknown>;

  return (
    typeof contact.email === "string" &&
    typeof contact.phone === "string" &&
    typeof contact.address === "string" &&
    typeof contact.instagram === "string" &&
    typeof contact.facebook === "string" &&
    Array.isArray(contact.additionalContacts) &&
    contact.additionalContacts.every(
      (item: unknown) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return false;
        }

        const additional = item as Record<string, unknown>;

        return (
          typeof additional.label === "string" &&
          typeof additional.value === "string"
        );
      }
    )
  );
}
function isWebsiteContent(
  value: unknown
): value is WebsiteContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return (
    typeof content.emphasis === "string" &&
    Array.isArray(content.priorities) &&
    content.priorities.every(
      (item: unknown) => typeof item === "string"
    ) &&
    content.sections !== null &&
    typeof content.sections === "object" &&
    !Array.isArray(content.sections) &&
    Object.values(content.sections).every(
      (items) =>
        Array.isArray(items) &&
        items.every(
          (item: unknown) =>
            item !== null &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            Object.values(item).every(
              (field) => typeof field === "string"
            )
        )
    )
  );
}

function ProjectPreviewPage() {
  const location = useLocation();

  const state =
    location.state as PreviewState | null;

  const [loading, setLoading] =
    useState(false);

  const [restoring, setRestoring] =
    useState(true);

  const [htmlLoading, setHtmlLoading] =
    useState(false);

  const [refining, setRefining] =
    useState(false);

  const [choosing, setChoosing] =
    useState(false);

  const [result, setResult] =
    useState<PreviewResult | null>(null);

  const [
    webBuilderProjectId,
    setWebBuilderProjectId,
  ] = useState<number | null>(
    state?.webBuilderProjectId ?? null
  );

  // A: currently selected HTML from PostgreSQL
  const [originalHtml, setOriginalHtml] =
    useState<string | null>(null);

  // B: temporary AI candidate from PostgreSQL
  const [candidateHtml, setCandidateHtml] =
    useState<string | null>(null);

  const [
    designInstruction,
    setDesignInstruction,
  ] = useState("");

  const [
    designConfirmed,
    setDesignConfirmed,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [htmlError, setHtmlError] =
    useState("");

  const [designError, setDesignError] =
    useState("");

  const [designNotice, setDesignNotice] =
    useState("");

  const [reloadHtml, setReloadHtml] =
    useState(0);

  const [generationStatus, setGenerationStatus] =
    useState<StitchGenerationStatus | null>(null);
  const [generationError, setGenerationError] = useState("");

  const busyRef = useRef(false);
  const generationActive =
    generationStatus === "PENDING" || generationStatus === "GENERATING";

  const canGenerate = Boolean(
    state?.projectSummary &&
    state?.designSummary &&
    state?.selectedDirection
  );

  // ========================================
  // RESTORE SAVED PROJECT
  // ========================================

  useEffect(() => {
    const projectId = state?.webBuilderProjectId;

    if (!projectId || !state?.openSavedProject) {
      setRestoring(false);
      return;
    }

    const controller = new AbortController();

    setRestoring(true);
    setError("");

    void fetchProject(
      projectId,
      controller.signal
    )
      .then((project) => {
        if (controller.signal.aborted) return;

        setWebBuilderProjectId(project.id);
        setGenerationStatus(project.generationStatus ?? (
          project.stitchScreenId ? "COMPLETED" : null
        ));
        setGenerationError(project.generationError ?? "");

        if (project.stitchScreenId) {
          setResult({
            projectId: project.stitchProjectId ?? "",
            screenId: project.stitchScreenId,
          });
        } else if (
          project.generationStatus !== "PENDING" &&
          project.generationStatus !== "GENERATING" &&
          project.generationStatus !== "FAILED"
        ) {
          setError("Projektas dar neturi sugeneruotos svetainės.");
        }

        if (project.generatedHtml?.trim()) {
          setOriginalHtml(project.generatedHtml);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nepavyko atidaryti projekto."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRestoring(false);
        }
      });

    return () => controller.abort();
  }, [
    state?.webBuilderProjectId,
    state?.openSavedProject,
  ]);

  // ========================================
  // POLL GENERATION STATUS
  // ========================================

  useEffect(() => {
    if (!webBuilderProjectId || !generationActive) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkStatus = async () => {
      try {
        const status = await getStitchGenerationStatus(webBuilderProjectId);
        if (cancelled) return;

        setGenerationStatus(status.generationStatus);
        setGenerationError(status.generationError ?? "");

        if (status.generationStatus === "COMPLETED") {
          if (!status.screenId) {
            setError("Generavimas baigtas, bet nerastas svetainės ekrano ID.");
            return;
          }

          setResult({
            projectId: status.projectId ?? "",
            screenId: status.screenId,
          });
          setReloadHtml((value) => value + 1);
          setNotice("Svetainė sugeneruota ir išsaugota.");
          setError("");
          return;
        }

        if (status.generationStatus === "FAILED") {
          setError(status.generationError || "Svetainės generavimas nepavyko.");
          return;
        }

        if (status.generationStatus === "PENDING" ||
            status.generationStatus === "GENERATING") {
          timer = setTimeout(checkStatus, GENERATION_POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        // Laikinas tinklo sutrikimas neturi nutraukti generavimo stebėjimo.
        console.error("Generation status polling error:", err);
        setNotice("Nepavyko patikrinti būsenos. Bandysime dar kartą.");
        timer = setTimeout(checkStatus, GENERATION_POLL_INTERVAL_MS);
      }
    };

    void checkStatus();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [webBuilderProjectId, generationActive]);

  // ========================================
  // LOAD ORIGINAL HTML
  // PostgreSQL is the source of truth.
  // ========================================

  useEffect(() => {
    const projectId = webBuilderProjectId;
    const screenId = result?.screenId;

    if (!projectId || !screenId) {
      return;
    }

    const controller = new AbortController();

    setHtmlLoading(true);
    setHtmlError("");

    const load = async () => {
      try {
        const project = await fetchProject(
          projectId,
          controller.signal
        );

        if (controller.signal.aborted) return;

        let html = project.generatedHtml;

        // Fallback only for projects without HTML in API.
        if (!html?.trim()) {
          html = await fetchSavedHtml(
            screenId,
            controller.signal
          );
        }

        if (!controller.signal.aborted) {
          setOriginalHtml(html);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setHtmlError(
          err instanceof Error
            ? err.message
            : "Nepavyko įkelti svetainės HTML."
        );
      } finally {
        if (!controller.signal.aborted) {
          setHtmlLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [
    webBuilderProjectId,
    result?.screenId,
    reloadHtml,
  ]);

  // ========================================
  // RESTORE EXISTING CANDIDATE
  // ========================================

  useEffect(() => {
    if (!webBuilderProjectId || !result || generationActive) {
      return;
    }

    const controller = new AbortController();

    void fetchCandidate(
      webBuilderProjectId,
      controller.signal
    )
      .then((candidate) => {
        if (controller.signal.aborted) return;

        setCandidateHtml(
  candidate?.html ?? null
);
        if (candidate?.instruction) {
          setDesignInstruction(
            candidate.instruction
          );
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        console.error(
          "Candidate restore error:",
          err
        );
      });

    return () => controller.abort();
  }, [
    webBuilderProjectId,
    result?.screenId,
    generationActive,
  ]);

  // ========================================
  // GENERATE FIRST WEBSITE
  // ========================================

  const handleGenerate = async () => {
    if (
      !state?.projectSummary ||
      !state?.designSummary ||
      !state?.selectedDirection
    ) {
      setError(
        "Trūksta projekto duomenų."
      );
      return;
    }

    if (busyRef.current || generationActive || refining || choosing) {
      return;
    }

    busyRef.current = true;

    setLoading(true);
    setError("");
    setNotice("");
    setDesignError("");

    try {
      const websiteLanguage: "lt" | "en" =
        state.websiteLanguage === "en"
          ? "en"
          : "lt";

const savedContent =
  getProjectDraft().fields?.websiteContent;

const websiteContent: WebsiteContent | null =
  isWebsiteContent(savedContent)
    ? savedContent
    : null;

console.log(
  "WEBSITE CONTENT:",
  websiteContent
);

const prompt = await generateStitchPrompt({
  projectSummary: state.projectSummary,
  designSummary: state.designSummary,

  websiteCategory:
    state.websiteCategory ?? "SERVICES",

  websiteFormat:
    state.websiteFormat ?? "LANDING_PAGE",

  websiteLanguage,

  selectedDirection: JSON.stringify(
    state.selectedDirection
  ),

  uploadedAssets:
    state.uploadedAssets ?? null,

  websiteContent,
});

console.log("FINAL STITCH PROMPT:", prompt);

      const savedContact = getProjectDraft().fields?.projectContact;

const contactInformation: ProjectContactInformation | null =
  isProjectContactInformation(savedContact)
    ? savedContact
    : null;

const generated = await generateStitchDesign({
  prompt,
  projectName: "Nauja svetainė",
  projectDescription: null,
  websiteCategory:
    state.websiteCategory ?? "SERVICES",
  webBuilderProjectId,
  contactInformation,
});

      setWebBuilderProjectId(generated.webBuilderProjectId);
      setGenerationStatus(generated.generationStatus);
      setGenerationError("");
      setResult(null);
      setOriginalHtml(null);
      setCandidateHtml(null);
      setDesignInstruction("");
      setDesignConfirmed(false);
      setNotice(
        "Generavimas pradėtas. Galite grįžti į projektų sąrašą – darbas tęsis serveryje."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepavyko sugeneruoti dizaino."
      );
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  // ========================================
  // AI REFINE DESIGN
  // ========================================

  const handleRefineDesign = async () => {
    if (!webBuilderProjectId) {
      setDesignError(
        "Projektas dar neišsaugotas."
      );
      return;
    }

    const instruction = designInstruction.trim();

    if (!instruction) {
      setDesignError(
        "Aprašykite pageidaujamus pakeitimus."
      );
      return;
    }

    if (
      refining ||
      choosing ||
      loading ||
      candidateHtml
    ) {
      return;
    }

    setRefining(true);
    setDesignError("");
    setDesignNotice("");
    setDesignConfirmed(false);

    try {
      await refineDesign(
        webBuilderProjectId,
        instruction
      );

      const candidate = await fetchCandidate(
        webBuilderProjectId
      );

      if (!candidate) {
        throw new Error(
          "AI variantas sukurtas, tačiau jo nepavyko gauti."
        );
      }

      setCandidateHtml(candidate.html);

      setDesignNotice(
        "AI dizaino variantas paruoštas. Palyginkite abu variantus."
      );
    } catch (err) {
      setDesignError(
        err instanceof Error
          ? err.message
          : "Nepavyko patobulinti dizaino."
      );
    } finally {
      setRefining(false);
    }
  };

  // ========================================
  // CHOOSE A OR B
  // ========================================

  const handleChooseDesign = async (
    choice: DesignChoice
  ) => {
    if (!webBuilderProjectId) {
      return;
    }

    if (choosing || refining) {
      return;
    }

    if (choice === "NEW" && !candidateHtml) {
      setDesignError(
        "AI dizaino variantas nerastas."
      );
      return;
    }

    setChoosing(true);
    setDesignError("");
    setDesignNotice("");

    try {
      await chooseDesign(
        webBuilderProjectId,
        choice
      );

      // Read the selected version from PostgreSQL.
      const project = await fetchProject(
        webBuilderProjectId
      );

      if (project.generatedHtml?.trim()) {
        setOriginalHtml(project.generatedHtml);
      } else if (choice === "NEW" && candidateHtml) {
        // UI fallback if the project DTO omits HTML.
        setOriginalHtml(candidateHtml);
      }

      setCandidateHtml(null);
      setDesignInstruction("");
      setDesignConfirmed(true);

      setDesignNotice(
        choice === "NEW"
          ? "AI dizainas pasirinktas ir išsaugotas."
          : "Originalus dizainas paliktas."
      );
    } catch (err) {
      setDesignError(
        err instanceof Error
          ? err.message
          : "Nepavyko pasirinkti dizaino."
      );
    } finally {
      setChoosing(false);
    }
  };


  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="stitch-preview-page">
      <header className="stitch-preview-header">
        <Link
          to={
            state?.openSavedProject
              ? "/dashboard"
              : "/projects/new/directions"
          }
          state={
            state?.openSavedProject
              ? undefined
              : state
          }
          className="stitch-preview-back"
        >
          ← Grįžti
        </Link>

        <Link
          to="/"
          className="stitch-preview-logo"
        >
          WebBuilder
        </Link>

        <div className="stitch-preview-step">
  07 / Dizaino peržiūra
</div>
      </header>

      <main className="stitch-preview-main">
        {/* INTRO */}

        <section className="stitch-preview-intro">
          <div className="stitch-preview-eyebrow">
            SVETAINĖS DIZAINAS
          </div>

          <h1>
            Jūsų svetainės
            <br />
            dizainas.
          </h1>

          <p className="stitch-preview-description">
            Peržiūrėkite sugeneruotą svetainę,
            patobulinkite jos dizainą su AI
            ir pasirinkite labiausiai patinkantį
            variantą.
          </p>

          {!restoring && canGenerate && (
            <button
              type="button"
              className="stitch-preview-retry"
              disabled={
                loading ||
                generationActive ||
                refining ||
                choosing ||
                Boolean(candidateHtml)
              }
              onClick={() => void handleGenerate()}
            >
              {generationActive
                ? "Dizainas generuojamas..."
                : result
                  ? "Generuoti dizainą iš naujo"
                  : "Generuoti dizainą"}
            </button>
          )}
        </section>

        {/* NOTICES */}

        {restoring && (
          <p role="status">
            Įkeliamas išsaugotas projektas...
          </p>
        )}

        {!canGenerate &&
          !result &&
          !generationActive &&
          generationStatus !== "FAILED" &&
          !restoring &&
          !error && (
            <div
              className="stitch-preview-error"
              role="alert"
            >
              Trūksta projekto duomenų.
              Grįžkite į dizaino kūrimo etapą.
            </div>
          )}

        {(generationStatus === "PENDING" || generationStatus === "GENERATING") && (
          <WebsiteGenerationScreen status={generationStatus} />
        )}

        {generationStatus === "FAILED" && generationError && !error && (
          <div className="stitch-preview-error" role="alert">
            {generationError}
          </div>
        )}

        {notice && (
          <p role="status">{notice}</p>
        )}

        {error && (
          <div
            className="stitch-preview-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* CURRENT DESIGN */}

        {result && (
          <section className="stitch-preview-section">
            <div className="stitch-preview-section-heading">
              <span>ESAMAS DIZAINAS</span>
              <span>01 — 02</span>
            </div>

            <div className="stitch-preview-result">
              <div className="stitch-preview-result-heading">
                <span className="stitch-preview-number">
                  01
                </span>

                <div>
                  <h2>
                    Jūsų svetainės dizainas
                  </h2>

                  <p>
                    Tai šiuo metu išsaugota
                    svetainės versija.
                  </p>
                </div>
              </div>

              {htmlLoading ? (
                <div className="stitch-preview-image-placeholder">
                  <strong>
                    Įkeliama svetainė...
                  </strong>
                  <p>
                    Gaunamas išsaugotas HTML.
                  </p>
                </div>
              ) : originalHtml ? (
                <div className="stitch-preview-image-container">
                  <DesktopWebsitePreview
                    html={originalHtml}
                    screenId={result.screenId}
                  />
                </div>
              ) : (
                <div className="stitch-preview-image-placeholder">
                  <strong>
                    Peržiūra nepasiekiama
                  </strong>

                  <p>
                    {htmlError ||
                      "Nepavyko įkelti svetainės."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setReloadHtml(
                        (value) => value + 1
                      )
                    }
                  >
                    Bandyti dar kartą
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* DESIGN EDITOR */}

        {result && originalHtml && (
          <section className="design-editor">
            <div className="design-editor-heading">
              <span className="design-editor-eyebrow">
                02 / DIZAINO TOBULINIMAS
              </span>

              <h2>
                Patobulinkite savo dizainą.
              </h2>

              <p>
                Norėtumėte pakeisti spalvas,
                šriftus ar svetainės išdėstymą?
                Aprašykite pageidaujamus
                pakeitimus ir AI paruoš
                naują dizaino variantą.
              </p>
            </div>

            <div className="design-editor-form">
              <label htmlFor="design-instruction">
                Kokius pakeitimus norite atlikti?
              </label>

              <textarea
                id="design-instruction"
                value={designInstruction}
                onChange={(event) => {
                  setDesignInstruction(
                    event.target.value
                  );
                  setDesignConfirmed(false);
                }}
                placeholder="Pavyzdžiui: pakeisk pagrindinės sekcijos foną į švelniai žalią, padidink antraštę ir suapvalink mygtukų kampus."
                rows={5}
                maxLength={5000}
                disabled={
                  refining ||
                  choosing ||
                  Boolean(candidateHtml)
                }
              />

              <div className="design-editor-form-footer">
                <span>
                  Galite keisti spalvas,
                  tipografiją, išdėstymą
                  ir kitus vizualinius elementus.
                </span>

                <button
                  type="button"
                  disabled={
                    refining ||
                    choosing ||
                    loading ||
                    Boolean(candidateHtml) ||
                    !designInstruction.trim()
                  }
                  onClick={() =>
                    void handleRefineDesign()
                  }
                >
                  {refining
                    ? "AI tobulina dizainą..."
                    : "Generuoti pakeitimus"}
                </button>
              </div>
            </div>

            {designError && (
              <p
                className="design-editor-error"
                role="alert"
              >
                {designError}
              </p>
            )}

            {designNotice && (
              <p
                className="design-editor-notice"
                role="status"
              >
                {designNotice}
              </p>
            )}

            {/* A / B COMPARISON */}

            {candidateHtml && (
              <div className="design-comparison">
                <div className="design-comparison-heading">
                  <span className="design-editor-eyebrow">
                    03 / DIZAINO PALYGINIMAS
                  </span>

                  <h2>
                    Kurį variantą renkatės?
                  </h2>

                  <p>
                    Palyginkite originalų dizainą
                    ir AI atliktus pakeitimus.
                    Pasirinktas variantas
                    bus išsaugotas jūsų projekte.
                  </p>
                </div>

                <div className="design-comparison-grid">
                  {/* VERSION A */}

                  <div className="design-version">
                    <div className="design-version-heading">
                      <div>
                        <span>VERSIJA A</span>
                        <h3>
                          Esamas dizainas
                        </h3>
                      </div>

                      <span className="design-version-tag">
                        Originalas
                      </span>
                    </div>

                    <DesignComparisonPreview
  title="Versija A – esamas dizainas"
  html={originalHtml}
/>

                    <button
                      type="button"
                      className="design-version-button secondary"
                      disabled={choosing}
                      onClick={() =>
                        void handleChooseDesign(
                          "CURRENT"
                        )
                      }
                    >
                      Palikti esamą dizainą
                    </button>
                  </div>

                  {/* VERSION B */}

                  <div className="design-version">
                    <div className="design-version-heading">
                      <div>
                        <span>VERSIJA B</span>
                        <h3>
                          AI patobulintas dizainas
                        </h3>
                      </div>

                      <span className="design-version-tag">
                        AI pasiūlymas
                      </span>
                    </div>

                    <DesignComparisonPreview
  title="Versija B – AI dizainas"
  html={candidateHtml}
/>

                    <button
                      type="button"
                      className="design-version-button primary"
                      disabled={choosing}
                      onClick={() =>
                        void handleChooseDesign(
                          "NEW"
                        )
                      }
                    >
                      {choosing
                        ? "Išsaugoma..."
                        : "Pasirinkti AI dizainą"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM DESIGN */}

            {!candidateHtml && (
              <div className="design-next-step">
                <div>
                  <span className="design-editor-eyebrow">
                    KITAS ŽINGSNIS
                  </span>

                  <h3>
                    Ar dizainas jau toks,
                    kokio norite?
                  </h3>

                  <p>
                    Patvirtinę dizainą
                    galėsite pereiti prie
                    nuotraukų, tekstų
                    ir kontaktinių duomenų
                    personalizavimo.
                  </p>
                </div>

                {!designConfirmed ? (
                  <button
                    type="button"
                    className="design-next-button"
                    disabled={
                      refining ||
                      choosing ||
                      loading
                    }
                    onClick={() =>
                      setDesignConfirmed(true)
                    }
                  >
                    Patvirtinti dizainą
                  </button>
                ) : (
                  <div className="design-next-confirmed">
                    <strong>
                      Dizainas patvirtintas
                    </strong>

                    <p>
                      Galime pereiti prie
                      svetainės turinio
                      personalizavimo.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* GENERATION MODAL */}

      {loading && (
        <div
          className="stitch-preview-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stitch-preview-modal-title"
        >
          <div className="stitch-preview-modal">
            <div className="stitch-preview-modal-icon">
              <span className="stitch-preview-modal-spinner" />
            </div>

            <span className="stitch-preview-modal-eyebrow">
              WEBBUILDER AI
            </span>

            <h2 id="stitch-preview-modal-title">
              Jūsų dizainas generuojamas
            </h2>

            <p>
              Kuriame svetainės vizualinį
              variantą pagal pasirinktą
              dizaino kryptį.
            </p>

            <span className="stitch-preview-modal-note">
              Tai gali užtrukti kelias minutes.
            </span>
          </div>
        </div>
      )}

      {/* AI REFINEMENT MODAL */}

      {refining && (
        <div
          className="stitch-preview-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="design-refine-modal-title"
        >
          <div className="stitch-preview-modal">
            <div className="stitch-preview-modal-icon">
              <span className="stitch-preview-modal-spinner" />
            </div>

            <span className="stitch-preview-modal-eyebrow">
              WEBBUILDER AI
            </span>

            <h2 id="design-refine-modal-title">
              Tobuliname jūsų dizainą
            </h2>

            <p>
              AI analizuoja pageidaujamus
              pakeitimus ir ruošia
              naują svetainės variantą.
            </p>

            <span className="stitch-preview-modal-note">
              Originalus dizainas išliks
              nepakeistas, kol pasirinksite
              naują variantą.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectPreviewPage;
