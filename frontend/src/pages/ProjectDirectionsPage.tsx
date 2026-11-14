
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import type { ProjectSummary } from "../services/requirementService";
import type { DesignSummary } from "../services/designSummaryService";
import type { DesignDirection } from "../services/designDirectionService";
import type { ProjectAssetUploadResponse } from "../services/projectAssetService";

import {
  getProjectDraft,
  saveProjectDraft,
} from "../services/projectDraftService";

import "../styles/ProjectDirectionsPage.css";

interface LocationState {
  websiteCategory?: string;
  websiteFormat?: string;
  websiteLanguage?: string;
  projectSummary?: ProjectSummary;
  designSummary?: DesignSummary;
  designDirections?: DesignDirection[];
  uploadedAssets?: ProjectAssetUploadResponse;
}

interface DirectionsDraft {
  selectedId?: string | null;
  websiteLanguage?: string;
  designDirections?: DesignDirection[];
  projectSummary?: ProjectSummary;
  designSummary?: DesignSummary;
  uploadedAssets?: ProjectAssetUploadResponse;
}

function ProjectDirectionsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const routeState =
    (location.state as LocationState | null) ?? null;

  const draft = getProjectDraft();

  const savedDirections =
    draft.fields?.projectDirections as
      | DirectionsDraft
      | undefined;

  const websiteCategory =
    routeState?.websiteCategory ??
    draft.websiteCategory;

  const websiteFormat =
    routeState?.websiteFormat ??
    draft.websiteFormat;

  const websiteLanguage =
  routeState?.websiteLanguage ??
  savedDirections?.websiteLanguage ??
  (draft.fields?.design as { websiteLanguage?: string } | undefined)
    ?.websiteLanguage ??
  "lt";

  const projectSummary =
    routeState?.projectSummary ??
    savedDirections?.projectSummary;

  const designSummary =
    routeState?.designSummary ??
    savedDirections?.designSummary;

  const uploadedAssets =
    routeState?.uploadedAssets ??
    savedDirections?.uploadedAssets;

  const directions =
    routeState?.designDirections ??
    savedDirections?.designDirections ??
    [];

  const [selectedId, setSelectedId] =
    useState<string | null>(() => {
      const savedId =
        savedDirections?.selectedId ?? null;

      return directions.some(
        (direction) => direction.id === savedId
      )
        ? savedId
        : null;
    });

  useEffect(() => {
    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectDirections: {
  selectedId,
  websiteLanguage,
  designDirections: directions,
  projectSummary,
  designSummary,
  uploadedAssets,
} satisfies DirectionsDraft,
      },
    });
  }, [
    selectedId,
    websiteCategory,
    websiteFormat,
    directions,
    projectSummary,
    designSummary,
    uploadedAssets,
  ]);

  const selectedDirection =
    directions.find(
      (direction) => direction.id === selectedId
    ) ?? null;

  const handleContinue = () => {
    if (!selectedDirection) return;

    if (!projectSummary || !designSummary) {
      console.error(
        "Trūksta projekto arba dizaino duomenų"
      );
      return;
    }

    navigate("/projects/new/preview", {
  state: {
    websiteCategory,
    websiteFormat,
    websiteLanguage,
    projectSummary,
    designSummary,
    selectedDirection,
    uploadedAssets,
  },
});
  };

  const backState = {
  websiteCategory,
  websiteFormat,
  websiteLanguage,
  projectSummary,
};

  if (directions.length === 0) {
    return (
      <div className="directions-page">
        <header className="directions-header">
          <Link
            to="/projects/new/design"
            state={backState}
            className="directions-back"
          >
            ← Atgal
          </Link>

          <Link to="/" className="directions-logo">
            WebBuilder
          </Link>
        </header>

        <main className="directions-empty">
          <h1>Nepavyko rasti dizaino krypčių.</h1>

          <p>
            Grįžkite į dizaino etapą ir sugeneruokite
            kryptis dar kartą.
          </p>

          <Link
            to="/projects/new/design"
            state={backState}
            className="directions-empty-button"
          >
            Grįžti
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="directions-page">
      <header className="directions-header">
        <Link
          to="/projects/new/design"
          state={backState}
          className="directions-back"
        >
          ← Atgal
        </Link>

        <Link to="/" className="directions-logo">
          WebBuilder
        </Link>

        <span className="directions-step">
  06 / Kryptis
</span>
      </header>

      <main className="directions-main">
        <section className="directions-intro">
          <p className="directions-eyebrow">
            06 / PASIRINKITE KRYPTĮ
          </p>

          <h1>
            Kuri kryptis labiausiai
            <br />
            primena jūsų svetainę?
          </h1>

          <p className="directions-description">
            Pagal jūsų atsakymus paruošėme tris
            skirtingas vizualines kryptis.
            Pasirinkite tą, kuri labiausiai
            atitinka jūsų norimą įspūdį.
          </p>

          <div className="directions-info">
            <span>✦</span>

            <p>
              Tai dar nėra galutinis dizainas.
              Pasirinkta kryptis bus naudojama
              kuriant pirmąjį svetainės variantą.
            </p>
          </div>
        </section>

        <section className="directions-section">
          <div className="directions-section-heading">
            <span>VIZUALINĖS KRYPTYS</span>
            <span>{directions.length} variantai</span>
          </div>

          <div className="directions-grid">
            {directions.map((direction, index) => {
              const isSelected =
                selectedId === direction.id;

              return (
                <button
                  type="button"
                  key={direction.id}
                  className={`direction-card ${
                    isSelected
                      ? "direction-card-selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedId(direction.id)
                  }
                  aria-pressed={isSelected}
                >
                  <div className="direction-card-top">
                    <span className="direction-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={`direction-radio ${
                        isSelected
                          ? "direction-radio-selected"
                          : ""
                      }`}
                    >
                      {isSelected && <span />}
                    </span>
                  </div>

                  <div className="direction-card-title">
                    <h2>{direction.name}</h2>
                    <p>{direction.tagline}</p>
                  </div>

                  <p className="direction-description">
                    {direction.description}
                  </p>

                  <div className="direction-details">
                    <div>
                      <span>IŠDĖSTYMAS</span>
                      <p>{direction.layoutDirection}</p>
                    </div>

                    <div>
                      <span>FOTOGRAFIJOS</span>
                      <p>{direction.imageDirection}</p>
                    </div>

                    <div>
                      <span>TIPOGRAFIJA</span>
                      <p>
                        {direction.typographyDirection}
                      </p>
                    </div>

                    <div>
                      <span>SPALVOS</span>
                      <p>{direction.colorDirection}</p>
                    </div>
                  </div>

                  <div className="direction-mood">
                    <span>NUOTAIKA</span>
                    <strong>{direction.mood}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="directions-footer">
            <div>
              <strong>
                Vėliau galėsite viską koreguoti.
              </strong>

              <p>
                Šiuo metu renkamės tik bendrą
                vizualinę svetainės kryptį.
              </p>
            </div>

            <button
              type="button"
              className="directions-continue"
              disabled={!selectedDirection}
              onClick={handleContinue}
            >
              Kurti pagal šią kryptį
              <span>→</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProjectDirectionsPage;
