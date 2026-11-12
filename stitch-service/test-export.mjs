
import { stitch } from "@google/stitch-sdk";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ID = "12136909861867723488";
const OUTPUT_DIR = path.resolve("generated-results");

await mkdir(OUTPUT_DIR, { recursive: true });

const project = stitch.project(PROJECT_ID);
const screens = await project.screens();

console.log("Rasta ekranų:", screens.length);

async function downloadArtifact(url, type) {
    const parsed = new URL(url);

    const allowedHosts = [
        "stitch.googleapis.com",
        "lh3.googleusercontent.com",
        "contribution.usercontent.google.com"
    ];

    if (
        parsed.protocol !== "https:" ||
        !allowedHosts.includes(parsed.hostname)
    ) {
        throw new Error("Nepalaikomas failo adresas");
    }

    const headers = {};

    if (parsed.hostname === "stitch.googleapis.com") {
        headers["x-goog-api-key"] =
            process.env.STITCH_API_KEY;
    }

    const response = await fetch(url, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
        throw new Error(
            `Atsisiuntimo klaida: HTTP ${response.status}`
        );
    }

    const contentType =
        response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const data = await response.json();

        if (type === "image" && data.dataString) {
            const mime = data.imageMetadata?.mimeType;

            if (!["png", "jpeg", "webp"].includes(mime)) {
                throw new Error("Nepalaikomas paveikslėlis");
            }

            return {
                bytes: Buffer.from(data.dataString, "base64"),
                extension: mime
            };
        }

        if (type === "html") {
            const html =
                typeof data.html === "string"
                    ? data.html
                    : typeof data.dataString === "string"
                        ? data.dataString
                        : null;

            if (html && /<(?:!doctype\s+html|html\b)/i.test(html)) {
                return {
                    bytes: Buffer.from(html, "utf8"),
                    extension: "html"
                };
            }
        }

        throw new Error(
            `JSON atsakyme nerasta ${type} turinio. ` +
            `Laukai: ${Object.keys(data).join(", ")}`
        );
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length > 30 * 1024 * 1024) {
        throw new Error("Failas per didelis");
    }

    if (type === "html") {
        if (!/<(?:!doctype\s+html|html\b)/i.test(
            bytes.toString("utf8")
        )) {
            throw new Error("Atsakymas nėra HTML");
        }

        return { bytes, extension: "html" };
    }

    const extension =
        bytes.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        ) ? "png" :
            bytes[0] === 255 &&
            bytes[1] === 216 ? "jpeg" :
                bytes.toString("ascii", 0, 4) === "RIFF" &&
                bytes.toString("ascii", 8, 12) === "WEBP"
                    ? "webp" : null;

    if (!extension) {
        throw new Error("Atsakymas nėra paveikslėlis");
    }

    return { bytes, extension };
}

let exported = false;

for (const screen of screens) {
    const id = screen.id;

    console.log("\nEKRANAS:", {
        id,
        title: screen.data?.title,
        type: screen.data?.screenType,
        hasHtmlCode: Boolean(screen.data?.htmlCode)
    });

    if (screen.data?.screenType === "IMAGE") {
        console.log("Praleidžiamas IMAGE ekranas");
        continue;
    }

    let htmlUrl;

    try {
        htmlUrl = await screen.getHtml();

        if (typeof htmlUrl !== "string" || !htmlUrl) {
            throw new Error("HTML adresas negautas");
        }
    } catch (error) {
        console.log("HTML nepasiekiamas:", error.message);
        continue;
    }

    try {
        const html = await downloadArtifact(htmlUrl, "html");

        await writeFile(
            path.join(OUTPUT_DIR, `${id}.html`),
            html.bytes
        );

        console.log("HTML IŠSAUGOTAS:", `${id}.html`);
    } catch (error) {
        console.log("HTML atsisiuntimo klaida:", error.message);
        continue;
    }

    const metadata = {
        projectId: PROJECT_ID,
        screenId: id,
        screenType: screen.data?.screenType ?? null,
        htmlUrl,
        screenshotUrl:
            screen.data?.screenshot?.downloadUrl ?? null,
        htmlFile: `${id}.html`,
        imageFile: null,
        errors: [],
        createdAt: new Date().toISOString()
    };

    try {
        const imageUrl = await screen.getImage();
        const image = await downloadArtifact(imageUrl, "image");

        metadata.imageFile = `${id}.${image.extension}`;

        await writeFile(
            path.join(OUTPUT_DIR, metadata.imageFile),
            image.bytes
        );

        console.log("PAVEIKSLĖLIS IŠSAUGOTAS:", metadata.imageFile);
    } catch (error) {
        metadata.errors.push(error.message);
        console.log("Paveikslėlio klaida:", error.message);
    }

    await writeFile(
        path.join(OUTPUT_DIR, `${id}.json`),
        JSON.stringify(metadata, null, 2),
        "utf8"
    );

    console.log("JSON IŠSAUGOTAS:", `${id}.json`);

    exported = true;
    break;
}

if (!exported) {
    console.log(
        "\nNepavyko rasti ir atsisiųsti svetainės HTML."
    );
}
