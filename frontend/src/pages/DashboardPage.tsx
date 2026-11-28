import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../services/userService";
import { getProjects } from "../services/projectService";
import type { Project } from "../services/projectService";
import { getToken, logout } from "../services/authService";

import "../styles/DashboardPage.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

function isPublished(project: Project) {
  return Boolean(project.lastPublishedAt && project.publishedUrl);
}

const POLLING_INTERVAL = 5000;

const categoryLabels: Record<string, string> = {
  SERVICES: "Paslaugų svetainė",
  ECOMMERCE: "El. parduotuvė",
  PORTFOLIO: "Portfolio",
  PERSONAL: "Asmeninė svetainė",
  SCHOOL: "Mokyklos svetainė",
  EVENT: "Renginio svetainė",
  OTHER: "Kita",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Juodraštis",
  IN_PROGRESS: "Redaguojama",
  COMPLETED: "Užbaigta",
};

const generationStatusLabels: Record<string, string> = {
  PENDING: "Laukia generavimo",
  GENERATING: "Generuojama",
  COMPLETED: "Paruošta",
  FAILED: "Generavimas nepavyko",
};

function isGenerating(project: Project): boolean {
  return (
    project.generationStatus === "PENDING" ||
    project.generationStatus === "GENERATING"
  );
}

function getProjectStatusLabel(project: Project): string {
  if (project.generationStatus) {
    return generationStatusLabels[project.generationStatus];
  }

  return statusLabels[project.status] ?? project.status;
}

function getProjectStatusClass(project: Project): string {
  if (project.generationStatus) {
    return `generation-${project.generationStatus.toLowerCase()}`;
  }

  return `status-${project.status.toLowerCase()}`;
}

// ========================================
// PROJECT THUMBNAIL
// ========================================

function ProjectThumbnail({
  project,
}: {
  project: Project;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const screenId = project.stitchScreenId;
  const generating = isGenerating(project);
  const generationFailed =
    project.generationStatus === "FAILED";

  useEffect(() => {
    setHtml(null);
    setFailed(false);

    if (!screenId || generating) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error("Prisijungimo sesija nerasta.");
        }

        const response = await fetch(
          `${API_BASE}/api/stitch/saved-html/${encodeURIComponent(
            screenId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: { html?: string } =
          await response.json();

        if (!data.html?.trim()) {
          throw new Error("HTML tuščias.");
        }

        if (!controller.signal.aborted) {
          setHtml(data.html);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn(
            "Nepavyko įkelti projekto miniatiūros:",
            error
          );
          setFailed(true);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [screenId, generating]);

  return (
    <div
      className="dashboard-project-preview"
      aria-hidden="true"
    >
      {html ? (
        <div className="dashboard-thumbnail-viewport">
          <iframe
            title="Svetainės miniatiūra"
            className="dashboard-thumbnail-frame"
            srcDoc={html}
            sandbox="allow-scripts"
            tabIndex={-1}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="dashboard-preview-fallback">
          <span>WEBBUILDER / PROJECT</span>

          {generating ? (
            <>
              <div
                className="dashboard-preview-lines"
                style={{
                  opacity: 0.65,
                }}
              >
                <i />
                <i />
                <i />
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: "16px",
                }}
              >
                {project.generationStatus === "PENDING"
                  ? "Laukiama generavimo..."
                  : "Kuriama jūsų svetainė..."}
              </strong>

              <small>
                Generavimas vyksta fone
              </small>
            </>
          ) : generationFailed ? (
            <>
              <div className="dashboard-preview-lines">
                <i />
                <i />
                <i />
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: "16px",
                }}
              >
                Generavimas nepavyko
              </strong>

              <small>
                Atidarykite projektą
              </small>
            </>
          ) : (
            <>
              <div className="dashboard-preview-lines">
                <i />
                <i />
                <i />
              </div>

              {failed && (
                <small>
                  Peržiūra nepasiekiama
                </small>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// DASHBOARD
// ========================================

function DashboardPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<{
    projectId: number;
    message: string;
  } | null>(null);

  async function copyPublishedUrl(projectId: number, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback({ projectId, message: "Nuoroda nukopijuota." });
    } catch {
      setCopyFeedback({ projectId, message: "Nepavyko nukopijuoti. Atidarykite svetainę ir nukopijuokite adresą." });
    }
  }

  const [showPublished, setShowPublished] = useState(false);
  const visibleProjects = projects.filter((project) => isPublished(project) === showPublished);

  const hasActiveGeneration = projects.some(isGenerating);

  // ========================================
  // INITIAL DATA LOAD
  // ========================================

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      try {
        const [user, userProjects] =
          await Promise.all([
            getCurrentUser(),
            getProjects(),
          ]);

        if (!active) return;

        setUserName(user.name);
        setProjects(userProjects);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nepavyko įkelti duomenų."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ========================================
  // POLLING WHILE GENERATING
  // ========================================

  useEffect(() => {
    if (loading || !hasActiveGeneration) {
      return;
    }

    let active = true;
    let requestInProgress = false;

    const refreshProjects = async () => {
      if (requestInProgress) return;

      requestInProgress = true;

      try {
        const updatedProjects = await getProjects();

        if (!active) return;

        setProjects(updatedProjects);
        setRefreshError("");
      } catch (err) {
        if (!active) return;

        console.error(
          "Nepavyko atnaujinti projektų:",
          err
        );

        setRefreshError(
          "Nepavyko atnaujinti generavimo būsenos. " +
          "Bandysime dar kartą."
        );
      } finally {
        requestInProgress = false;
      }
    };

    const intervalId = window.setInterval(
      () => void refreshProjects(),
      POLLING_INTERVAL
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [loading, hasActiveGeneration]);

  // ========================================
  // ACTIONS
  // ========================================

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openProject = (project: Project) => {
    const { id } = project;
    if (!isGenerating(project) && project.generationStatus !== "FAILED" && (
      isPublished(project) ||
      localStorage.getItem(`wb-personalize-visited-${id}`) === "true" ||
      localStorage.getItem(`wb-design-finalized-${id}`) === "true"
    )) {
      navigate(`/projects/${id}/personalize`);
      return;
    }

    navigate("/projects/new/preview", {
      state: {
        webBuilderProjectId: id,
        openSavedProject: true,
      },
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link
          to="/"
          className="dashboard-logo"
        >
          WebBuilder
        </Link>

        <div className="dashboard-nav">
          <span>Mano svetainės</span>

          <button
            type="button"
            onClick={handleLogout}
          >
            Atsijungti
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <p className="dashboard-label">
              MANO SVETAINĖS
            </p>

            <h1>
              {loading
                ? "Kraunama..."
                : userName
                  ? `Labas, ${userName}!`
                  : "Tavo svetainės"}
            </h1>

            <p className="dashboard-description">
              Čia tavo kūrybinė erdvė. Kurk,
              redaguok ir valdyk savo svetaines.
            </p>
          </div>

          <Link
            to="/projects/new"
            className="dashboard-new-button"
          >
            <span>+</span>
            Nauja svetainė
          </Link>
        </div>

        <section className="dashboard-projects dashboard-project-panel">
          <div className="dashboard-section-header">
            <h2>Svetainės</h2>

            <span>
              {visibleProjects.length}{" "}
              {visibleProjects.length === 1
                ? "svetainė"
                : "svetainės"}
            </span>
          </div>

          <div className="dashboard-project-switch" role="group" aria-label="Projektų rodinys">
            <button type="button" aria-pressed={!showPublished} onClick={() => setShowPublished(false)}>
              Redaguojamos
            </button>
            <button type="button" aria-pressed={showPublished} onClick={() => setShowPublished(true)}>
              Paskelbtos
            </button>
          </div>

          {hasActiveGeneration && (
            <p role="status">
              Svetainės generuojamos fone.
              Projektų būsenos atnaujinamos
              automatiškai kas 5 sekundes.
            </p>
          )}

          {refreshError && (
            <p role="alert">
              {refreshError}
            </p>
          )}

          {loading ? (
            <div className="dashboard-empty">
              <p>Kraunami tavo projektai...</p>
            </div>
          ) : error ? (
            <div className="dashboard-empty">
              <h3>Nepavyko įkelti duomenų</h3>
              <p role="alert">{error}</p>
            </div>
          ) : projects.length === 0 && !showPublished ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                +
              </div>

              <h3>Dar neturi projektų</h3>

              <p>
                Sukurk pirmą projektą ir pradėk
                formuoti savo svetainės viziją.
              </p>

              <Link to="/projects/new">
                Sukurti pirmą projektą →
              </Link>
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="dashboard-empty">
              <p>{showPublished ? "Dar nėra paskelbtų svetainių." : "Šiuo metu nėra redaguojamų projektų."}</p>
            </div>
          ) : (
            <div className="dashboard-project-grid">
              {visibleProjects.map((project) => (
                <article
                  className="dashboard-project-card"
                  key={project.id}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={
                      `Atidaryti projektą ${project.name}`
                    }
                    onClick={() =>
                      openProject(project)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        openProject(project);
                      }
                    }}
                  >
                    <ProjectThumbnail
                      project={project}
                    />

                    <div className="dashboard-project-info">
                      <div className="dashboard-project-meta">
                        <span>
                          {categoryLabels[
                            project.websiteCategory ?? ""
                          ] ?? "Svetainė"}
                        </span>

                        <span
                          className={
                            `dashboard-project-status ` +
                            getProjectStatusClass(project)
                          }
                        >
                          {getProjectStatusLabel(project)}
                        </span>
                      </div>

                      <h3>{project.name}</h3>

                      {project.description && (
                        <p>{project.description}</p>
                      )}

                      {project.generationStatus ===
                        "FAILED" &&
                        project.generationError && (
                          <p role="status">
                            {project.generationError}
                          </p>
                        )}

                      <div className="dashboard-project-bottom">
                        <span>
                          {new Date(
                            project.updatedAt
                          ).toLocaleDateString("lt-LT")}
                        </span>

                        <span className="dashboard-project-arrow">
                          ↗
                        </span>
                      </div>
                    </div>
                  </div>
                  {project.lastPublishedAt && project.publishedUrl && (
                    <div className="dashboard-project-info">
                      <p><strong>Paskelbta</strong></p>
                      <div className="dashboard-project-meta">
                        <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer">
                          Atidaryti svetainę
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (project.publishedUrl) {
                              void copyPublishedUrl(project.id, project.publishedUrl);
                            }
                          }}
                        >
                          Kopijuoti nuorodą
                        </button>
                        <Link to={`/projects/${project.id}/personalize`}>
                          Redaguoti svetainę
                        </Link>
                      </div>
                      {copyFeedback?.projectId === project.id && (
                        <p role="status">{copyFeedback.message}</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
