// netlify/functions/imagekit-upload.js
const ImageKit = require("imagekit");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { fileBase64, fileName } = JSON.parse(event.body || "{}");
    if (!fileBase64 || !fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fileBase64 or fileName" }),
      };
    }

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    const res = await imagekit.upload({
      file: fileBase64,          // base64 فقط (بدون data:...)
      fileName: fileName,
      folder: "/bna-images",
      useUniqueFileName: true,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: res.url }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Upload failed", details: String(e) }),
    };
  }
};
