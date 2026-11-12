
import { useEffect, useRef, useState } from "react";

interface Props {
  html: string;
  screenId: string;
}

interface WebsiteImage {
  index: number;
  src: string;
}

const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;

const DB_NAME = "webbuilder-stitch-previews";
const STORE_NAME = "results";

function editedHtmlKey(screenId: string) {
  return `edited-html-${screenId}`;
}

// Naudojame tą pačią IndexedDB kaip ProjectPreviewPage.
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEditedHtml(screenId: string): Promise<string | null> {
  const db = await openDb();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction
        .objectStore(STORE_NAME)
        .get(editedHtmlKey(screenId));

      request.onsuccess = () =>
        resolve(typeof request.result === "string" ? request.result : null);

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function saveEditedHtml(screenId: string, html: string) {
  const db = await openDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction
        .objectStore(STORE_NAME)
        .put(html, editedHtmlKey(screenId));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

function getImages(html: string): WebsiteImage[] {
  const document = parseHtml(html);

  return Array.from(document.querySelectorAll("img"))
    .filter((image) => Boolean(image.getAttribute("src")))
    .map((image, index) => ({
      index,
      src: image.getAttribute("src") ?? "",
    }));
}

function replaceImage(html: string, index: number, newSrc: string) {
  const document = parseHtml(html);

  const images = Array.from(
    document.querySelectorAll("img[src]")
  );

  const image = images[index];

  if (!image) {
    throw new Error("Nuotrauka nerasta.");
  }

  // Keičiame tik nuotrauką, o ne jos dydį ar CSS klases.
  image.setAttribute("src", newSrc);

  // Kad naršyklė nepasirinktų senos nuotraukos.
  image.removeAttribute("srcset");
  image.removeAttribute("sizes");

  // Jei nuotrauka yra <picture> elemente,
  // pašaliname senus alternatyvius šaltinius.
  const picture = image.closest("picture");

  if (picture) {
    picture.querySelectorAll("source").forEach((source) => {
      source.remove();
    });
  }

  return "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Nepavyko nuskaityti nuotraukos."));
      }
    };

    reader.onerror = () => reject(new Error("Nepavyko nuskaityti failo."));
    reader.readAsDataURL(file);
  });
}

function validateImage(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("Pasirinktas failas nėra tinkama nuotrauka."));

    image.src = dataUrl;
  });
}

export default function DesktopWebsitePreview({
  html,
  screenId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(DESKTOP_WIDTH);
  const [currentHtml, setCurrentHtml] = useState(html);
  const [images, setImages] = useState<WebsiteImage[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Atkuriame pakeistas nuotraukas po puslapio perkrovimo.
  useEffect(() => {
    let active = true;

    setReady(false);

    void getEditedHtml(screenId)
      .then((savedHtml) => {
        if (!active) return;

        const restoredHtml = savedHtml ?? html;

        setCurrentHtml(restoredHtml);
        setImages(getImages(restoredHtml));
      })
      .catch((error) => {
        console.error("Nepavyko atkurti pakeisto HTML:", error);

        if (active) {
          setCurrentHtml(html);
          setImages(getImages(html));
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [html, screenId]);

  // Desktop peržiūros mastelis.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [ready]);

  const scale = Math.min(1, containerWidth / DESKTOP_WIDTH);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];

    if (!file || saving) return;

    event.target.value = "";
    setMessage("");

    // Pirmam variantui ribojame nuotraukas iki 5 MB.
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Galima įkelti JPG, PNG arba WebP nuotraukas.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Nuotrauka negali viršyti 5 MB.");
      return;
    }

    setSaving(true);

    try {
      const dataUrl = await readImage(file);
      await validateImage(dataUrl);

      const updatedHtml = replaceImage(currentHtml, index, dataUrl);

      // Pirma išsaugome, tik tada atnaujiname peržiūrą.
      await saveEditedHtml(screenId, updatedHtml);

      setCurrentHtml(updatedHtml);
      setImages(getImages(updatedHtml));
      setMessage("Nuotrauka sėkmingai pakeista ir išsaugota.");
    } catch (error) {
      console.error("Nuotraukos keitimo klaida:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Nepavyko pakeisti nuotraukos."
      );
    } finally {
      setSaving(false);
    }
  };

  const openInBrowser = () => {
    const blob = new Blob([currentHtml], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const tab = window.open("about:blank", "_blank");

    if (!tab) {
      URL.revokeObjectURL(url);
      setMessage("Naršyklė užblokavo naują skirtuką.");
      return;
    }

    tab.opener = null;
    tab.location.replace(url);

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };

  if (!ready) {
    return <p style={{ padding: 20 }}>Ruošiama svetainės peržiūra...</p>;
  }

  
const downloadHtml = () => {
  const blob = new Blob([currentHtml], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "webbuilder-website.html";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};


  return (
    <div>
      <div className="desktop-preview-toolbar">
        <span>Darbalaukio versija · 1440 px</span>
        <button type="button" onClick={downloadHtml}>
  ↓ Atsisiųsti HTML
</button>
        <button type="button" onClick={openInBrowser}>
          ↗ Atidaryti naršyklėje
        </button>
      </div>

      <div
        ref={containerRef}
        className="desktop-preview-container"
        style={{ height: DESKTOP_HEIGHT * scale }}
      >
        <iframe
          title="Sugeneruotos svetainės peržiūra"
          srcDoc={currentHtml}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          style={{
            width: DESKTOP_WIDTH,
            height: DESKTOP_HEIGHT,
            border: 0,
            background: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>

      <section className="website-image-editor">
        <h3>Pakeisti svetainės nuotraukas</h3>

        <p>
          Pasirinkite nuotrauką, kurią norite pakeisti.
          Svetainės dizainas išliks toks pats.
        </p>

        {images.length === 0 ? (
          <p>Šioje svetainėje HTML nuotraukų nerasta.</p>
        ) : (
          <div className="website-image-grid">
            {images.map((image) => (
              <div className="website-image-card" key={image.index}>
                <img
                  src={image.src}
                  alt={`Svetainės nuotrauka ${image.index + 1}`}
                />

                <strong>Nuotrauka {image.index + 1}</strong>

                <label className="website-image-upload">
                  {saving ? "Palaukite..." : "Pakeisti nuotrauką"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    onChange={(event) =>
                      void handleImageChange(event, image.index)
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className="website-image-message" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
