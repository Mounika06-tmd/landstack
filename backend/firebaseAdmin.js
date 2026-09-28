const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const firebaseAdminApp = initializeApp({
    credential: applicationDefault(),
    projectId: "landstack-66e54"
});

const adminAuth = getAuth(firebaseAdminApp);

module.exports = { adminAuth };