const {
  initializeApp,
  applicationDefault,
  cert
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.FIREBASE_PROJECT_ID || "landstack-66e54";

let credential;

if (
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Handle escaped newlines from Render
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Remove accidental surrounding quotes
  privateKey = privateKey.replace(/^"(.*)"$/s, "$1");

  credential = cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey
  });
} else {
  credential = applicationDefault();
}

const firebaseAdminApp = initializeApp({
  credential,
  projectId
});

const adminAuth = getAuth(firebaseAdminApp);

module.exports = { adminAuth };