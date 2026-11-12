
const downloadUrl = process.env.STITCH_HTML_URL;
const apiKey = process.env.STITCH_API_KEY;

if (!downloadUrl || !apiKey) {
    throw new Error("Trūksta STITCH_HTML_URL arba STITCH_API_KEY");
}

const url = new URL(downloadUrl);

if (
    url.protocol !== "https:" ||
    url.hostname !== "stitch.googleapis.com" ||
    !/^\/v1\/projects\/[^/]+\/files\/[^/]+:download$/.test(url.pathname)
) {
    throw new Error("Netinkamas Stitch failo adresas");
}

const response = await fetch(url, {
    headers: {
        "X-Goog-Api-Key": apiKey
    }
});

console.log("HTTP STATUS:", response.status);
console.log("CONTENT TYPE:", response.headers.get("content-type"));

if (!response.ok) {
    console.log("ERROR:", (await response.text()).slice(0, 1000));
} else {
    const content = await response.text();
    const file = JSON.parse(content);

    console.log("RESPONSE FIELDS:", Object.keys(file));
    console.log("IMAGE MIME TYPE:", file.imageMetadata?.mimeType ?? null);
    console.log("HAS HTML:", typeof file.html === "string");

    console.log("FILE LENGTH:", content.length);
    console.log("FILE START:", content.slice(0, 150));
}
