
import { useEffect, useRef, useState } from "react";

interface Props {
  html: string;
  screenId: string;
}

const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;

export default function DesktopWebsitePreview({ html, screenId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(DESKTOP_WIDTH);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, containerWidth / DESKTOP_WIDTH);

  return (
    <div>
      <div className="desktop-preview-toolbar">
        <span>Darbalaukio versija · 1440 px</span>

        <button type="button" onClick={() => setExpanded(true)}>
          ⛶ Peržiūrėti visu dydžiu
        </button>
      </div>

      <div
        ref={containerRef}
        className="desktop-preview-container"
        style={{ height: DESKTOP_HEIGHT * scale }}
      >
        <iframe
          key={screenId}
          title="Sugeneruotos svetainės peržiūra"
          srcDoc={html}
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

      {expanded && (
        <div
          className="comparison-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Svetainės dizaino peržiūra"
        >
          <div className="comparison-fullscreen-header">
            <div>
              <strong>Svetainės dizainas</strong>
              <span>Darbalaukio peržiūra</span>
            </div>

            <button type="button" onClick={() => setExpanded(false)}>
              ✕ Uždaryti
            </button>
          </div>

          <div className="comparison-fullscreen-content">
            <iframe
              title="Svetainės dizainas – pilna peržiūra"
              srcDoc={html}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
