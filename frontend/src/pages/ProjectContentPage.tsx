import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getProjectDraft,
  saveProjectDraft,
} from "../services/projectDraftService";

import type { ProjectSummary } from "../services/requirementService";

import "../styles/ProjectContentPage.css";

interface ContentField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "time" | "date";
}

interface ContentCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  itemName: string;
  fields: ContentField[];
}

type ContentItem = Record<string, string>;

interface ContentDraft {
  category: string;
  selected: string[];
  sections: Record<string, ContentItem[]>;
  priorities: string[];
  emphasis: string;
}

const CATEGORIES: ContentCategory[] = [
  {
    id: "services",
    icon: "✧",
    title: "Paslaugos",
    description: "Jūsų siūlomos paslaugos ir jų aprašymai.",
    itemName: "paslaugą",
    fields: [
      {
        key: "name",
        label: "Paslaugos pavadinimas",
        placeholder: "Pvz., Individuali konsultacija",
      },
      {
        key: "description",
        label: "Aprašymas",
        type: "textarea",
        placeholder: "Trumpai aprašykite paslaugą",
      },
      {
        key: "price",
        label: "Kaina (neprivaloma)",
        placeholder: "Pvz., nuo 50 €",
      },
      {
        key: "duration",
        label: "Trukmė (neprivaloma)",
        placeholder: "Pvz., 60 min.",
      },
    ],
  },
  {
    id: "workingHours",
    icon: "◷",
    title: "Darbo laikas",
    description: "Darbo dienos ir darbo valandos.",
    itemName: "darbo laiką",
    fields: [
      {
        key: "days",
        label: "Darbo dienos",
        placeholder: "Pvz., Pirmadienis–penktadienis",
      },
      {
        key: "from",
        label: "Nuo",
        type: "time",
      },
      {
        key: "to",
        label: "Iki",
        type: "time",
      },
      {
        key: "notes",
        label: "Papildoma informacija",
        placeholder: "Pvz., Tik pagal išankstinę registraciją",
      },
    ],
  },
  {
    id: "schedule",
    icon: "▦",
    title: "Užsiėmimų tvarkaraštis",
    description: "Reguliarūs užsiėmimai, dienos ir laikai.",
    itemName: "užsiėmimą",
    fields: [
      {
        key: "name",
        label: "Užsiėmimo pavadinimas",
        placeholder: "Pvz., Rytinė joga",
      },
      {
        key: "day",
        label: "Savaitės diena",
        placeholder: "Pvz., Antradienis",
      },
      {
        key: "time",
        label: "Pradžios laikas",
        type: "time",
      },
      {
        key: "duration",
        label: "Trukmė",
        placeholder: "Pvz., 50 min.",
      },
      {
        key: "price",
        label: "Kaina (neprivaloma)",
        placeholder: "Pvz., 15 €",
      },
    ],
  },
  {
    id: "pricing",
    icon: "€",
    title: "Kainos ir paketai",
    description: "Paketai, abonementai ir kainoraščiai.",
    itemName: "paketą",
    fields: [
      {
        key: "name",
        label: "Paketo pavadinimas",
        placeholder: "Pvz., Mėnesio abonementas",
      },
      {
        key: "price",
        label: "Kaina",
        placeholder: "Pvz., 80 € / mėn.",
      },
      {
        key: "includes",
        label: "Kas įskaičiuota?",
        type: "textarea",
      },
    ],
  },
  {
    id: "events",
    icon: "☆",
    title: "Renginiai ir dirbtuvės",
    description: "Artėjantys renginiai ir specialūs užsiėmimai.",
    itemName: "renginį",
    fields: [
      {
        key: "name",
        label: "Renginio pavadinimas",
      },
      {
        key: "date",
        label: "Data",
        type: "date",
      },
      {
        key: "time",
        label: "Laikas",
        type: "time",
      },
      {
        key: "location",
        label: "Vieta",
      },
      {
        key: "description",
        label: "Renginio aprašymas",
        type: "textarea",
      },
      {
        key: "price",
        label: "Kaina (neprivaloma)",
      },
      {
        key: "registration",
        label: "Registracijos nuoroda (neprivaloma)",
      },
    ],
  },
  {
    id: "team",
    icon: "♧",
    title: "Komanda",
    description: "Komandos nariai ir jų pristatymai.",
    itemName: "komandos narį",
    fields: [
      {
        key: "name",
        label: "Vardas ir pavardė",
      },
      {
        key: "role",
        label: "Pareigos",
      },
      {
        key: "description",
        label: "Trumpas pristatymas",
        type: "textarea",
      },
    ],
  },
  {
    id: "portfolio",
    icon: "▧",
    title: "Darbų galerija",
    description: "Atlikti darbai, projektai ir jų pristatymai.",
    itemName: "projektą",
    fields: [
      {
        key: "name",
        label: "Projekto pavadinimas",
      },
      {
        key: "description",
        label: "Projekto aprašymas",
        type: "textarea",
      },
      {
        key: "link",
        label: "Projekto nuoroda (neprivaloma)",
      },
    ],
  },
  {
    id: "testimonials",
    icon: "❞",
    title: "Klientų atsiliepimai",
    description: "Klientų patirtys ir rekomendacijos.",
    itemName: "atsiliepimą",
    fields: [
      {
        key: "author",
        label: "Kliento vardas",
      },
      {
        key: "review",
        label: "Atsiliepimas",
        type: "textarea",
      },
    ],
  },
  {
    id: "faq",
    icon: "?",
    title: "Dažniausi klausimai",
    description: "Atsakymai į klientams kylančius klausimus.",
    itemName: "klausimą",
    fields: [
      {
        key: "question",
        label: "Klausimas",
      },
      {
        key: "answer",
        label: "Atsakymas",
        type: "textarea",
      },
    ],
  },
  {
    id: "booking",
    icon: "↗",
    title: "Registracija ir užsakymas",
    description: "Kaip klientai gali užsiregistruoti ar užsisakyti.",
    itemName: "registracijos būdą",
    fields: [
      {
        key: "name",
        label: "Registracijos būdas",
        placeholder: "Pvz., Registracija internetu",
      },
      {
        key: "url",
        label: "Registracijos nuoroda",
      },
      {
        key: "instructions",
        label: "Papildomos instrukcijos",
        type: "textarea",
      },
    ],
  },
  {
    id: "other",
    icon: "+",
    title: "Kita informacija",
    description: "Papildomas turinys, svarbus jūsų veiklai.",
    itemName: "informaciją",
    fields: [
      {
        key: "title",
        label: "Informacijos pavadinimas",
      },
      {
        key: "content",
        label: "Informacija",
        type: "textarea",
      },
    ],
  },
];

const PRIORITIES = [
  "Kokybė ir profesionalumas",
  "Patirtis ir kompetencija",
  "Individualus požiūris",
  "Prieinamos kainos",
  "Kūrybiškumas ir unikalumas",
  "Patogumas ir greitis",
  "Pasitikėjimas ir patikimumas",
  "Bendruomenė ir ryšys",
];

function createEmptyItem(
  category: ContentCategory
): ContentItem {
  return Object.fromEntries(
    category.fields.map((field) => [field.key, ""])
  );
}

function ProjectContentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = getProjectDraft();

  const routeState = location.state as {
    websiteCategory?: string;
    websiteFormat?: string;
    projectSummary?: ProjectSummary;
  } | null;

  const websiteCategory =
    routeState?.websiteCategory ??
    draft.websiteCategory ??
    "";

  const websiteFormat =
    routeState?.websiteFormat ??
    draft.websiteFormat;

  const savedValue = draft.fields?.projectValue as
    | { projectSummary?: ProjectSummary }
    | undefined;

  const projectSummary =
    routeState?.projectSummary ??
    savedValue?.projectSummary;

  const savedContent = draft.fields?.projectContent as
    | ContentDraft
    | undefined;

  const validSavedContent =
    savedContent?.category === websiteCategory
      ? savedContent
      : undefined;

  const [selected, setSelected] = useState<string[]>(
    validSavedContent?.selected ?? []
  );

  const [sections, setSections] = useState<
    Record<string, ContentItem[]>
  >(validSavedContent?.sections ?? {});

  const [priorities, setPriorities] = useState<string[]>(
    validSavedContent?.priorities ?? []
  );

  const [emphasis, setEmphasis] = useState(
    validSavedContent?.emphasis ?? ""
  );

  useEffect(() => {
    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectContent: {
          category: websiteCategory,
          selected,
          sections,
          priorities,
          emphasis,
        } satisfies ContentDraft,
      },
    });
  }, [
    websiteCategory,
    websiteFormat,
    selected,
    sections,
    priorities,
    emphasis,
  ]);

  const toggleCategory = (category: ContentCategory) => {
    if (selected.includes(category.id)) {
      setSelected((previous) =>
        previous.filter((id) => id !== category.id)
      );
      return;
    }

    setSelected((previous) => [...previous, category.id]);

    setSections((previous) => ({
      ...previous,
      [category.id]: previous[category.id]?.length
        ? previous[category.id]
        : [createEmptyItem(category)],
    }));
  };

  const addItem = (category: ContentCategory) => {
    setSections((previous) => ({
      ...previous,
      [category.id]: [
        ...(previous[category.id] ?? []),
        createEmptyItem(category),
      ],
    }));
  };

  const removeItem = (
    categoryId: string,
    index: number
  ) => {
    setSections((previous) => ({
      ...previous,
      [categoryId]: (previous[categoryId] ?? []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const updateItem = (
    categoryId: string,
    index: number,
    field: string,
    value: string
  ) => {
    setSections((previous) => ({
      ...previous,
      [categoryId]: (previous[categoryId] ?? []).map(
        (item, itemIndex) =>
          itemIndex === index
            ? { ...item, [field]: value }
            : item
      ),
    }));
  };

  const togglePriority = (priority: string) => {
    setPriorities((previous) => {
      if (previous.includes(priority)) {
        return previous.filter(
          (item) => item !== priority
        );
      }

      if (previous.length >= 3) return previous;

      return [...previous, priority];
    });
  };

  const handleContinue = () => {
    const activeSections = Object.fromEntries(
      selected.map((id) => [
        id,
        (sections[id] ?? [])
          .map((item) =>
            Object.fromEntries(
              Object.entries(item).map(([key, value]) => [
                key,
                value.trim(),
              ])
            )
          )
          .filter((item) =>
            Object.values(item).some(Boolean)
          ),
      ])
    );

    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectContent: {
          category: websiteCategory,
          selected,
          sections,
          priorities,
          emphasis,
        } satisfies ContentDraft,
        websiteContent: {
          sections: activeSections,
          priorities,
          emphasis: emphasis.trim(),
        },
      },
    });

    navigate("/projects/new/contact", {
      state: {
        websiteCategory,
        websiteFormat,
        projectSummary,
      },
    });
  };

  return (
    <div className="content-page">
      <header className="content-header">
        <Link
          to="/projects/new/value"
          className="content-back"
          state={{
            websiteCategory,
            websiteFormat,
            projectSummary,
          }}
        >
          ← Atgal
        </Link>

        <Link to="/" className="content-logo">
          WebBuilder
        </Link>

        <span className="content-step">
          04 / Svetainės turinys
        </span>
      </header>

      <main className="content-main">
        <section className="content-intro">
          <p className="content-eyebrow">
            04 / SUKURKIME SVETAINĖS TURINĮ
          </p>

          <h1>
            Ką norėtumėte parodyti
            <br />
            savo svetainėje?
          </h1>

          <p className="content-description">
            Pasirinkite informaciją, kurią norėtumėte
            pateikti savo svetainės lankytojams.
            Kiekvienas verslas yra skirtingas, todėl
            turinį galite pritaikyti pagal savo poreikius.
          </p>

          <div className="content-info">
            <span className="content-info-icon">✦</span>

            <div>
              <strong>Jūs sprendžiate, kas svarbu.</strong>

              <p>
                Pasirinkite tik jūsų veiklai aktualias
                kategorijas. Šis etapas nėra privalomas.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="content-section-heading">
            <span>01 / TURINIO KATEGORIJOS</span>
            <span>Pasirinkta: {selected.length}</span>
          </div>

          <div className="content-category-grid">
            {CATEGORIES.map((category) => {
              const isSelected = selected.includes(
                category.id
              );

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isSelected}
                  className={`content-category-card ${
                    isSelected ? "is-selected" : ""
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  <div className="content-card-top">
                    <span className="content-card-icon">
                      {category.icon}
                    </span>

                    <span className="content-card-check">
                      {isSelected ? "✓" : ""}
                    </span>
                  </div>

                  <strong>{category.title}</strong>

                  <p>{category.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {selected.length > 0 && (
          <section className="content-section">
            <div className="content-section-heading">
              <span>02 / PATEIKITE INFORMACIJĄ</span>
            </div>

            <div className="content-dynamic-sections">
              {CATEGORIES.filter((category) =>
                selected.includes(category.id)
              ).map((category) => (
                <div
                  className="content-dynamic-section"
                  key={category.id}
                >
                  <div className="content-dynamic-heading">
                    <span>{category.icon}</span>
                    <h2>{category.title}</h2>
                  </div>

                  {(sections[category.id] ?? []).map(
                    (item, index) => (
                      <div
                        className="content-item"
                        key={index}
                      >
                        <div className="content-item-heading">
                          <span>
                            ĮRAŠAS{" "}
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <button
                            type="button"
                            className="content-remove"
                            onClick={() =>
                              removeItem(category.id, index)
                            }
                          >
                            Pašalinti ×
                          </button>
                        </div>

                        <div className="content-fields">
                          {category.fields.map((field) => (
                            <div
                              className={`content-field ${
                                field.type === "textarea"
                                  ? "content-field-full"
                                  : ""
                              }`}
                              key={field.key}
                            >
                              <label
                                htmlFor={`${category.id}-${index}-${field.key}`}
                              >
                                {field.label}
                              </label>

                              {field.type === "textarea" ? (
                                <textarea
                                  id={`${category.id}-${index}-${field.key}`}
                                  rows={4}
                                  value={item[field.key] ?? ""}
                                  placeholder={field.placeholder}
                                  onChange={(event) =>
                                    updateItem(
                                      category.id,
                                      index,
                                      field.key,
                                      event.target.value
                                    )
                                  }
                                />
                              ) : (
                                <input
                                  id={`${category.id}-${index}-${field.key}`}
                                  type={field.type ?? "text"}
                                  value={item[field.key] ?? ""}
                                  placeholder={field.placeholder}
                                  onChange={(event) =>
                                    updateItem(
                                      category.id,
                                      index,
                                      field.key,
                                      event.target.value
                                    )
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="content-add"
                    onClick={() => addItem(category)}
                  >
                    + Pridėti {category.itemName}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="content-section">
          <div className="content-section-heading">
            <span>02 / PAGRINDINIAI AKCENTAI</span>
            <span>{priorities.length} / 3</span>
          </div>

          <h2 className="content-question">
            Ką svarbiausia akcentuoti svetainėje?
          </h2>

          <p className="content-question-description">
            Pasirinkite iki trijų savybių, kurias
            norėtumėte labiausiai išryškinti.
          </p>

          <div className="content-priorities">
            {PRIORITIES.map((priority) => (
              <button
                type="button"
                key={priority}
                aria-pressed={priorities.includes(priority)}
                disabled={
                  priorities.length >= 3 &&
                  !priorities.includes(priority)
                }
                className={`content-priority ${
                  priorities.includes(priority)
                    ? "is-selected"
                    : ""
                }`}
                onClick={() => togglePriority(priority)}
              >
                <span>
                  {priorities.includes(priority) ? "✓" : "+"}
                </span>

                {priority}
              </button>
            ))}
          </div>

          <div className="content-field content-emphasis">
            <label htmlFor="content-emphasis">
              Ką dar svarbu išryškinti? (neprivaloma)
            </label>

            <textarea
              id="content-emphasis"
              rows={4}
              value={emphasis}
              placeholder="Pvz., norėčiau, kad svetainėje daugiausia dėmesio būtų skiriama individualioms konsultacijoms ir jų naudai klientui."
              onChange={(event) =>
                setEmphasis(event.target.value)
              }
            />
          </div>
        </section>

        <div className="content-footer">
          <div className="content-footer-text">
            <strong>Ne viskas turi būti jūsų svetainėje.</strong>

            <span>
              Pasirinkite tik tai, kas suteikia vertės
              jūsų lankytojams.
            </span>
          </div>

          <button
            type="button"
            className="content-continue"
            onClick={handleContinue}
          >
            Tęsti <span>→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProjectContentPage;