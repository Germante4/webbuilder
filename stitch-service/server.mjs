import express from "express";
import * as cheerio from "cheerio";
import { stitch, Stitch, StitchToolClient } from "@google/stitch-sdk";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT ?? 3001);
const INTERNAL_TOKEN = process.env.STITCH_INTERNAL_TOKEN;
const API_KEY = process.env.STITCH_API_KEY;

if (!API_KEY || !INTERNAL_TOKEN) {
    throw new Error(
        "Trūksta STITCH_API_KEY arba STITCH_INTERNAL_TOKEN"
    );
}

const DATA_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "generated-results"
);

await mkdir(DATA_DIR, { recursive: true });

let operationTail = Promise.resolve();

async function acquireOperation() {
    const previous = operationTail;
    let release;
    operationTail = new Promise(resolve => { release = resolve; });
    await previous;
    return release;
}
function createRefinementClient() {
    const client = new StitchToolClient({
        apiKey: API_KEY,
        baseUrl: process.env.STITCH_HOST || "https://stitch.googleapis.com/mcp"
    });

    return {
        client,
        stitchInstance: new Stitch(client)
    };
}

// ========================================
// AUTHORIZATION
// ========================================

function authorize(req, res, next) {
    if (req.get("x-internal-token") !== INTERNAL_TOKEN) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    next();
}

// ========================================
// FILE HELPERS
// ========================================

function safeId(value) {
    return typeof value === "string" &&
        /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

function metaPath(screenId) {
    return path.join(DATA_DIR, `${screenId}.json`);
}

async function saveMeta(meta) {
    if (!safeId(meta.screenId)) {
        throw new Error("Netinkamas ekrano ID");
    }

    const target = metaPath(meta.screenId);
    const temp = `${target}.${crypto.randomUUID()}.tmp`;

    await writeFile(
        temp,
        JSON.stringify(meta, null, 2),
        "utf8"
    );

    await rename(temp, target);
}

async function loadMeta(screenId) {
    if (!safeId(screenId)) {
        throw new Error("Netinkamas ekrano ID");
    }

    return JSON.parse(
        await readFile(metaPath(screenId), "utf8")
    );
}

// ========================================
// DOWNLOAD URL VALIDATION
// ========================================

function validateDownloadUrl(rawUrl) {
    const url = new URL(rawUrl);

    const hosts = new Set([
        "stitch.googleapis.com",
        "lh3.googleusercontent.com",
        "contribution.usercontent.google.com"
    ]);

    if (
        url.protocol !== "https:" ||
        !hosts.has(url.hostname) ||
        url.username ||
        url.password ||
        url.port
    ) {
        throw new Error("Netinkamas Stitch failo adresas");
    }

    if (
        url.hostname === "stitch.googleapis.com" &&
        !/^\/v1\/projects\/[^/]+\/files\/[^/]+:download$/.test(
            url.pathname
        )
    ) {
        throw new Error("Netinkamas Stitch API failo kelias");
    }

    return url;
}

// ========================================
// FILE TYPE DETECTION
// ========================================

const MAX_FILE_BYTES = 30 * 1024 * 1024;

function detectImage(buffer) {
    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )
    ) {
        return "png";
    }

    if (
        buffer.length >= 3 &&
        buffer[0] === 255 &&
        buffer[1] === 216 &&
        buffer[2] === 255
    ) {
        return "jpeg";
    }

    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return "webp";
    }

    return null;
}

function validateArtifact(buffer, type) {
    if (
        !buffer.length ||
        buffer.length > MAX_FILE_BYTES
    ) {
        throw new Error("Netinkamas failo dydis");
    }

    if (type === "html") {
        if (
            !/<(?:!doctype\s+html|html\b)/i.test(
                buffer.toString("utf8")
            )
        ) {
            throw new Error("Gautas failas nėra HTML");
        }

        return {
            buffer,
            mimeType: "text/html",
            extension: "html"
        };
    }

    const extension = detectImage(buffer);

    if (!extension) {
        throw new Error(
            "Gautas failas nėra PNG, JPEG arba WEBP"
        );
    }

    return {
        buffer,
        extension,
        mimeType: `image/${extension}`
    };
}

// ========================================
// DOWNLOAD STITCH FILE
// ========================================

async function downloadStitchFile(rawUrl, type) {
    const attempts = type === "html" ? 5 : 1;
    for (let attempt = 1; ; attempt++) {
        try {
            return await downloadStitchFileOnce(rawUrl, type);
        } catch (error) {
            const retryable = error.name === "TimeoutError" ||
                error.name === "AbortError" || error instanceof TypeError ||
                /HTTP (404|408|429|5\d\d)\b/.test(error.message);
            if (!retryable || attempt >= attempts) throw error;
            console.warn(`HTML download retry ${attempt}/${attempts}`);
            await sleep(attempt * 5000);
        }
    }
}

async function downloadStitchFileOnce(rawUrl, type) {
    const url = validateDownloadUrl(rawUrl);

    const headers =
        url.hostname === "stitch.googleapis.com"
            ? { "x-goog-api-key": API_KEY }
            : {};

    const response = await fetch(url, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(180_000)
    });

    if (!response.ok) {
        throw new Error(
            `Stitch atsisiuntimas: HTTP ${response.status}: ` +
            (await response.text()).slice(0, 300)
        );
    }

    const length = Number(
        response.headers.get("content-length") ?? 0
    );

    if (length > MAX_FILE_BYTES * 1.5) {
        throw new Error("Failas per didelis");
    }

    const bytes = Buffer.from(
        await response.arrayBuffer()
    );

    if (bytes.length > MAX_FILE_BYTES * 1.5) {
        throw new Error("Failas per didelis");
    }

    const contentType =
        response.headers.get("content-type") ?? "";

    if (
        contentType.includes("json") ||
        bytes.toString("utf8", 0, 1) === "{"
    ) {
        let data;

        try {
            data = JSON.parse(bytes.toString("utf8"));
        } catch {
            throw new Error(
                "Nepavyko perskaityti Stitch JSON atsakymo"
            );
        }

        if (
            type === "image" &&
            typeof data.dataString === "string"
        ) {
            const declared = data.imageMetadata?.mimeType;

            const buffer = Buffer.from(
                data.dataString,
                "base64"
            );

            const artifact = validateArtifact(
                buffer,
                "image"
            );

            if (
                declared &&
                declared !== artifact.extension &&
                !(declared === "jpg" &&
                    artifact.extension === "jpeg") &&
                declared !== artifact.mimeType
            ) {
                throw new Error(
                    "Paveikslėlio MIME tipas neatitinka turinio"
                );
            }

            return artifact;
        }

        if (type === "html") {
            const html =
                typeof data.html === "string"
                    ? data.html
                    : data.dataString;

            if (typeof html === "string") {
                return validateArtifact(
                    Buffer.from(html, "utf8"),
                    "html"
                );
            }
        }

        throw new Error(
            `Stitch JSON neturi ${type} turinio. ` +
            `Laukai: ${Object.keys(data).join(", ")}`
        );
    }

    return validateArtifact(bytes, type);
}

// ========================================
// SAVE HTML, IMAGE AND JSON
// ========================================

async function fetchAndStore(meta) {
    const errors = [];

    if (meta.htmlUrl && !meta.htmlFile) {
        try {
            const file = await downloadStitchFile(
                meta.htmlUrl,
                "html"
            );

            const filename = `${meta.screenId}.html`;

            await writeFile(
                path.join(DATA_DIR, filename),
                file.buffer
            );

            meta.htmlFile = filename;
        } catch (error) {
            errors.push(`HTML: ${error.message}`);
        }
    }

    if (meta.screenshotUrl && !meta.imageFile) {
        try {
            const file = await downloadStitchFile(
                meta.screenshotUrl,
                "image"
            );

            const filename =
                `${meta.screenId}.${file.extension}`;

            await writeFile(
                path.join(DATA_DIR, filename),
                file.buffer
            );

            meta.imageFile = filename;
        } catch (error) {
            errors.push(
                `Paveikslėlis: ${error.message}`
            );
        }
    }

    meta.errors = errors;

    await saveMeta(meta);

    return meta;
}

// ========================================
// RESPONSE TO SPRING BOOT
// ========================================

async function responseFor(meta) {
    let image = null;

    if (meta.imageFile) {
        try {
            const buffer = await readFile(
                path.join(DATA_DIR, meta.imageFile)
            );

            const ext = path.extname(
                meta.imageFile
            ).slice(1);

            const mime =
                ext === "jpg" ? "jpeg" : ext;

            image =
                `data:image/${mime};base64,` +
                buffer.toString("base64");
        } catch {
            // Paveikslėlis neprivalomas.
        }
    }

    return {
        projectId: meta.projectId,
        screenId: meta.screenId,
        html: meta.htmlUrl ?? null,
        image,
        hasSavedHtml: Boolean(meta.htmlFile),
        errors: meta.errors ?? []
    };
}

// ========================================
// FIND THE WEBSITE SCREEN
// ========================================

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

function htmlUrlOf(screen) {
    return screen.data?.htmlCode?.downloadUrl ?? null;
}

function isImage(screen) {
    return screen.data?.screenType === "IMAGE";
}

async function chooseWebsiteScreen(
    project,
    attempts = 180,
    delayMs = 5000
) {
    let lastError = null;
    let lastScreens = [];

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const screens = await project.screens();
            lastScreens = screens;

            console.log(
                `STITCH SCREENS (${attempt}/${attempts}):`,
                screens.map((screen) => ({
                    id: screen.id,
                    title: screen.data?.title,
                    type: screen.data?.screenType ?? null,
                    hasHtmlCode: Boolean(htmlUrlOf(screen))
                }))
            );

            const candidates = screens
                .filter((screen) => !isImage(screen))
                .sort((a, b) => {
                    const score = (screen) =>
                        /landing|website|puslap|svetain|home/i.test(
                            screen.data?.title ?? ""
                        ) ? 1 : 0;

                    return score(b) - score(a);
                });

            for (const screen of candidates) {
                const existingUrl = htmlUrlOf(screen);

                if (existingUrl) {
                    console.log(
                        "STITCH HTML SCREEN FOUND:",
                        screen.id
                    );

                    return {
                        screen,
                        htmlUrl: existingUrl
                    };
                }

                if (typeof screen.getHtml !== "function") {
                    continue;
                }

                try {
                    const htmlUrl = await screen.getHtml();

                    if (
                        typeof htmlUrl === "string" &&
                        htmlUrl.trim()
                    ) {
                        console.log(
                            "STITCH HTML SCREEN FOUND VIA getHtml():",
                            screen.id
                        );

                        return {
                            screen,
                            htmlUrl
                        };
                    }
                } catch (error) {
                    lastError = error;

                    console.warn(
                        `Ekranas ${screen.id} dar neturi pasiekiamo HTML:`,
                        error.message
                    );
                }
            }
        } catch (error) {
            lastError = error;

            console.warn(
                "Nepavyko gauti Stitch ekranų:",
                error.message
            );
        }

        if (attempt < attempts) {
            console.log(
                `HTML ekranas dar nerastas. Laukiama ${delayMs} ms...`
            );

            await sleep(delayMs);
        }
    }

    console.error(
        "STITCH FINAL SCREEN LIST:",
        lastScreens.map((screen) => ({
            id: screen.id,
            title: screen.data?.title,
            type: screen.data?.screenType ?? null,
            hasHtmlCode: Boolean(htmlUrlOf(screen))
        }))
    );

    throw new Error(
        `Per ${attempts} patikrinimų nerastas svetainės HTML ekranas.` +
        (lastError ? ` Paskutinė klaida: ${lastError.message}` : "")
    );
}

// ========================================
// EXPORT EXISTING STITCH PROJECT
// ========================================

async function exportWebsite(
    projectId,
    { attempts = 180 } = {}
) {
    if (!safeId(String(projectId))) {
        throw new Error("Netinkamas projekto ID");
    }

    const project = stitch.project(
        String(projectId)
    );

    const { screen, htmlUrl } = await chooseWebsiteScreen(
        project,
        attempts
    );

    if (!safeId(String(screen.id))) {
        throw new Error(
            "Netinkamas Stitch ekrano ID"
        );
    }

    let screenshotUrl =
        screen.data?.screenshot?.downloadUrl ?? null;

    const errors = [];

    if (!screenshotUrl) {
        try {
            screenshotUrl = await screen.getImage();
        } catch (error) {
            errors.push(
                `Paveikslėlio adresas: ${error.message}`
            );
        }
    }

    const meta = {
        projectId: String(projectId),
        screenId: String(screen.id),
        screenType:
            screen.data?.screenType ?? null,
        title:
            screen.data?.title ?? null,
        htmlUrl,
        screenshotUrl,
        htmlFile: null,
        imageFile: null,
        errors,
        createdAt: new Date().toISOString()
    };

    await fetchAndStore(meta);

    meta.errors = [
        ...errors,
        ...meta.errors
    ];

    await saveMeta(meta);

    if (!meta.htmlFile) {
        throw new Error(
            "Svetainės HTML neišsaugotas: " +
            meta.errors.join("; ")
        );
    }

    console.log("STITCH EXPORT:", {
        projectId: meta.projectId,
        screenId: meta.screenId,
        htmlFile: meta.htmlFile,
        imageFile: meta.imageFile,
        errors: meta.errors
    });

    return meta;
}

// ========================================
// WEBSITE PROMPT
// ========================================

function makeWebsitePrompt(prompt) {
    return `
You are a professional website UI designer.

IMPORTANT:
Generate a WEBSITE UI screen with exportable HTML,
NOT an IMAGE screen.

Generate exactly ONE complete, high-quality,
vertically scrolling SINGLE-PAGE LANDING WEBSITE.

Do not generate a standalone image,
illustration, style guide, or unrelated screens.

WEBSITE FORMAT: LANDING_PAGE

- One header with anchor navigation.
- A carefully designed hero section.
- Relevant content sections based on the brief.
- Clear calls to action and one footer.
- All sections must be on the SAME page.
- Do not generate checkout flows or separate
  About/Services/Contact pages.

VISUAL DESIGN

- Desktop-first layout approximately 1440px wide.
- Professional composition, typography,
  spacing, hierarchy, and cohesive colors.
- Follow the supplied brand guidelines.
- Do not invent a replacement logo.

CONTENT

- Follow the language specified in the brief.
- All visible text uses that language.
- Do not invent testimonials, prices, awards,
  statistics, services, or achievements.
- If information is missing, use clearly
  identifiable placeholders.
- Private uploaded asset identifiers are
  not publicly accessible image URLs.
- WebBuilder may insert user-uploaded assets
  into the HTML later.

WEBSITE DESIGN BRIEF

${prompt}

FINAL RULE:
One complete landing-page WEBSITE with exportable HTML,
header, hero, sections, and footer.
`;
}

// ========================================
// GENERATE NEW WEBSITE
// ========================================

app.post(
    "/generate",
    authorize,
    async (req, res) => {
        const { prompt } = req.body ?? {};

        if (
            typeof prompt !== "string" ||
            !prompt.trim() ||
            prompt.length > 10000
        ) {
            return res.status(400).json({
                error: "Netinkamas dizaino promptas"
            });
        }

        const releaseOperation = await acquireOperation();

        let projectId = null;

        try {
            const project =
                await stitch.createProject("WebBuilder");

            projectId = String(project.id);
            console.log("STITCH PROJECT CREATED:", projectId);

            const generated = await project.generate(
                makeWebsitePrompt(prompt),
                "DESKTOP"
            );

            console.log(
                "STITCH GENERATE RESULT:",
                {
                    projectId,
                    screenId: generated?.id,
                    screenType:
                    generated?.data?.screenType
                }
            );

            const meta = await exportWebsite(
                projectId
            );

            return res.json(
                await responseFor(meta)
            );
        } catch (error) {
            console.error(
                "Stitch generavimo / eksporto klaida:",
                error
            );

            return res.status(502).json({
                error:
                    "Nepavyko sugeneruoti arba išsaugoti Stitch svetainės",
                details: error.message,
                projectId
            });
        } finally {
            releaseOperation();
        }
    }
);

// ========================================
// RESTORE EXISTING STITCH PROJECT
// ========================================

app.post(
    "/restore-screen",
    authorize,
    async (req, res) => {
        try {
            const { screenId, projectId } =
            req.body ?? {};

            let id = projectId;

            if (!id) {
                const oldMeta = await loadMeta(
                    screenId
                );

                id = oldMeta.projectId;
            }

            if (!safeId(String(id))) {
                return res.status(400).json({
                    error: "Netinkamas projekto ID"
                });
            }

            const meta = await exportWebsite(
                String(id),
                { attempts: 3 }
            );

            return res.json({
                ...meta,
                hasSavedHtml: Boolean(meta.htmlFile)
            });
        } catch (error) {
            console.error(
                "Stitch atkūrimo klaida:",
                error
            );

            return res.status(502).json({
                error:
                    "Nepavyko atkurti Stitch svetainės",
                details: error.message
            });
        }
    }
);

// ========================================
// RECOVER LOCAL RESULT
// ========================================

app.post(
    "/recover-result",
    authorize,
    async (req, res) => {
        try {
            const {
                screenId,
                retryDownload = false
            } = req.body ?? {};

            const meta = await loadMeta(
                screenId
            );

            if (retryDownload) {
                await fetchAndStore(meta);
            }

            return res.json(
                await responseFor(meta)
            );
        } catch (error) {
            return res.status(
                error.code === "ENOENT" ? 404 : 400
            ).json({
                error:
                    "Rezultato nepavyko atkurti",
                details: error.message
            });
        }
    }
);

// ========================================
// DOWNLOAD IMAGE
// ========================================

app.post(
    "/download-image",
    authorize,
    async (req, res) => {
        try {
            const { downloadUrl } =
            req.body ?? {};

            if (typeof downloadUrl !== "string") {
                return res.status(400).json({
                    error: "Nenurodytas failo adresas"
                });
            }

            const file = await downloadStitchFile(
                downloadUrl,
                "image"
            );

            return res.json({
                image:
                    `data:${file.mimeType};base64,` +
                    file.buffer.toString("base64")
            });
        } catch (error) {
            return res.status(502).json({
                error:
                    "Nepavyko atsisiųsti paveikslėlio",
                details: error.message
            });
        }
    }
);

// ========================================
// GET SAVED HTML
// ========================================

app.post(
    "/saved-html",
    authorize,
    async (req, res) => {
        try {
            const { screenId } =
            req.body ?? {};

            if (!safeId(screenId)) {
                return res.status(400).json({
                    error: "Netinkamas ekrano ID"
                });
            }

            const meta = await loadMeta(
                screenId
            );

            if (!meta.htmlFile) {
                return res.status(404).json({
                    error:
                        "Šiam ekranui HTML failas neišsaugotas"
                });
            }

            const html = await readFile(
                path.join(
                    DATA_DIR,
                    `${screenId}.html`
                ),
                "utf8"
            );

            return res.json({
                screenId,
                html
            });
        } catch (error) {
            return res.status(
                error.code === "ENOENT" ? 404 : 500
            ).json({
                error:
                    "Nepavyko nuskaityti HTML",
                details: error.message
            });
        }
    }
);


function makeRefinementPrompt(instruction) {
    return `
Redaguok ŠIAME Stitch projekte jau egzistuojančią svetainę.

Vartotojo prašymas:
${instruction.trim()}

Atlik tik vartotojo nurodytus pakeitimus.

Svarbu:
- Surask konkretų svetainės elementą, kurį vartotojas nori pakeisti.
- Jeigu nurodytas sekcijos pavadinimas ar tekstas, naudok jį elementui atpažinti.
- Išlaikyk visus kitus svetainės elementus ir jų turinį.
- Nepakeisk svetainės kalbos.
- Atnaujink patį svetainės dizainą, ne tik aprašyk pakeitimus.
`;
}


function getDomOperations(raw, screenId) {
    return (raw?.outputComponents ?? [])
        .filter(c =>
            c?.sessionEvent?.eventPayload?.payload_type ===
            "DomOperationEvent"
        )
        .filter(c =>
            String(c.sessionEvent.eventPayload.screen_id) ===
            String(screenId)
        )
        .flatMap(c =>
            c.sessionEvent.eventPayload.dom_operations ?? []
        );
}

function applyDomOperations(html, operations) {
    const $ = cheerio.load(html);

    for (const op of operations) {
        if (!op.selector || !op.action) {
            throw new Error("Nepilna DOM operacija");
        }

        const elements = $(op.selector);

        if (elements.length !== 1) {
            throw new Error(
                `Selektorius "${op.selector}" atitiko ` +
                `${elements.length} elementų (tikėtasi 1)`
            );
        }

        switch (op.action) {
            case "remove_class":
                if (!op.class_name) {
                    throw new Error("Nenurodyta šalinama klasė");
                }
                elements.removeClass(op.class_name);
                break;

            case "add_class":
                if (!op.class_name) {
                    throw new Error("Nenurodyta pridedama klasė");
                }
                elements.addClass(op.class_name);
                break;

            case "set_attribute":
                if (
                    !op.attr_name ||
                    !["class", "style", "title", "alt"].includes(
                        op.attr_name
                    ) ||
                    typeof op.attr_value !== "string"
                ) {
                    throw new Error("Neleistinas atributas");
                }

                elements.attr(op.attr_name, op.attr_value);
                break;

            case "remove_attribute":
                if (
                    !["class", "style", "title", "alt"].includes(
                        op.attr_name
                    )
                ) {
                    throw new Error("Neleistinas atributas");
                }
                elements.removeAttr(op.attr_name);
                break;


            case "set_text":
                if (typeof op.content !== "string") {
                    throw new Error("Nenurodytas tekstas");
                }

                elements.text(op.content);
                break;

            case "replace_element": {
                const replacementHtml =
                    typeof op.content === "string"
                        ? op.content
                        : typeof op.html === "string"
                            ? op.html
                            : typeof op.outer_html === "string"
                                ? op.outer_html
                                : null;

                if (!replacementHtml?.trim()) {
                    console.error(
                        "STITCH REPLACE ELEMENT OPERATION:",
                        op
                    );

                    throw new Error(
                        "Stitch replace_element operacija neturi HTML turinio"
                    );
                }

                elements.replaceWith(replacementHtml);
                break;
            }

            default:
                throw new Error(
                    `Nepalaikoma DOM operacija: ${op.action}`
                );

        }
    }

    return $.html();
}

app.post("/refine", authorize, async (req, res) => {
    const { projectId, screenId, instruction } = req.body ?? {};

    if (
        !safeId(projectId) ||
        !safeId(screenId) ||
        typeof instruction !== "string" ||
        !instruction.trim() ||
        instruction.length > 5000
    ) {
        return res.status(400).json({
            error: "Netinkami redagavimo duomenys"
        });
    }

    const releaseOperation = await acquireOperation();
    let client;

    try {
        const refinement = createRefinementClient();
        client = refinement.client;
        const stitchInstance = refinement.stitchInstance;
        const originalMeta = await loadMeta(screenId);

        if (
            String(originalMeta.projectId) !==
            String(projectId)
        ) {
            return res.status(400).json({
                error: "Projektas neatitinka ekrano"
            });
        }

        if (!originalMeta.htmlFile) {
            throw new Error("Originalus HTML neišsaugotas");
        }

        // A versija – originalus HTML.
        const originalHtml = await readFile(
            path.join(DATA_DIR, `${screenId}.html`),
            "utf8"
        );

        const project = stitchInstance.project(projectId);
        const screens = await project.screens();

        const originalScreen = screens.find(
            s => String(s.id) === String(screenId)
        );

        if (!originalScreen) {
            throw new Error("Stitch ekranas nerastas");
        }

        // Stitch grąžina DOM operacijas.
        const raw = await originalScreen.client.callTool(
            "generate_variants",
            {
                projectId,
                selectedScreenIds: [screenId],
                prompt: makeRefinementPrompt(instruction),
                variantOptions: { variantCount: 1 },
                deviceType: "DESKTOP"
            }
        );

        const operations = getDomOperations(raw, screenId);

        console.log("STITCH DOM OPERATIONS:", operations);

        if (operations.length === 0) {
            throw new Error(
                "Stitch negrąžino HTML redagavimo operacijų"
            );
        }

        // B versija – atskira HTML kopija.
        const editedHtml = applyDomOperations(
            originalHtml,
            operations
        );

        if (editedHtml === originalHtml) {
            throw new Error(
                "HTML pakeitimai nesukūrė naujos versijos"
            );
        }

        // Lokalus unikalus ID, o ne Stitch screen ID.
        const candidateId = crypto.randomUUID();

        const filename = `${candidateId}.html`;

        await writeFile(
            path.join(DATA_DIR, filename),
            editedHtml,
            "utf8"
        );

        const meta = {
            projectId,
            screenId: candidateId,
            sourceScreenId: screenId,
            screenType: "HTML_CANDIDATE",
            title: "AI redaguota versija",
            htmlUrl: null,
            screenshotUrl: null,
            htmlFile: filename,
            imageFile: null,
            errors: [],
            createdAt: new Date().toISOString()
        };

        await saveMeta(meta);

        console.log("AI CANDIDATE SAVED:", candidateId);

        return res.json({
            projectId,
            screenId: candidateId,
            html: null,
            image: null,
            hasSavedHtml: true,
            errors: []
        });

    } catch (error) {
        console.error("STITCH REFINE ERROR:", error);

        return res.status(502).json({
            error: "Nepavyko redaguoti svetainės",
            details: error.message
        });
    } finally {
        try {
            await client?.close();
        } catch (error) {
            console.warn(
                "Nepavyko uždaryti Stitch kliento:",
                error.message
            );
        }

        releaseOperation();
    }
});



// ========================================
// START SERVER
// ========================================

const server = app.listen(
    PORT,
    "127.0.0.1",
    () => {
        console.log(
            `Stitch service: http://127.0.0.1:${PORT}`
        );
    }
);

server.setTimeout(0);