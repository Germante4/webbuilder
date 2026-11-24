import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getToken } from "../services/authService";
import "../styles/ProjectPersonalizePage.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

interface EditableElement {
  id: string;
  properties: { text?: string; src?: string };
}

interface Personalization {
  html: string;
  version: number;
  elements: EditableElement[];
}

function authorization() {
  const token = getToken();
  if (!token) throw new Error("Prisijunkite iš naujo.");
  return { Authorization: "Bearer " + token };
}

function personalizationUrl(projectId: string) {
  return API_BASE + "/api/projects/" + projectId + "/personalization";
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(response.status === 409
      ? "Svetainės versija pasikeitė. Įkelkite puslapį iš naujo."
      : error?.message || "Veiksmas nepavyko (" + response.status + ").");
  }
  return response.json();
}

async function readPersonalization(response: Response): Promise<Personalization> {
  const data = await readResponse<{
    html: string;
    version: number;
    elements?: Array<{
      id?: string;
      elementId?: string;
      properties?: EditableElement["properties"];
      props?: EditableElement["properties"];
    }>;
    editableElements?: Array<{
      id?: string;
      elementId?: string;
      properties?: EditableElement["properties"];
      props?: EditableElement["properties"];
    }>;
  }>(response);

  const items = data.elements ?? data.editableElements;
  if (typeof data.html !== "string" || typeof data.version !== "number" || !Array.isArray(items)) {
    throw new Error("Serveris grąžino netinkamus svetainės redagavimo duomenis.");
  }

  return {
    html: data.html,
    version: data.version,
    elements: items.flatMap((item) => {
      const id = item.id ?? item.elementId;
      const properties = item.properties ?? item.props;
      return id && properties ? [{ id, properties }] : [];
    }),
  };
}

async function uploadPhoto(file: File, signal: AbortSignal) {
  const body = new FormData();
  body.append("photos", file);
  const response = await fetch(API_BASE + "/api/project-assets/upload", {
    method: "POST",
    headers: authorization(),
    body,
    signal,
  });
  const { photos } = await readResponse<{ photos: string[] }>(response);
  if (!photos?.[0]) throw new Error("Serveris negrąžino įkeltos nuotraukos.");

  return new URL(
    API_BASE + "/api/project-assets/images/" + encodeURIComponent(photos[0]),
    window.location.origin,
  ).href;
}

const PREVIEW_EDITOR_SCRIPT = `
  function selectElement(event) {
    const target = event.target.closest("[data-wb-editable]");
    if (!target) {
      if (event.type === "click" && event.target.closest("a,button")) event.preventDefault();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    parent.postMessage({ type: "webbuilder:edit", id: target.dataset.wbId }, "*");
  }

  document.addEventListener("click", selectElement, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") selectElement(event);
  }, true);
`;

function buildEditorPreview({ html, elements }: Personalization) {
  const preview = new DOMParser().parseFromString(html, "text/html");
  const editable = new Map(elements.map((element) => [element.id, element.properties]));

  for (const element of preview.querySelectorAll<HTMLElement>("[data-wb-id]")) {
    const properties = editable.get(element.dataset.wbId ?? "");
    if (!properties) continue;
    if (element.localName === "img" && properties.src !== undefined) {
      const uploadedImage = /^https?:\/\/[^?#]+\/api\/project-assets\/images\/photo-[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i;

      if (uploadedImage.test(properties.src)) {
        element.setAttribute("src", properties.src);
        element.removeAttribute("srcset");
        const picture = element.closest("picture");
        if (picture) {
          for (const source of picture.querySelectorAll(":scope > source")) source.remove();
        }
      }

      element.dataset.wbEditable = "photo";
      element.title = "Keisti nuotrauką";
    } else if (properties.text !== undefined) {
      element.dataset.wbEditable = "text";
      element.title = "Redaguoti tekstą";
    } else {
      continue;
    }

    element.tabIndex = 0;
  }

  const style = preview.createElement("style");
  style.textContent = `
    [data-wb-editable] { cursor: pointer; }
    [data-wb-editable="text"] {
      text-decoration-line: underline;
      text-decoration-style: dotted;
      text-underline-offset: 0.22em;
    }
    [data-wb-editable="photo"],
    [data-wb-editable]:hover,
    [data-wb-editable]:focus-visible {
      outline: 2px dashed #4f69d1;
      outline-offset: -2px;
    }
  `;
  preview.head.append(style);
  const script = preview.createElement("script");
  script.textContent = PREVIEW_EDITOR_SCRIPT;
  preview.body.append(script);

  const doctype = preview.doctype
    ? new XMLSerializer().serializeToString(preview.doctype) + "\n"
    : "";
  return doctype + preview.documentElement.outerHTML;
}

function PersonalizeContent({ projectId }: { projectId: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<AbortController | null>(null);
  const [project, setProject] = useState<Personalization | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editError, setEditError] = useState("");
  const [selected, setSelected] = useState<EditableElement | null>(null);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const photoEdit = selected?.properties.src !== undefined;
  const srcDoc = useMemo(() => project ? buildEditorPreview(project) : "", [project]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(personalizationUrl(projectId), {
          headers: authorization(),
          signal: controller.signal,
        });
        const result = await readPersonalization(response);
        if (!controller.signal.aborted) setProject(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Nepavyko įkelti svetainės.");
        }
      }
    }

    void load();
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, [projectId]);

  useEffect(() => {
    function handleSelection(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      if (event.data?.type !== "webbuilder:edit" || dialog.current?.open) return;
      const item = project?.elements.find(({ id }) => id === event.data.id);
      if (!item || (item.properties.src === undefined && item.properties.text === undefined)) return;

      setDraft(item.properties.text ?? "");
      setPhoto(null);
      setEditError("");
      setSelected(item);
    }

    window.addEventListener("message", handleSelection);
    return () => window.removeEventListener("message", handleSelection);
  }, [project]);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  async function saveEdit() {
    if (!project || !selected || pending.current || (photoEdit && !photo)) return;
    const controller = new AbortController();
    pending.current = controller;
    setSaving(true);
    setEditError("");

    try {
      const property = photoEdit ? "src" : "text";
      const value = photoEdit && photo ? await uploadPhoto(photo, controller.signal) : draft;
      const response = await fetch(personalizationUrl(projectId), {
        method: "PUT",
        headers: { ...authorization(), "Content-Type": "application/json" },
        body: JSON.stringify({
          version: project.version,
          changes: [{ elementId: selected.id, property, value }],
        }),
        signal: controller.signal,
      });
      const result = await readPersonalization(response);
      if (controller.signal.aborted) return;
      setProject(result);

      if (photoEdit && result.elements.find(({ id }) => id === selected.id)?.properties.src !== value) {
        setEditError("Serveris negrąžino naujo nuotraukos adreso. Patikrinkite, ar pakeitimas išsaugotas.");
        return;
      }

      dialog.current?.close();
    } catch (error) {
      if (!controller.signal.aborted) {
        setEditError(error instanceof Error ? error.message : "Nepavyko išsaugoti pakeitimo.");
      }
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  if (loadError) return <p className="personalize-status personalize-error" role="alert">{loadError}</p>;
  if (!project) return <p className="personalize-status" role="status">Įkeliama svetainė…</p>;

  return (
    <section className="personalize-panel" aria-labelledby="personalize-preview">
      <div className="personalize-panel-header">
        <h2 id="personalize-preview">Paspauskite tekstą arba nuotrauką</h2>
        <p id="personalize-guide">Pabrauktą tekstą galite perrašyti, o nuotrauką su kontūru – pakeisti įkeldami naują.</p>
      </div>

      <iframe
        ref={frame}
        aria-describedby="personalize-guide"
        className="personalize-frame"
        title="Redaguojamos svetainės peržiūra"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
      />

      <dialog
        ref={dialog}
        className="personalize-dialog"
        aria-labelledby="personalize-dialog-title"
        onCancel={(event) => { if (saving) event.preventDefault(); }}
        onClose={() => setSelected(null)}
      >
        <form onSubmit={(event) => {
          event.preventDefault();
          void saveEdit();
        }}>
          <h2 id="personalize-dialog-title">{photoEdit ? "Keisti nuotrauką" : "Redaguoti tekstą"}</h2>

          {selected && (photoEdit ? (
            <label className="personalize-field">
              <span>Pasirinkite naują nuotrauką (JPG, PNG arba WebP)</span>
              <input
                autoFocus
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                disabled={saving}
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <label className="personalize-field">
              <span>Svetainės tekstas</span>
              <textarea autoFocus rows={4} value={draft} disabled={saving}
                onChange={(event) => setDraft(event.target.value)} />
            </label>
          ))}

          {editError && <p className="personalize-error" role="alert">{editError}</p>}

          <div className="personalize-dialog-actions">
            <button type="button" disabled={saving} onClick={() => dialog.current?.close()}>Atšaukti</button>
            <button type="submit" disabled={saving || (photoEdit && !photo)}>
              {saving ? "Saugoma…" : photoEdit ? "Pakeisti nuotrauką" : "Atnaujinti tekstą"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export default function ProjectPersonalizePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const validProjectId = projectId && /^[1-9]\d*$/.test(projectId) ? projectId : null;

  return (
    <div className="personalize-page">
      <header className="personalize-header">
        <Link
          className="personalize-back"
          to={validProjectId ? "/projects/new/preview" : "/dashboard"}
          state={validProjectId ? { webBuilderProjectId: Number(validProjectId), openSavedProject: true } : undefined}
        >
          ← Atgal
        </Link>
        <Link className="personalize-logo" to="/">WebBuilder</Link>
        <span className="personalize-step">08 / Turinys</span>
      </header>

      <main className="personalize-main">
        <section className="personalize-intro">
          <h1>Svetainės turinio koregavimas</h1>
        </section>

        {validProjectId ? (
          <PersonalizeContent key={validProjectId} projectId={validProjectId} />
        ) : (
          <p className="personalize-status personalize-error" role="alert">Neteisingas projekto numeris.</p>
        )}
      </main>
    </div>
  );
}
