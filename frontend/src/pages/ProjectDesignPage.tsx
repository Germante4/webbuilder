import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/ProjectDesignPage.css";
import { getProjectDraft, saveProjectDraft } from "../services/projectDraftService";
import { loadDesignFiles, saveDesignFiles } from "../services/designFileDraftService";
import {
  uploadProjectAssets,
} from "../services/projectAssetService";
import {
  generateDesignSummary,
} from "../services/designSummaryService";
import {
  generateDesignDirections,
} from "../services/designDirectionService";

const STYLE_OPTIONS = [
  "Moderni",
  "Prabangi",
  "Minimalistinė",
  "Šilta ir jauki",
  "Natūrali",
  "Elegantiška",
  "Drąsi",
  "Žaisminga",
  "Profesionali",
];

const COLOR_OPTIONS = [
  {
    id: "neutral",
    title: "Šviesios ir neutralios",
    description: "Švelni, švari ir universali kryptis",
    colors: ["#F5F0E8", "#DDD3C5", "#A99E91", "#504A45"],
  },
  {
    id: "dark",
    title: "Tamsios ir elegantiškos",
    description: "Ryškesnis, prabangesnis įvaizdis",
    colors: ["#171717", "#393735", "#B6AA9A", "#F3EEE7"],
  },
  {
    id: "natural",
    title: "Šiltos ir natūralios",
    description: "Žemiška ir organiška spalvų kryptis",
    colors: ["#E8DDCA", "#BCA98C", "#7C8063", "#4F493F"],
  },
  {
    id: "pastel",
    title: "Švelnios ir pastelinės",
    description: "Lengva, subtili ir švelni nuotaika",
    colors: ["#F0D9D7", "#E8E2D5", "#BBC5AE", "#8C7C78"],
  },
  {
    id: "bold",
    title: "Ryškesnės",
    description: "Daugiau charakterio ir kontrasto",
    colors: ["#7C3045", "#D38266", "#E9C46A", "#274C4A"],
  },
];

type DesignDraft = {
  selectedStyles: string[];
  selectedColor: string;
  websiteLanguage: string;
  referenceUrl: string;
  referenceLikes: string;
};

function getSavedDesign(): Partial<DesignDraft> {
  const value = getProjectDraft().fields?.design;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Partial<DesignDraft>;
}

function ProjectDesignPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const draft = getProjectDraft();
  const websiteCategory = location.state?.websiteCategory ?? draft.websiteCategory;
  const websiteFormat = location.state?.websiteFormat ?? draft.websiteFormat;
  const projectSummary = location.state?.projectSummary;

  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    () => getSavedDesign().selectedStyles ?? []
  );
  const [selectedColor, setSelectedColor] = useState(
    () => getSavedDesign().selectedColor ?? ""
  );
  const [websiteLanguage, setWebsiteLanguage] = useState(
  () => getSavedDesign().websiteLanguage ?? "lt"
);

  const [referenceUrl, setReferenceUrl] = useState(
    () => getSavedDesign().referenceUrl ?? ""
  );
  const [referenceLikes, setReferenceLikes] = useState(
    () => getSavedDesign().referenceLikes ?? ""
  );

  const [textFiles, setTextFiles] = useState<File[]>([]);
  const [filesReady, setFilesReady] = useState(false);
  const [fileSaveError, setFileSaveError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    saveProjectDraft({
      fields: {
        ...getProjectDraft().fields,
        design: {
          selectedStyles,
          selectedColor,
          websiteLanguage,
          referenceUrl,
          referenceLikes,
        } satisfies DesignDraft,
      },
    });
  }, [
  selectedStyles,
  selectedColor,
  websiteLanguage,
  referenceUrl,
  referenceLikes,
]);

  useEffect(() => {
    let active = true;
    loadDesignFiles()
      .then((files) => {
        if (!active) return;
        setTextFiles(files.textFiles);
      })
      .catch((error) => {
        console.error("Nepavyko atkurti failų:", error);
        if (active) setFileSaveError("Nepavyko atkurti anksčiau įkeltų failų.");
      })
      .finally(() => {
        if (active) setFilesReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!filesReady) return;
    saveDesignFiles({ logoFile: null, photoFiles: [], textFiles, brandFile: null })
      .then(() => setFileSaveError(""))
      .catch((error) => {
        console.error("Nepavyko išsaugoti failų:", error);
        setFileSaveError("Failai neišsaugoti naršyklėje. Prieš tęsdami patikrinkite saugyklos vietą.");
      });
  }, [filesReady, textFiles]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((current) => {
      if (current.includes(style)) {
        return current.filter((item) => item !== style);
      }

      /*
       * Leidžiame pasirinkti daugiausia 3 kryptis.
       */
      if (current.length >= 3) {
        return current;
      }

      return [...current, style];
    });
  };

const handleContinue = async () => {
  if (!canContinue || isUploading || !filesReady || Boolean(fileSaveError)) {
    return;
  }

  setIsUploading(true);
  setUploadError("");

  try {
    if (!projectSummary) {
      setUploadError("Trūksta projekto santraukos. Grįžkite į ankstesnį etapą.");
      setIsUploading(false);
      return;
    }

    // 1. Įkeliame vartotojo failus
    const uploadedAssets = await uploadProjectAssets({
      logoFile: null,
      photoFiles: [],
      brandFile: null,
      textFiles,
    });

    console.log(
      "ĮKELTI PROJEKTO FAILAI:",
      uploadedAssets
    );

    // 2. Patikriname, ar turime ProjectSummary
    if (!projectSummary) {
      throw new Error(
        "Trūksta projekto santraukos"
      );
    }

    // 3. Surenkame dizaino atsakymus
const designAnswers = {
  websiteLanguage,
  styles: selectedStyles,
  colorDirection: selectedColor,
  assets: textFiles.length > 0 ? ["Paruoštus tekstus"] : [],
  hasNoAssets: textFiles.length === 0,
  brandColors: null,
  fonts: null,
  referenceUrl: referenceUrl.trim() || null,
  referenceLikes: referenceLikes.trim() || null,
  uploadedAssets,
};

    console.log(
      "PROJECT SUMMARY:",
      projectSummary
    );

    console.log(
      "DESIGN ANSWERS:",
      designAnswers
    );

    // 4. Generuojame AI DesignSummary
    const designSummary =
      await generateDesignSummary({
        projectSummary,
        ...designAnswers,
      });

    console.log(
      "AI DESIGN SUMMARY:",
      designSummary
    );
    const designDirections =
  await generateDesignDirections({
    projectSummary,
    designSummary,
  });

console.log(
  "AI DESIGN DIRECTIONS:",
  designDirections
);

    // 5. Perduodame visą informaciją kitam etapui
navigate("/projects/new/directions", {
  state: {
    websiteCategory,
    websiteFormat,
    websiteLanguage,
    projectSummary,
    designSummary,
    designDirections: designDirections.directions,
    uploadedAssets,
  },
});
  } catch (error) {
    console.error(
      "Nepavyko paruošti projekto:",
      error
    );

    setUploadError(
      "Nepavyko paruošti pirmojo varianto. Bandykite dar kartą."
    );
  } finally {
    setIsUploading(false);
  }
};


  const canContinue =
    selectedStyles.length > 0 &&
    selectedColor !== "";

  return (
    <div className="design-page">
      <header className="design-header">
        <Link
          to="/projects/new/value"
          state={{
            websiteCategory,
            websiteFormat,
            projectSummary,
          }}
          className="design-back"
        >
          ← Grįžti
        </Link>

        <div className="design-logo">WebBuilder</div>

        <div className="design-step">
          03 / Vizualinė kryptis
        </div>
      </header>

      <main className="design-main">
        <section className="design-intro">
          <div className="design-eyebrow">
            VIZUALINĖ KRYPTIS
          </div>

          <h1>
            Kaip turėtų atrodytu jūsų svetainė?
          </h1>

          <p className="design-description">
            Pasirinkite kryptis, kurios geriausiai atspindi jūsų
            norimą įvaizdį. Pagal jas paruošime pirmą vizualinį
            svetainės variantą.
          </p>

          <div className="design-next-info">
            <span className="design-next-icon">✦</span>

            <div>
              <strong>Kas bus toliau?</strong>
              <p>
                Šiuos pasirinkimus sujungsime su ankstesne projekto
                informacija ir sukursime pirmą dizaino kryptį.
              </p>
            </div>
          </div>
        </section>

        <section className="design-form-section">
          <div className="design-form-heading">
            <span>DIZAINO KLAUSIMAI</span>
            <span>07 — 10</span>
          </div>

          {/* QUESTION 07 */}
          <article className="design-question">
            <div className="design-question-header">
              <span className="design-question-number">07</span>

              <div>
                <h2>
                  Kokį įspūdį turėtų kurti jūsų svetainė?
                </h2>

                <p>
                  Pasirinkite iki 3 labiausiai tinkančių variantų.
                </p>
              </div>
            </div>

            <div className="design-content-offset">
              <div className="style-options">
                {STYLE_OPTIONS.map((style) => {
                  const selected = selectedStyles.includes(style);

                  return (
                    <button
                      key={style}
                      type="button"
                      className={`style-option ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => toggleStyle(style)}
                    >
                      <span>{style}</span>

                      <span className="style-check">
                        {selected ? "✓" : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="design-selection-info">
                Pasirinkta {selectedStyles.length} / 3
              </div>
            </div>
          </article>

          {/* QUESTION 08 */}
          <article className="design-question">
            <div className="design-question-header">
              <span className="design-question-number">08</span>

              <div>
                <h2>
                  Kokios spalvos jums artimiausios?
                </h2>

                <p>
                  Pasirinkite bendrą spalvinę kryptį. Tikslius
                  atspalvius galėsime pritaikyti vėliau.
                </p>
              </div>
            </div>

            <div className="design-content-offset">
              <div className="color-options">
                {COLOR_OPTIONS.map((option) => {
                  const selected = selectedColor === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`color-option ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedColor(option.id)}
                    >
                      <div className="color-option-top">
                        <div>
                          <strong>{option.title}</strong>
                          <span>{option.description}</span>
                        </div>

                        <span className="color-radio">
                          {selected ? "●" : ""}
                        </span>
                      </div>

                      <div className="color-palette">
                        {option.colors.map((color) => (
                          <span
                            key={color}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          {/* QUESTION 09: optional website copy */}
          <article className="design-question">
            <div className="design-question-header">
              <span className="design-question-number">09</span>
              <div>
                <h2>Ar jau turite paruoštą tekstą savo svetainei?</h2>
                <p>
                  Jei turite tekstą, kurį norite panaudoti svetainėje,
                  įkelkite jį. Jei neturite, tekstą sukursime pagal jūsų atsakymus.
                  Šis klausimas neprivalomas.
                </p>
              </div>
            </div>

            <div className="design-content-offset">
              <div className="asset-upload-section">
                <div className="asset-upload-item">
                  <div className="asset-upload-header">
                    <div>
                      <strong>Paruošti tekstai</strong>
                      <span>PDF, DOCX arba TXT</span>
                    </div>
                    {textFiles.length > 0 && (
                      <span className="upload-success">✓ {textFiles.length} įkelta</span>
                    )}
                  </div>

                  <label className="file-upload-box">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      multiple
                      onChange={(event) => {
                        setTextFiles(Array.from(event.target.files ?? []));
                      }}
                    />
                    <span className="file-upload-plus">+</span>
                    <div>
                      <strong>
                        {textFiles.length > 0
                          ? `${textFiles.length} failai pasirinkti`
                          : "Pasirinkti tekstų failus"}
                      </strong>
                      <span>Jeigu neturite teksto, šį žingsnį praleiskite.</span>
                    </div>
                  </label>

                  {textFiles.length > 0 && (
                    <div className="uploaded-file-list">
                      {textFiles.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`} className="uploaded-file">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            aria-label={`Pašalinti ${file.name}`}
                            onClick={() =>
                              setTextFiles((current) =>
                                current.filter((_, currentIndex) => currentIndex !== index)
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>


          <div className="reference-block">
            <label htmlFor="referenceUrl">
              Turite svetainę, kurios stilius jums patinka?
              <span> Neprivaloma</span>
            </label>
            <input
              id="referenceUrl"
              type="url"
              value={referenceUrl}
              onChange={(event) => setReferenceUrl(event.target.value)}
              placeholder="https://..."
            />
            <p>Galite įklijuoti vieną pavyzdį. Jei neturite — nieko tokio.</p>
            {referenceUrl.trim() !== "" && (
              <div className="reference-details">
                <label htmlFor="referenceLikes">
                  Kas jums patinka šioje svetainėje?
                </label>
                <textarea
                  id="referenceLikes"
                  rows={4}
                  value={referenceLikes}
                  onChange={(event) => setReferenceLikes(event.target.value)}
                  placeholder="Pvz. patinka didelės nuotraukos, daug tuščios erdvės, minimalistinis meniu ir bendras svetainės paprastumas."
                />
                <p>Parašykite savais žodžiais, ką norėtumėte pritaikyti savo svetainei.</p>
              </div>
            )}
          </div>

          <article className="design-question">
  <div className="design-question-header">
    <span className="design-question-number">10</span>

    <div>
      <h2>Kokia kalba turėtų būti jūsų svetainė?</h2>
      <p>Pasirinkite pagrindinę svetainės kalbą.</p>
    </div>
  </div>

  <div className="design-content-offset">
    <div className="style-options">
      {[
        { value: "lt", label: "Lietuvių" },
        { value: "en", label: "Anglų" },
      ].map((language) => (
        <button
          key={language.value}
          type="button"
          className={`style-option ${
            websiteLanguage === language.value ? "selected" : ""
          }`}
          onClick={() => setWebsiteLanguage(language.value)}
        >
          <span>{language.label}</span>
          <span className="style-check">
            {websiteLanguage === language.value ? "✓" : "+"}
          </span>
        </button>
      ))}
    </div>
  </div>
</article>

          <div className="design-footer">
            <div className="design-footer-text">
              <strong>Viskas gali būti pakeista.</strong>

              <span>
                Tai tik pirmoji vizualinė kryptis. Pamatę rezultatą
                galėsite tikslinti spalvas, stilių ir išdėstymą.
              </span>
            </div>
            {fileSaveError && <p className="design-error">{fileSaveError}</p>}
            {uploadError && (
  <p className="design-error">
    {uploadError}
  </p>
)}
            <button
  type="button"
  className="design-continue"
  onClick={handleContinue}
  disabled={!canContinue || isUploading || !filesReady || Boolean(fileSaveError)}
>
  {isUploading
    ? "Įkeliama..."
    : "Parodyti dizaino kryptis"}

  <span>→</span>
</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProjectDesignPage;