const crypto = require("crypto");

exports.handler = async function (event, context) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  const token = crypto.randomBytes(16).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 2400;

  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      expire,
      signature,
    }),
  };
};
