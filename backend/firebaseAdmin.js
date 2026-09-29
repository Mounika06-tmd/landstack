const {
  initializeApp,
  applicationDefault,
  cert
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.FIREBASE_PROJECT_ID || "landstack-66e54";

let credential;

// Use Render environment variables when deployed
if (
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  credential = cert({
    projectId: projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  });
} else {
  // Keep the existing local setup working
  credential = applicationDefault();
}

const firebaseAdminApp = initializeApp({
  credential,
  projectId
});

const adminAuth = getAuth(firebaseAdminApp);

module.exports = { adminAuth };