
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import type { ProjectSummary } from "../services/requirementService";

import {
  getProjectDraft,
  saveProjectDraft,
} from "../services/projectDraftService";

import "../styles/projectContactPage.css";

interface AdditionalContact {
  label: string;
  value: string;
}

interface ProjectContact {
  email: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  additionalContacts: AdditionalContact[];
}

type ContactField =
  | "email"
  | "phone"
  | "address"
  | "instagram"
  | "facebook";

interface LocationState {
  websiteCategory?: string;
  websiteFormat?: string;
  projectSummary?: ProjectSummary;
}

const CONTACT_OPTIONS: {
  key: ContactField;
  title: string;
  description: string;
  placeholder: string;
  inputType: string;
  icon: string;
}[] = [
  {
    key: "email",
    title: "El. paštas",
    description: "Elektroninio pašto adresas",
    placeholder: "info@jusuverslas.lt",
    inputType: "email",
    icon: "✉",
  },
  {
    key: "phone",
    title: "Telefonas",
    description: "Telefono numeris",
    placeholder: "+370 600 00000",
    inputType: "tel",
    icon: "☎",
  },
  {
    key: "address",
    title: "Adresas",
    description: "Jūsų veiklos vieta",
    placeholder: "Vilniaus g. 10, Vilnius",
    inputType: "text",
    icon: "⌖",
  },
  {
    key: "instagram",
    title: "Instagram",
    description: "Socialinio tinklo profilis",
    placeholder: "instagram.com/jusuverslas",
    inputType: "text",
    icon: "◎",
  },
  {
    key: "facebook",
    title: "Facebook",
    description: "Verslo puslapis",
    placeholder: "facebook.com/jusuverslas",
    inputType: "text",
    icon: "f",
  },
];

const EMPTY_CONTACTS: ProjectContact = {
  email: "",
  phone: "",
  address: "",
  instagram: "",
  facebook: "",
  additionalContacts: [],
};

function getSavedContacts(): ProjectContact {
  const saved = getProjectDraft().fields?.projectContact as
    | Partial<ProjectContact>
    | undefined;

  return {
    ...EMPTY_CONTACTS,
    ...saved,
    additionalContacts: Array.isArray(saved?.additionalContacts)
      ? saved.additionalContacts
      : [],
  };
}

function getInitialSelection(): ContactField[] {
  const draft = getProjectDraft();

  const savedSelection =
    draft.fields?.projectContactSelection;

  if (Array.isArray(savedSelection)) {
    return CONTACT_OPTIONS
      .map((option) => option.key)
      .filter((key) => savedSelection.includes(key));
  }

  const savedContacts = getSavedContacts();

  return CONTACT_OPTIONS
    .map((option) => option.key)
    .filter((key) => Boolean(savedContacts[key]?.trim()));
}

export default function ProjectContactPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState =
    (location.state as LocationState | null) ?? {};

  const draft = getProjectDraft();

  const websiteCategory =
    routeState.websiteCategory ?? draft.websiteCategory;

  const websiteFormat =
    routeState.websiteFormat ?? draft.websiteFormat;

  const savedValue = draft.fields?.projectValue as
    | { projectSummary?: ProjectSummary }
    | undefined;

  const projectSummary =
    routeState.projectSummary ??
    savedValue?.projectSummary;

  const [contacts, setContacts] =
    useState<ProjectContact>(getSavedContacts);

  const [selectedFields, setSelectedFields] =
    useState<ContactField[]>(getInitialSelection);

  const [customEnabled, setCustomEnabled] =
    useState<boolean>(() => {
      const saved = getProjectDraft().fields
        ?.projectContactCustomEnabled;

      if (typeof saved === "boolean") {
        return saved;
      }

      return getSavedContacts().additionalContacts.length > 0;
    });

  // Automatinis išsaugojimas
  useEffect(() => {
    const activeContacts: ProjectContact = {
      email: selectedFields.includes("email")
        ? contacts.email
        : "",
      phone: selectedFields.includes("phone")
        ? contacts.phone
        : "",
      address: selectedFields.includes("address")
        ? contacts.address
        : "",
      instagram: selectedFields.includes("instagram")
        ? contacts.instagram
        : "",
      facebook: selectedFields.includes("facebook")
        ? contacts.facebook
        : "",
      additionalContacts: customEnabled
        ? contacts.additionalContacts
        : [],
    };

    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectContact: activeContacts,
        projectContactSelection: selectedFields,
        projectContactCustomEnabled: customEnabled,
      },
    });
  }, [
    contacts,
    selectedFields,
    customEnabled,
    websiteCategory,
    websiteFormat,
  ]);

  function toggleField(field: ContactField) {
    setSelectedFields((previous) =>
      previous.includes(field)
        ? previous.filter((item) => item !== field)
        : [...previous, field]
    );
  }

  function updateField(
    field: ContactField,
    value: string
  ) {
    setContacts((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function addCustomField() {
    setCustomEnabled(true);

    setContacts((previous) => ({
      ...previous,
      additionalContacts: [
        ...previous.additionalContacts,
        { label: "", value: "" },
      ],
    }));
  }

  function toggleCustom() {
    setCustomEnabled((previous) => {
      if (!previous) {
        setContacts((contactsPrevious) => ({
          ...contactsPrevious,
          additionalContacts:
            contactsPrevious.additionalContacts.length > 0
              ? contactsPrevious.additionalContacts
              : [{ label: "", value: "" }],
        }));
      }

      return !previous;
    });
  }

  function updateCustomField(
    index: number,
    field: keyof AdditionalContact,
    value: string
  ) {
    setContacts((previous) => ({
      ...previous,
      additionalContacts:
        previous.additionalContacts.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, [field]: value }
            : item
        ),
    }));
  }

  function removeCustomField(index: number) {
    setContacts((previous) => ({
      ...previous,
      additionalContacts:
        previous.additionalContacts.filter(
          (_, itemIndex) => itemIndex !== index
        ),
    }));
  }

  function saveContacts() {
    const activeContacts: ProjectContact = {
      email: selectedFields.includes("email")
        ? contacts.email
        : "",
      phone: selectedFields.includes("phone")
        ? contacts.phone
        : "",
      address: selectedFields.includes("address")
        ? contacts.address
        : "",
      instagram: selectedFields.includes("instagram")
        ? contacts.instagram
        : "",
      facebook: selectedFields.includes("facebook")
        ? contacts.facebook
        : "",
      additionalContacts: customEnabled
        ? contacts.additionalContacts
        : [],
    };

    saveProjectDraft({
      websiteCategory,
      websiteFormat,
      fields: {
        ...getProjectDraft().fields,
        projectContact: activeContacts,
        projectContactSelection: selectedFields,
        projectContactCustomEnabled: customEnabled,
      },
    });
  }

  const navigationState = {
    websiteCategory,
    websiteFormat,
    projectSummary,
  };

  function handleContinue() {
    saveContacts();

    navigate("/projects/new/design", {
      state: navigationState,
    });
  }

  function handleBack() {
    saveContacts();

    navigate("/projects/new/content", {
      state: navigationState,
    });
  }

  const selectedOptions = CONTACT_OPTIONS.filter(
    (option) => selectedFields.includes(option.key)
  );

  return (
    <div className="project-contact-page">
      <header className="project-contact-header">
        <button
          type="button"
          className="project-contact-back"
          onClick={handleBack}
        >
          ← Atgal
        </button>

        <Link
          to="/"
          className="project-contact-logo"
        >
          WebBuilder
        </Link>

        <span className="project-contact-step">
          04 / Kontaktai
        </span>
      </header>

      <main className="project-contact-container">
        <section className="project-contact-top">
          <p className="project-contact-eyebrow">
            04 / PALAIKYKIME RYŠĮ
          </p>

          <h1>
            Kaip klientai galės
            <br />
            su jumis susisiekti?
          </h1>

          <p className="project-contact-description">
            Pasirinkite, kokią kontaktinę informaciją
            norite pateikti savo svetainėje.
            Galite pasirinkti kelis variantus.
          </p>

          <div className="project-contact-info">
            <span className="project-contact-info-icon">
              ✦
            </span>

            <div>
              <strong>Šis žingsnis neprivalomas</strong>

              <p>
                Pasirinkite tik tuos susisiekimo būdus,
                kuriais norite dalintis viešai.
                Jei kontaktų dar neturite, galite
                iš karto tęsti.
              </p>
            </div>
          </div>
        </section>

        <section className="project-contact-card">
          <div className="project-contact-section-heading">
            <span>PASIRINKITE KONTAKTUS</span>
            <span>
              {selectedFields.length +
                (customEnabled ? 1 : 0)} pasirinkta
            </span>
          </div>

          <div className="project-contact-options">
            {CONTACT_OPTIONS.map((option) => {
              const selected =
                selectedFields.includes(option.key);

              return (
                <button
                  key={option.key}
                  type="button"
                  className={`project-contact-option ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() =>
                    toggleField(option.key)
                  }
                  aria-pressed={selected}
                >
                  <div className="project-contact-option-top">
                    <span className="project-contact-option-icon">
                      {option.icon}
                    </span>

                    <span className="project-contact-option-check">
                      {selected ? "✓" : ""}
                    </span>
                  </div>

                  <strong>{option.title}</strong>

                  <span className="project-contact-option-description">
                    {option.description}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              className={`project-contact-option custom ${
                customEnabled ? "selected" : ""
              }`}
              onClick={toggleCustom}
              aria-pressed={customEnabled}
            >
              <div className="project-contact-option-top">
                <span className="project-contact-option-icon">
                  +
                </span>

                <span className="project-contact-option-check">
                  {customEnabled ? "✓" : ""}
                </span>
              </div>

              <strong>Kita</strong>

              <span className="project-contact-option-description">
                Papildoma informacija
              </span>
            </button>
          </div>

          {(selectedOptions.length > 0 ||
            customEnabled) && (
            <div className="project-contact-fields">
              <div className="project-contact-section-heading">
                <span>PASIRINKTA INFORMACIJA</span>
                <span>
                  Užpildykite norimus laukus
                </span>
              </div>

              <div className="project-contact-questions">
                {selectedOptions.map((option, index) => (
                  <div
                    className="project-contact-question"
                    key={option.key}
                  >
                    <div className="project-contact-question-header">
                      <span className="project-contact-question-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <label
                        htmlFor={`contact-${option.key}`}
                      >
                        {option.title}
                      </label>
                    </div>

                    <div className="project-contact-input">
                      <input
                        id={`contact-${option.key}`}
                        type={option.inputType}
                        placeholder={option.placeholder}
                        value={contacts[option.key]}
                        onChange={(event) =>
                          updateField(
                            option.key,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {customEnabled && (
                <div className="project-contact-custom">
                  <div className="project-contact-custom-intro">
                    <h2>Papildoma informacija</h2>

                    <p>
                      Galite nurodyti darbo laiką,
                      registracijos nuorodą ar kitą
                      lankytojams svarbią informaciją.
                    </p>
                  </div>

                  {contacts.additionalContacts.map(
                    (contact, index) => (
                      <div
                        className="project-contact-custom-item"
                        key={index}
                      >
                        <div className="project-contact-question-header">
                          <span className="project-contact-question-number">
                            {String(
                              selectedOptions.length +
                                index +
                                1
                            ).padStart(2, "0")}
                          </span>

                          <span className="project-contact-custom-title">
                            Papildomas laukas
                          </span>
                        </div>

                        <div className="project-contact-custom-row">
                          <input
                            type="text"
                            placeholder="Pavadinimas, pvz. Darbo laikas"
                            aria-label={`Papildomo lauko ${
                              index + 1
                            } pavadinimas`}
                            value={contact.label}
                            onChange={(event) =>
                              updateCustomField(
                                index,
                                "label",
                                event.target.value
                              )
                            }
                          />

                          <input
                            type="text"
                            placeholder="Informacija, pvz. I–V 9:00–18:00"
                            aria-label={`Papildomo lauko ${
                              index + 1
                            } reikšmė`}
                            value={contact.value}
                            onChange={(event) =>
                              updateCustomField(
                                index,
                                "value",
                                event.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            className="project-contact-remove"
                            onClick={() =>
                              removeCustomField(index)
                            }
                            aria-label="Pašalinti lauką"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="project-contact-add"
                    onClick={addCustomField}
                  >
                    + Pridėti papildomą lauką
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="project-contact-actions">
            <div className="project-contact-footer-text">
              <strong>
                Kontaktus galėsite papildyti vėliau.
              </strong>

              <span>
                Jei nenorite nieko pateikti,
                galite iš karto tęsti.
              </span>
            </div>

            <button
              type="button"
              className="project-contact-continue"
              onClick={handleContinue}
            >
              Tęsti
              <span>→</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
