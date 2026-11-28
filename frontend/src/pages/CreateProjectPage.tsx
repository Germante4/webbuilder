import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getProjectDraft, saveProjectDraft } from "../services/projectDraftService";
import { getWebsiteCategories, type WebsiteCategory } from "../services/websiteCategoryService";

import "../styles/CreateProjectPage.css";
import "../styles/CreateProjectPage.css";

const WEBSITE_FORMAT = "LANDING_PAGE" as const;

const WEBSITE_TYPES = [
  {
    value: "WEBSITE",
    title: "Informacinė svetainė",
    description: "Pristatykite veiklą, paslaugas ir kontaktus.",
  },
  {
    value: "BOOKING",
    title: "Rezervacijų svetainė",
    description: "Svetainė paslaugoms pristatyti ir klientų rezervacijoms priimti.",
  },
  {
    value: "STORE",
    title: "El. parduotuvė",
    description: "Svetainė prekėms pristatyti ir užsakymams priimti.",
  },
] as const;

type WebsiteType = (typeof WEBSITE_TYPES)[number]["value"];

function matchesWebsiteType(category: string, type: WebsiteType) {
  return type === "STORE" ? category === "ECOMMERCE" : category !== "ECOMMERCE";
}

function getInitialSelection() {
  const draft = getProjectDraft();
  const saved = draft.fields?.websiteType;
  const websiteType = WEBSITE_TYPES.find(({ value }) => value === saved)?.value
    ?? (draft.websiteCategory === "ECOMMERCE" ? "STORE" : "WEBSITE");
  return {
    websiteType,
    category: draft.websiteCategory && matchesWebsiteType(draft.websiteCategory, websiteType)
      ? draft.websiteCategory
      : null,
  };
}

function CreateProjectPage() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState(getInitialSelection);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { websiteType, category } = selection;
  const allowedCategories = categories.filter(({ value }) => matchesWebsiteType(value, websiteType));
  const validCategory = allowedCategories.some(({ value }) => value === category) ? category : null;

  useEffect(() => {
    let active = true;

    getWebsiteCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Nepavyko gauti kategorijų:", err);
        setError("Nepavyko gauti svetainių kategorijų.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || error) return;

    saveProjectDraft({
      websiteCategory: validCategory ?? undefined,
      websiteFormat: WEBSITE_FORMAT,
      fields: { ...getProjectDraft().fields, websiteType },
    });
  }, [websiteType, validCategory, loading, error]);

  function selectWebsiteType(value: WebsiteType) {
    setSelection((current) => ({
      websiteType: value,
      category: current.category && matchesWebsiteType(current.category, value)
        ? current.category
        : null,
    }));
  }

  function handleContinue() {
    if (!validCategory || loading || error) return;

    saveProjectDraft({
      websiteCategory: validCategory,
      websiteFormat: WEBSITE_FORMAT,
      fields: { ...getProjectDraft().fields, websiteType },
    });

    navigate("/projects/new/details", {
      state: { websiteCategory: validCategory, websiteFormat: WEBSITE_FORMAT, websiteType },
    });
  }

  return (
    <div className="create-page">
      <header className="create-header">
        <Link to="/dashboard" className="create-back">← Mano projektai</Link>
        <Link to="/" className="create-logo">WebBuilder</Link>
        <div className="create-step">01 / Pradžia</div>
      </header>

      <main className="create-main">
        <div className="create-intro">
          <p className="create-label">NAUJAS PROJEKTAS</p>
          <h1>Kokią svetainę<br />norite sukurti?</h1>
          <p>Pasirinkite svetainės tipą ir veiklos sritį. Pagal šiuos pasirinkimus pradėsite kurti svetainės dizainą.</p>
        </div>

        <section className="create-type-section" aria-labelledby="create-type-heading">
          <h2 id="create-type-heading">01. Pasirinkite svetainės tipą</h2>
          <div className="create-type-grid" role="group" aria-labelledby="create-type-heading">
            {WEBSITE_TYPES.map(({ value, title, description }) => (
              <button
                key={value}
                type="button"
                className="create-type-card"
                aria-pressed={websiteType === value}
                onClick={() => selectWebsiteType(value)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
          {websiteType !== "WEBSITE" && (
            <p className="create-type-note">
              {websiteType === "BOOKING"
                ? "Dabar galite kurti dizainą. Rezervacijų priėmimo funkcija dar kuriama."
                : "Dabar galite kurti dizainą. Užsakymų priėmimo funkcija dar kuriama."}
            </p>
          )}
        </section>

        <section className="website-category-section">
          <h2>02. Pasirinkite veiklos sritį</h2>

          {loading && <p role="status">Kraunamos kategorijos…</p>}
          {error && <p role="alert">{error}</p>}

          {!loading && !error && (
            allowedCategories.length === 0 ? (
              <p>Šiam svetainės tipui dar nėra veiklos kategorijų.</p>
            ) : (
              <div className="category-grid">
                {allowedCategories.map((item, index) => {
                  const selected = validCategory === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`category-card ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => setSelection((current) => ({ ...current, category: item.value }))}
                    >
                      <div className="category-card-top">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div className="category-check">{selected ? "✓" : ""}</div>
                      </div>
                      <div>
                        <h2>{item.displayName}</h2>
                        <p>{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </section>

        <div className="create-footer">
          <span>Svetainės turinį ir dizainą galėsite koreguoti vėliau.</span>
          <button
            type="button"
            className="create-continue"
            disabled={!validCategory || loading || Boolean(error)}
            onClick={handleContinue}
          >
            Tęsti <span aria-hidden="true">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default CreateProjectPage;
