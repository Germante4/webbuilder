import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getToken } from "../services/authService";
import "../styles/ProjectPersonalizePage.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

const TEXT_ELEMENTS = "h1,h2,h3,h4,h5,h6,p,li,a,button,label,figcaption,blockquote,dt,dd,td,th";
const EXCLUDED_ELEMENTS = "script,style,noscript,template,svg,select,textarea,[hidden]";

interface SavedProject {
  generatedHtml?: string | null;
  stitchScreenId?: string | null;
}

type ProjectLoad =
  | { status: "loading" }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

async function loadProjectHtml(projectId: string, signal: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Prisijunkite iš naujo.");

  const options = { headers: { Authorization: "Bearer " + token }, signal };
  const response = await fetch(API_BASE + "/api/projects/" + projectId, options);

  if (!response.ok) {
    throw new Error("Nepavyko atidaryti projekto (" + response.status + ").");
  }

  const project: SavedProject = await response.json();
  if (project.generatedHtml?.trim()) return project.generatedHtml;

  if (project.stitchScreenId) {
    const screenId = encodeURIComponent(project.stitchScreenId);
    const htmlResponse = await fetch(API_BASE + "/api/stitch/saved-html/" + screenId, options);

    if (!htmlResponse.ok) {
      throw new Error("Nepavyko įkelti išsaugoto svetainės dizaino.");
    }

    const data: { html?: string } = await htmlResponse.json();
    if (data.html?.trim()) return data.html;
  }

  throw new Error("Projektas dar neturi sugeneruotos svetainės.");
}

function getTextNodes(document: Document): Text[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      return parent?.closest(TEXT_ELEMENTS) &&
        !parent.closest(EXCLUDED_ELEMENTS) &&
        node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  return nodes;
}

const PREVIEW_EDITOR_SCRIPT = `
(() => {
  const selector = "[data-wb-edit-text]";
  const fields = Array.from(document.querySelectorAll(selector));

  function openEditor(event, field) {
    event.preventDefault();
    event.stopImmediatePropagation();
    parent.postMessage({ type: "webbuilder:edit-text", index: Number(field.dataset.wbEditText) }, "*");
  }

  document.addEventListener("click", (event) => {
    const field = event.target.closest(selector);
    if (field) {
      openEditor(event, field);
    } else if (event.target.closest("a[href], button, label")) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const field = event.target.closest(selector);
    if (field) openEditor(event, field);
  }, true);

  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.type !== "webbuilder:update-text") return;
    const { index, value } = event.data;
    if (!Number.isInteger(index) || !fields[index]) return;
    if (typeof value === "string") fields[index].textContent = value || "\u00a0";
    fields[index].focus({ preventScroll: true });
  });
})();
`;

function buildEditorPreview(html: string) {
  const preview = new DOMParser().parseFromString(html, "text/html");
  const fields = getTextNodes(preview).map((node, index) => {
    const text = node.data;
    const target = preview.createElement("span");
    target.dataset.wbEditText = String(index);
    target.tabIndex = 0;
    target.textContent = text;
    node.replaceWith(target);

    return {
      value: text.trim(),
      leading: text.match(/^\s*/)?.[0] ?? "",
      trailing: text.match(/\s*$/)?.[0] ?? "",
    };
  });

  const style = preview.createElement("style");
  style.textContent = `
    [data-wb-edit-text] { cursor: text; }
    [data-wb-edit-text]:hover, [data-wb-edit-text]:focus-visible {
      outline: 2px solid #4f69d1;
      outline-offset: 3px;
      border-radius: 2px;
    }
  `;
  preview.head.append(style);

  const script = preview.createElement("script");
  script.textContent = PREVIEW_EDITOR_SCRIPT;
  preview.body.append(script);

  const doctype = preview.doctype
    ? new XMLSerializer().serializeToString(preview.doctype) + "\n"
    : "";
  return { fields, srcDoc: doctype + preview.documentElement.outerHTML };
}

function ProjectTextEditor({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const { fields, srcDoc } = useMemo(() => buildEditorPreview(html), [html]);

  useEffect(() => {
    function handlePreviewClick(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      if (event.data?.type !== "webbuilder:edit-text" || dialog.current?.open) return;

      const index = event.data.index;
      if (!Number.isInteger(index) || !fields[index]) return;

      setDraft(edits[index] ?? fields[index].value);
      setActiveIndex(index);
    }

    window.addEventListener("message", handlePreviewClick);
    return () => window.removeEventListener("message", handlePreviewClick);
  }, [edits, fields]);

  useEffect(() => {
    if (activeIndex !== null && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [activeIndex]);

  function applyEdit() {
    if (activeIndex === null) return;
    const field = fields[activeIndex];
    setEdits((previous) => ({ ...previous, [activeIndex]: draft }));
    frame.current?.contentWindow?.postMessage({
      type: "webbuilder:update-text",
      index: activeIndex,
      value: field.leading + draft + field.trailing,
    }, "*");
    dialog.current?.close();
  }

  function closeEditor() {
    if (activeIndex === null) return;
    frame.current?.contentWindow?.postMessage({
      type: "webbuilder:update-text",
      index: activeIndex,
    }, "*");
    setActiveIndex(null);
  }

  return (
    <section className="personalize-panel" aria-labelledby="personalize-preview">
      <div className="personalize-panel-header">
  <div className="personalize-toolbar">
    <span className="personalize-toolbar-icon" aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m16 4 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" />
      </svg>
    </span>

    <div className="personalize-toolbar-copy">
      <h2 id="personalize-preview">
        {fields.length > 0
          ? "Paspauskite tekstą svetainėje žemiau"
          : "Svetainės peržiūra"}
      </h2>

      {fields.length > 0 ? (
        <p id="personalize-guide">
          Galite keisti antraštę, pastraipą ar mygtuko užrašą.
          Atsidariusiame lange perrašykite tekstą ir spauskite{" "}
          <strong>„Atnaujinti tekstą“</strong>.
        </p>
      ) : (
        <p role="status">Šioje svetainėje redaguojamų tekstų nerasta.</p>
      )}
    </div>
  </div>
</div>

      <iframe
        ref={frame}
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
        onClose={closeEditor}
      >
        <form onSubmit={(event) => {
          event.preventDefault();
          applyEdit();
        }}>
          <h2 id="personalize-dialog-title">Redaguoti tekstą</h2>

          <label className="personalize-field">
            <span>Svetainės tekstas</span>
            <textarea
              autoFocus
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>

          <div className="personalize-dialog-actions">
            <button type="button" onClick={() => dialog.current?.close()}>Atšaukti</button>
            <button type="submit">Atnaujinti tekstą</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

function PersonalizeContent({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectLoad>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    loadProjectHtml(projectId, controller.signal)
      .then((html) => {
        if (!controller.signal.aborted) setProject({ status: "ready", html });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setProject({
          status: "error",
          message: error instanceof Error ? error.message : "Nepavyko įkelti projekto.",
        });
      });

    return () => controller.abort();
  }, [projectId]);

  if (project.status === "loading") {
    return <p className="personalize-status" role="status">Įkeliama svetainė…</p>;
  }

  if (project.status === "error") {
    return <p className="personalize-status personalize-error" role="alert">{project.message}</p>;
  }

  return <ProjectTextEditor html={project.html} />;
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
          <p>Paspauskite norimą tekstą svetainės peržiūroje ir įrašykite pakeitimą.</p>
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
