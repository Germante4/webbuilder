
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getProjectDraft,
  saveProjectDraft,
} from "../services/projectDraftService";

import {
  getWebsiteCategories,
  type WebsiteCategory,
} from "../services/websiteCategoryService";

import "../styles/CreateProjectPage.css";

const WEBSITE_FORMAT = "LANDING_PAGE" as const;

function CreateProjectPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<WebsiteCategory[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(() => {
      const saved = getProjectDraft().websiteCategory;

      if (!saved || saved === "ECOMMERCE") {
        return null;
      }

      return saved;
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Išsaugome pasirinktą kategoriją.
  // Svetainės formatas visada LANDING_PAGE.
  useEffect(() => {
    saveProjectDraft({
      websiteCategory: selectedCategory ?? undefined,
      websiteFormat: WEBSITE_FORMAT,
    });
  }, [selectedCategory]);

  // Gauname kategorijas iš backend.
  useEffect(() => {
    let active = true;

    getWebsiteCategories()
      .then((data) => {
        if (!active) return;

        const allowedCategories = data.filter(
          (category) => category.value !== "ECOMMERCE"
        );

        setCategories(allowedCategories);

        // Jei išsaugota kategorija nebeegzistuoja,
        // pašaliname jos pasirinkimą.
        setSelectedCategory((current) => {
          if (!current) return null;

          const exists = allowedCategories.some(
            (category) => category.value === current
          );

          return exists ? current : null;
        });
      })
      .catch((err) => {
        if (!active) return;

        console.error(
          "Nepavyko gauti kategorijų:",
          err
        );

        setError(
          "Nepavyko gauti svetainių kategorijų."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleContinue = () => {
    if (
      !selectedCategory ||
      loading ||
      Boolean(error)
    ) {
      return;
    }

    saveProjectDraft({
      websiteCategory: selectedCategory,
      websiteFormat: WEBSITE_FORMAT,
    });

    navigate("/projects/new/details", {
      state: {
        websiteCategory: selectedCategory,
        websiteFormat: WEBSITE_FORMAT,
      },
    });
  };

  return (
    <div className="create-page">
      <header className="create-header">
        <Link
          to="/dashboard"
          className="create-back"
        >
          ← Mano projektai
        </Link>

        <Link to="/" className="create-logo">
          WebBuilder
        </Link>

        <div className="create-step">
          01 / Pradžia
        </div>
      </header>

      <main className="create-main">
        <div className="create-intro">
          <p className="create-label">
            NAUJAS PROJEKTAS
          </p>

          <h1>
            Kokią svetainę
            <br />
            norite sukurti?
          </h1>

          <p>
            Pasirinkite savo veiklos sritį.
            Pagal jūsų pasirinkimą, poreikius
            ir pateiktą informaciją sukursime
            individualų vieno puslapio
            svetainės dizainą.
          </p>
        </div>

        <section className="website-category-section">
          <h2>01. Pasirinkite veiklos sritį</h2>

          {loading && (
            <p>Kraunamos kategorijos...</p>
          )}

          {error && (
            <p role="alert">{error}</p>
          )}

          {!loading && !error && (
            <div className="category-grid">
              {categories.map((category, index) => {
                const selected =
                  selectedCategory === category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    className={`category-card ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory(category.value)
                    }
                    aria-pressed={selected}
                  >
                    <div className="category-card-top">
                      <span>
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="category-check">
                        {selected ? "✓" : ""}
                      </div>
                    </div>

                    <div>
                      <h2>{category.displayName}</h2>
                      <p>{category.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="create-footer">
          <span>
            Svetainės turinį ir dizainą
            galėsite koreguoti vėliau.
          </span>

          <button
            type="button"
            className="create-continue"
            disabled={
              !selectedCategory ||
              loading ||
              Boolean(error)
            }
            onClick={handleContinue}
          >
            Tęsti
            <span>→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default CreateProjectPage;
