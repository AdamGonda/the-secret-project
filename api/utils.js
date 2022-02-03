const crypto = require("crypto");

function getHash(secret) {
  return crypto.createHash("md5").update(secret).digest("hex").slice(0, 5)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

exports.getHash = getHash
exports.sleep = sleep