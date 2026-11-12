import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/userService";
import { getProjects } from "../services/projectService";
import type { Project } from "../services/projectService";
import { getToken, logout } from "../services/authService";
import "../styles/DashboardPage.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

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

function ProjectThumbnail({ screenId }: { screenId?: string | null }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setHtml(null);
    setFailed(false);
    if (!screenId) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("Prisijungimo sesija nerasta");
        const response = await fetch(
          `${API_BASE}/api/stitch/saved-html/${encodeURIComponent(screenId)}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: { html?: string } = await response.json();
        if (!data.html?.trim()) throw new Error("HTML tuščias");
        if (!controller.signal.aborted) setHtml(data.html);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Nepavyko įkelti projekto miniatiūros:", error);
          setFailed(true);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [screenId]);

  return (
    <div className="dashboard-project-preview" aria-hidden="true">
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
          <div className="dashboard-preview-lines"><i /><i /><i /></div>
          {failed && <small>Peržiūra nepasiekiama</small>}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    let active = true;
    const loadDashboard = async () => {
      try {
        const [user, userProjects] = await Promise.all([getCurrentUser(), getProjects()]);
        if (!active) return;
        setUserName(user.name);
        setProjects(userProjects);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Nepavyko įkelti duomenų.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadDashboard();
    return () => { active = false; };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openProject = (id: number) => {
    navigate("/projects/new/preview", {
      state: { webBuilderProjectId: id, openSavedProject: true },
    });
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="dashboard-logo">WebBuilder</Link>
        <div className="dashboard-nav">
          <span>Mano projektai</span>
          <button type="button" onClick={handleLogout}>Atsijungti</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <p className="dashboard-label">MANO PROJEKTAI</p>
            <h1>{loading ? "Kraunama..." : userName ? `Labas, ${userName}!` : "Tavo svetainės"}</h1>
            <p className="dashboard-description">Čia tavo kūrybinė erdvė. Kurk, redaguok ir valdyk savo svetaines.</p>
          </div>
          <Link to="/projects/new" className="dashboard-new-button"><span>+</span>Naujas projektas</Link>
        </div>

        <section className="dashboard-projects">
          <div className="dashboard-section-header">
            <h2>Projektai</h2>
            <span>{projects.length} {projects.length === 1 ? "projektas" : "projektų"}</span>
          </div>

          {loading ? (
            <div className="dashboard-empty"><p>Kraunami tavo projektai...</p></div>
          ) : error ? (
            <div className="dashboard-empty"><h3>Nepavyko įkelti duomenų</h3><p role="alert">{error}</p></div>
          ) : projects.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">+</div>
              <h3>Dar neturi projektų</h3>
              <p>Sukurk pirmą projektą ir pradėk formuoti savo svetainės viziją.</p>
              <Link to="/projects/new">Sukurti pirmą projektą →</Link>
            </div>
          ) : (
            <div className="dashboard-project-grid">
              {projects.map(project => (
                <article
                  className="dashboard-project-card"
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Atidaryti projektą ${project.name}`}
                  onClick={() => openProject(project.id)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openProject(project.id);
                    }
                  }}
                >
                  <ProjectThumbnail screenId={project.stitchScreenId} />
                  <div className="dashboard-project-info">
                    <div className="dashboard-project-meta">
                      <span>{categoryLabels[project.websiteCategory ?? ""] ?? "Svetainė"}</span>
                      <span className={`dashboard-project-status status-${project.status.toLowerCase()}`}>
                        {statusLabels[project.status] ?? project.status}
                      </span>
                    </div>
                    <h3>{project.name}</h3>
                    {project.description && <p>{project.description}</p>}
                    <div className="dashboard-project-bottom">
                      <span>{new Date(project.updatedAt).toLocaleDateString("lt-LT")}</span>
                      <span className="dashboard-project-arrow">↗</span>
                    </div>
                  </div>
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
