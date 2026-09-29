import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    reload,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// ==================================================
// LANDSTACK CONFIGURATION
// ==================================================

const SERVER_URL =
    "https://landstack-backend.onrender.com";

const DEMO_LAND_OWNER_OTP =
    "613824";


// ==================================================
// FIREBASE CONFIGURATION
// ==================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDgJIkT8GhmXI5UeOg0CsaQcCRPGjM4dL0",

    authDomain:
        "landstack-66e54.firebaseapp.com",

    projectId:
        "landstack-66e54",

    storageBucket:
        "landstack-66e54.firebasestorage.app",

    messagingSenderId:
        "526545029641",

    appId:
        "1:526545029641:web:0e0fb60f5e177d93b6c6d8"

};


// ==================================================
// INITIALIZE FIREBASE
// ==================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);


// ==================================================
// KEEP USER SIGNED IN
// ==================================================

setPersistence(
    auth,
    browserLocalPersistence
).catch(
    function (error) {

        console.error(
            "Firebase persistence error:",
            error
        );

    }
);


// ==================================================
// PAGE ELEMENTS
// ==================================================


const authBox =
    document.getElementById("authBox");

const viewSelection =
    document.getElementById("viewSelection");

const citizenView =
    document.getElementById("citizenView");

const officerView =
    document.getElementById("officerView");

const officerKeyBox =
    document.getElementById("officerKeyBox");

/*
 * Homepage reference
 *
 * IMPORTANT:
 * Keep the homepage hidden after successful login so
 * Citizen / Officer views do not appear to return to
 * the homepage.
 */
const landStackHome =
    document.getElementById("landStackHome");




// ==================================================
// AUTHENTICATION VARIABLES
// ==================================================

let verificationWatcher = null;

let citizenDetailedAccessGranted =
    false;

let selectedCitizenParcel =
    null;


// ==================================================
// OFFICER VARIABLES
// ==================================================

let activeOfficerKey =
    sessionStorage.getItem(
        "landstackOfficerKey"
    ) || null;

let officerMap =
    null;

let officerParcelLayer =
    null;

let officerParcelData =
    null;

let selectedOfficerParcelLayer =
    null;

let selectedOfficerParcel =
    null;


// ==================================================
// SAFE ELEMENT HELPERS
// ==================================================

function getElement(id) {

    return document.getElementById(id);

}


// ==================================================
// DISPLAY VALUE
// ==================================================

function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Not available";

    }

    return String(value);

}


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHtml(value) {

    return displayValue(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==================================================
// OFFICIAL PORTAL STYLE
// ==================================================

function injectOfficialPortalStyles() {

    if (
        document.getElementById(
            "landstackOfficialPortalStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "landstackOfficialPortalStyles";


    style.textContent = `

   :root {
    --landstack-navy: #126b3a;
    --landstack-blue: #2f8a5b;
    --landstack-blue-dark: #084d2b;
    --landstack-border: #cbded3;
    --landstack-bg: #f5f8f5;
    --landstack-surface: #ffffff;
    --landstack-text: #24352d;
    --landstack-muted: #5f7067;
    --landstack-green: #126b3a;
    --landstack-red: #8b3a3a;
    --landstack-gold: #d49a22;
}


        body {
            background: var(--landstack-bg);
            color: var(--landstack-text);
        }


        button { border: 1px solid var(--landstack-green-dark); background: var(--landstack-green); color: #fff; border-radius: 6px; padding: 9px 16px; font-weight: 600; cursor: pointer; box-shadow:none; }


        button:hover { background: var(--landstack-green-dark); }


        input,
        select,
        textarea {
            border: 1px solid var(--landstack-border);
            border-radius: 4px;
            background: #ffffff;
            color: var(--landstack-text);
            padding: 9px 10px;
            box-sizing: border-box;
        }


        input:focus,select:focus,textarea:focus { outline:2px solid rgba(11,122,75,.18); border-color:var(--landstack-green); }

       h1,h2,h3,h4 { color:var(--landstack-green-dark); }


        .landstack-official-card {
            background: var(--landstack-surface);
            border: 1px solid var(--landstack-border);
            border-radius: 5px;
            box-shadow: 0 2px 7px rgba(24, 44, 61, 0.07);
        }


        .landstack-official-section { border-top:4px solid var(--landstack-green); }


        .landstack-status-pill {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 3px;
            border: 1px solid var(--landstack-border);
            background: #eef2f5;
            font-size: 13px;
            font-weight: 700;
        }


        .landstack-muted {
            color: var(--landstack-muted);
        }


        .landstack-edit-panel { margin-top:18px; padding:18px; border:1px solid var(--landstack-border); border-top:4px solid var(--landstack-green); background:#f4faf6; border-radius:6px; }


        .landstack-edit-grid {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(190px, 1fr));
            gap: 12px;
        }


        .landstack-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }


        .landstack-field label {
            font-size: 13px;
            font-weight: 700;
            color: var(--landstack-navy);
        }


        .landstack-field select,
        .landstack-field input {
            width: 100%;
        }


        .landstack-button-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 14px;
        }


        .landstack-secondary-button {
            background: #ffffff;
            color: var(--landstack-navy);
            border-color: var(--landstack-blue-dark);
        }


        .landstack-secondary-button:hover {
            background: #edf2f6;
        }


        .landstack-danger-button {
            background: #7e3434;
            border-color: #682b2b;
        }


        .landstack-queue-item:hover {
            background: #f5f8fa;
        }


        #landstackOfficerDashboardSummary {
            margin-top: 20px;
        }


        .ls-dashboard-summary-title {
            margin: 0 0 6px 0;
            color: var(--landstack-navy);
            font-size: 21px;
        }


        .ls-dashboard-summary-subtitle {
            margin: 0 0 18px 0;
            color: var(--landstack-muted);
            font-size: 13px;
        }


        .ls-summary-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 14px;
        }


        .ls-summary-card {
            position: relative;
            padding: 17px;
            min-height: 118px;
            box-sizing: border-box;
            border: 1px solid var(--landstack-border);
            border-top:4px solid var(--landstack-green);
            border-radius: 5px;
            background: #ffffff;
            box-shadow:
                0 2px 7px rgba(24, 44, 61, 0.07);
            cursor: pointer;
            transition:
                background 0.15s ease,
                border-color 0.15s ease;
        }


        .ls-summary-card:hover {
            background: #f7fafc;
            border-color: #aab8c4;
        }


        .ls-summary-card-disabled {
            cursor: default;
            opacity: 0.92;
        }


        .ls-summary-card-disabled:hover {
            background: #ffffff;
            border-color: var(--landstack-border);
        }


        .ls-summary-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--landstack-muted);
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }


        .ls-summary-count {
            margin-top: 10px;
            font-size: 30px;
            line-height: 1;
            font-weight: 700;
            color: var(--landstack-navy);
        }


        .ls-summary-action {
            margin-top: 10px;
            font-size: 12px;
            color: var(--landstack-blue-dark);
        }


        .ls-dashboard-queue {
            margin-top: 20px;
            padding: 18px;
            border: 1px solid var(--landstack-border);
            border-top: 4px solid var(--landstack-navy);
            border-radius: 5px;
            background: #ffffff;
            box-shadow:
                0 2px 7px rgba(24, 44, 61, 0.07);
        }


        .ls-dashboard-queue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }


        .ls-dashboard-queue-title {
            margin: 0;
            color: var(--landstack-navy);
            font-size: 18px;
        }


        .ls-dashboard-queue-subtitle {
            margin: 3px 0 0 0;
            color: var(--landstack-muted);
            font-size: 12px;
        }


        .ls-dashboard-queue-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            padding: 12px 13px;
            margin-bottom: 8px;
            border: 1px solid #dbe2e8;
            border-radius: 4px;
            background: #fbfcfd;
            cursor: pointer;
        }


        .ls-dashboard-queue-item:last-child {
            margin-bottom: 0;
        }


        .ls-dashboard-queue-item:hover {
            background: #f4f8fa;
        }


        .ls-dashboard-parcel-reference {
            color: var(--landstack-navy);
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
        }


        .ls-dashboard-queue-note {
            color: var(--landstack-muted);
            font-size: 12px;
        }


        @media (max-width: 1100px) {

            .ls-summary-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 700px) {

            .landstack-edit-grid {
                grid-template-columns: 1fr;
            }


            .ls-summary-grid {
                grid-template-columns: 1fr;
            }


            .ls-dashboard-queue-item {
                display: block;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}

injectOfficialPortalStyles();


// ==================================================
// COMPLETE AUTHENTICATED USER
// ==================================================

async function completeAuthenticatedUser(
    user,
    fullName,
    message
) {

    try {

        const idToken =
            await user.getIdToken(true);


        const authResponse =
            await fetch(
                `${SERVER_URL}/auth-test`,
                {

                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${idToken}`
                    }

                }
            );


        const authData =
            await authResponse.json();


        if (!authResponse.ok) {

            throw new Error(
                authData.message ||
                "Backend authentication failed."
            );

        }


        const syncResponse =
            await fetch(
                `${SERVER_URL}/users/sync`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${idToken}`

                    },

                    body: JSON.stringify({

                        fullName:
                            fullName || ""

                    })

                }
            );


        const syncData =
            await syncResponse.json();


        if (!syncResponse.ok) {

            throw new Error(
                syncData.message ||
                "User synchronization failed."
            );

        }


        if (verificationWatcher) {

            clearInterval(
                verificationWatcher
            );

            verificationWatcher =
                null;

        }


        localStorage.removeItem(
            "landstackPendingFullName"
        );


        if (message) {

            message.textContent =
                "Login successful!";

        }


        console.log(
            "Firebase authentication:",
            authData
        );


        console.log(
            "PostgreSQL user:",
            syncData.user
        );


        
if (authBox) {
    authBox.style.display =
        "none";
}

if (loginModal) {
    loginModal.style.display =
        "none";
}

if (registerModal) {
    registerModal.style.display =
        "none";
}

/*
 * Hide homepage after successful authentication.
 * The user must choose Citizen or Officer view.
 */
if (landStackHome) {
    landStackHome.style.display =
        "none";
}

/*
 * Show role-selection screen.
 */
if (viewSelection) {
    viewSelection.style.display =
        "flex";
}

if (citizenView) {
    citizenView.style.display =
        "none";
}

if (officerView) {
    officerView.style.display =
        "none";
}

if (officerKeyBox) {
    officerKeyBox.style.display =
        "none";
}

console.log(
    "View selection element:",
    viewSelection
);



if (citizenView) {

    citizenView.style.display =
        "none";

}

if (officerView) {

    officerView.style.display =
        "none";

}

if (officerKeyBox) {

    officerKeyBox.style.display =
        "none";

}
console.log(
    "View selection element:",
    viewSelection
);

        if (citizenView) {

            citizenView.style.display =
                "none";

        }


        if (officerView) {

            officerView.style.display =
                "none";

        }


        if (officerKeyBox) {

            officerKeyBox.style.display =
                "none";

        }

    } catch (error) {

        console.error(
            "Authentication completion error:",
            error
        );


        if (message) {

            message.textContent =
                error.message;

        }

    }

}


// ==================================================
// CHECK EMAIL VERIFICATION
// ==================================================

async function checkEmailVerification() {

    const user =
        auth.currentUser;


    if (!user) {

        return;

    }


    try {

        await reload(user);


        if (!user.emailVerified) {

            return;

        }


        const fullName =
            localStorage.getItem(
                "landstackPendingFullName"
            ) || "";


        const message =
            getElement(
                "registerMessage"
            );


        await completeAuthenticatedUser(
            user,
            fullName,
            message
        );

    } catch (error) {

        console.error(
            "Verification check error:",
            error
        );

    }

}


// ==================================================
// REGISTER
// ==================================================

const registerBtn =
    getElement("registerBtn");


if (registerBtn) {

    registerBtn.addEventListener(
        "click",
        async function () {

            const fullName =
                displayValue(
                    getElement("fullName")?.value
                ).trim();


            const email =
                displayValue(
                    getElement("registerEmail")?.value
                ).trim();


            const password =
                displayValue(
                    getElement("registerPassword")?.value
                );


            const message =
                getElement(
                    "registerMessage"
                );


            if (
                !fullName ||
                !email ||
                !password
            ) {

                if (message) {

                    message.textContent =
                        "Please fill all fields.";

                }

                return;

            }


            if (
                password.length < 6
            ) {

                if (message) {

                    message.textContent =
                        "Password must contain at least 6 characters.";

                }

                return;

            }


            try {

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                localStorage.setItem(
                    "landstackPendingFullName",
                    fullName
                );


                await sendEmailVerification(
                    user
                );


                message.innerHTML = `

    <strong>
        Account created successfully.
    </strong>

    <br><br>

    Please check your email and click the
    verification link to verify your account.

    <br><br>

    <span style="color:#65727e;">
        If you do not receive the verification email,
        please check your
        <strong>Spam / Junk</strong> folder.
    </span>

    <br><br>

    After verification, LandStack will continue
    automatically.
`;


                if (verificationWatcher) {

                    clearInterval(
                        verificationWatcher
                    );

                }


                verificationWatcher =
                    setInterval(
                        checkEmailVerification,
                        3000
                    );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message;

                }

            }

        }
    );

}


// ==================================================
// RESTORE VERIFIED REGISTRATION
// ==================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            return;

        }


        const pendingFullName =
            localStorage.getItem(
                "landstackPendingFullName"
            );


        if (!pendingFullName) {

            return;

        }


        try {

            await reload(user);


            if (!user.emailVerified) {

                return;

            }


            const message =
                getElement(
                    "registerMessage"
                );


            await completeAuthenticatedUser(
                user,
                pendingFullName,
                message
            );

        } catch (error) {

            console.error(
                "Automatic authentication error:",
                error
            );

        }

    }
);


// ==================================================
// LOGIN
// ==================================================

const loginBtn =
    getElement("loginBtn");


if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        async function () {

            const email =
                displayValue(
                    getElement("loginEmail")?.value
                ).trim();


            const password =
                displayValue(
                    getElement("loginPassword")?.value
                );


            const message =
                getElement(
                    "loginMessage"
                );


            if (
                !email ||
                !password
            ) {

                if (message) {

                    message.textContent =
                        "Please enter email and password.";

                }

                return;

            }


            try {

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                await reload(user);


                if (!user.emailVerified) {

                    if (message) {

                        message.textContent =
                            "Please verify your email before logging in.";

                    }

                    return;

                }


                await completeAuthenticatedUser(
                    user,
                    "",
                    message
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message;

                }

            }

        }
    );

}


// ==================================================
// CITIZEN VIEW
// ==================================================

const citizenViewBtn =
    getElement("citizenViewBtn");


if (citizenViewBtn) {

    citizenViewBtn.addEventListener(
        "click",
        async function () {

            try {

                const user =
                    auth.currentUser;


                if (!user) {

                    throw new Error(
                        "Please login again."
                    );

                }


                const idToken =
                    await user.getIdToken(true);


                const response =
                    await fetch(
                        `${SERVER_URL}/view-access`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${idToken}`

                            },

                            body: JSON.stringify({

                                viewType:
                                    "citizen"

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not open Citizen View."
                    );

                }
                console.log(
    "Citizen View access successful. Firebase user:",
    auth.currentUser
);


                if (viewSelection) {

                    viewSelection.style.display =
                        "none";

                }


                if (citizenView) {

    citizenView.style.display =
        "block";

    console.log(
        "Citizen View element displayed."
    );

}


if (officerView) {

    officerView.style.display =
        "none";

}


console.log(
    "About to load Citizen parcel map..."
);


await loadParcelMap();


console.log(
    "Citizen parcel map loaded."
);


                if (landMap) {

                    setTimeout(
                        function () {

                            landMap.invalidateSize();

                        },
                        100
                    );

                }


            } catch (error) {

                console.error(
                    "Citizen view error:",
                    error
                );


                alert(
                    error.message
                );

            }

        }
    );

}


// ==================================================
// OFFICER VIEW BUTTON
// ==================================================

const officerViewBtn =
    getElement("officerViewBtn");


if (officerViewBtn) {

    officerViewBtn.addEventListener(
        "click",
        function () {

            if (officerKeyBox) {

                officerKeyBox.style.display =
                    "block";

            }


            getElement(
                "officerKey"
            )?.focus();

        }
    );

}


// ==================================================
// OFFICER ACCESS
// ==================================================

const officerAccessBtn =
    getElement("officerAccessBtn");


if (officerAccessBtn) {

    officerAccessBtn.addEventListener(
        "click",
        async function () {

            const officerKey =
                displayValue(
                    getElement(
                        "officerKey"
                    )?.value
                ).trim();


            const message =
                getElement(
                    "officerMessage"
                );


            if (!/^\d{6}$/.test(officerKey)) {

                if (message) {

                    message.textContent =
                        "Officer passkey must contain exactly 6 numbers.";

                }

                return;

            }


            try {

                const user =
                    auth.currentUser;


                if (!user) {

                    throw new Error(
                        "Please login again."
                    );

                }


                const idToken =
                    await user.getIdToken(true);


                const response =
                    await fetch(
                        `${SERVER_URL}/officer/access`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${idToken}`

                            },

                            body: JSON.stringify({

                                officerKey:
                                    officerKey

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Officer access denied."
                    );

                }


                activeOfficerKey =
                    officerKey;


                sessionStorage.setItem(
                    "landstackOfficerKey",
                    officerKey
                );


                if (message) {

                    message.textContent =
                        "Officer access granted.";

                }


                if (viewSelection) {

                    viewSelection.style.display =
                        "none";

                }


                if (citizenView) {

                    citizenView.style.display =
                        "none";

                }


                if (officerView) {

                    officerView.style.display =
                        "block";

                }


                if (officerKeyBox) {

                    officerKeyBox.style.display =
                        "none";

                }


                const keyInput =
                    getElement(
                        "officerKey"
                    );


                if (keyInput) {

                    keyInput.value =
                        "";

                }


                hideOfficerSections();


                if (officerDashboard) {

                    officerDashboard.style.display =
                        "block";

                }


                await loadOfficerParcelMap();

                await loadOfficerDashboardSummary();


            } catch (error) {

                console.error(
                    "Officer access error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message;

                }

            }

        }
    );

}


// ==================================================
// BACK TO VIEW SELECTION
// ==================================================

const citizenBackBtn =
    getElement("citizenBackBtn");


if (citizenBackBtn) {

    citizenBackBtn.addEventListener(
        "click",
        function () {

            if (citizenView) {

                citizenView.style.display =
                    "none";

            }


            if (officerView) {

                officerView.style.display =
                    "none";

            }


            if (viewSelection) {

                viewSelection.style.display =
                    "block";

            }


            if (officerKeyBox) {

                officerKeyBox.style.display =
                    "none";

            }


            resetMapView();

        }
    );

}


const officerBackBtn =
    getElement("officerBackBtn");


if (officerBackBtn) {

    officerBackBtn.addEventListener(
        "click",
        function () {

            if (citizenView) {

                citizenView.style.display =
                    "none";

            }


            if (officerView) {

                officerView.style.display =
                    "none";

            }


            if (viewSelection) {

                viewSelection.style.display =
                    "block";

            }


            if (officerKeyBox) {

                officerKeyBox.style.display =
                    "none";

            }


            activeOfficerKey =
                null;


            sessionStorage.removeItem(
                "landstackOfficerKey"
            );


            selectedOfficerParcel =
                null;


            selectedOfficerParcelLayer =
                null;

        }
    );

}


// ==================================================
// CITIZEN GIS VARIABLES
// ==================================================

let landMap =
    null;

let parcelLayer =
    null;

let parcelData =
    null;

let selectedParcelLayer =
    null;


// ==================================================
// LOAD CITIZEN PARCEL MAP
// ==================================================

async function loadParcelMap() {

    try {

        if (!landMap) {

            landMap =
                L.map(
                    "map"
                ).setView(
                    [16.85, 81.38],
                    14
                );


            L.control.zoom({
                position:
                    "topright"
            }).addTo(
                landMap
            );


            L.control.scale({
                position:
                    "bottomleft",
                metric:
                    true,
                imperial:
                    false
            }).addTo(
                landMap
            );


            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            ).addTo(
                landMap
            );

        }


        const response =
            await fetch(
                `${SERVER_URL}/api/parcels`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load parcel data from backend."
            );

        }


        const data =
            await response.json();


        if (
            !data.features
        ) {

            throw new Error(
                "Invalid parcel data received from backend."
            );

        }


        parcelData =
            data;


        const parcelCount =
            getElement(
                "parcelCount"
            );


        if (parcelCount) {

            parcelCount.textContent =
                data.count ??
                data.features.length;

        }


        if (parcelLayer) {

            landMap.removeLayer(
                parcelLayer
            );

        }


        parcelLayer =
            L.geoJSON(
                data,
                {

                    style:
                        function () {

                            return {

                                color:
                                    "#31495b",

                                weight:
                                    1,

                                fillColor:
                                    "#d9e7ef",

                                fillOpacity:
                                    0.55

                            };

                        },


                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {
                            const lpNumber =
    feature.properties?.Lp_number ??
    feature.properties?.lp_number ??
    feature.properties?.LP_Number ??
    "";

if (lpNumber !== "") {

    layer.bindTooltip(
        String(lpNumber),
        {
            permanent: true,
            direction: "center",
            className: "parcel-number-label"
        }
    );

}

                            layer.on(
                                "click",
                                function () {

                                    selectParcel(
                                        feature.properties,
                                        layer
                                    );

                                }
                            );


                            layer.on(
                                "mouseover",
                                function () {

                                    if (
                                        selectedParcelLayer !==
                                        layer
                                    ) {

                                        layer.setStyle({

                                            weight:
                                                3,

                                            fillColor:
                                                "#b7d0df",

                                            fillOpacity:
                                                0.70

                                        });

                                    }

                                }
                            );


                            layer.on(
                                "mouseout",
                                function () {

                                    if (
                                        selectedParcelLayer !==
                                        layer
                                    ) {

                                        parcelLayer.resetStyle(
                                            layer
                                        );

                                    }

                                }
                            );

                        }

                }
            ).addTo(
                landMap
            );


        const bounds =
            parcelLayer.getBounds();


        if (
            bounds.isValid()
        ) {

            landMap.fitBounds(
                bounds,
                {
                    padding:
                        [20, 20]
                }
            );

        }


        updateMapSelectionStatus(
            "No parcel selected"
        );


    } catch (error) {

        console.error(
            "GIS map loading error:",
            error
        );

    }

}


// ==================================================
// SELECT CITIZEN PARCEL
// ==================================================

function selectParcel(
    parcel,
    layer
) {

    if (
        selectedParcelLayer &&
        selectedParcelLayer !== layer &&
        parcelLayer
    ) {

        parcelLayer.resetStyle(
            selectedParcelLayer
        );

    }


    selectedParcelLayer =
        layer;


    selectedCitizenParcel =
        parcel;


    citizenDetailedAccessGranted =
        false;


    const detailedInfo =
        getElement(
            "citizenDetailedParcelInfo"
        );


    const otpBox =
        getElement(
            "myLandOtpBox"
        );


    const otpInput =
        getElement(
            "myLandOtp"
        );


    const otpMessage =
        getElement(
            "myLandOtpMessage"
        );


    if (detailedInfo) {

        detailedInfo.style.display =
            "none";

        detailedInfo.innerHTML =
            "";

    }


    if (otpBox) {

        otpBox.style.display =
            "block";

    }


    if (otpInput) {

        otpInput.value =
            "";

    }


    if (otpMessage) {

        otpMessage.textContent =
            "Parcel selected. Enter the OTP to unlock My Land Details.";

    }


    layer.setStyle({

        weight:
            4,

        color:
            "#123b5d",

        fillColor:
            "#9dbed1",

        fillOpacity:
            0.78

    });


    if (
        typeof layer.bringToFront ===
        "function"
    ) {

        layer.bringToFront();

    }


    showParcelInformation(
        parcel
    );


    updateMapSelectionStatus(
        "Selected: " +
        displayParcelReference(
            parcel
        )
    );


    if (
        landMap
    ) {

        landMap.invalidateSize();


        const bounds =
            layer.getBounds();


        if (
            bounds.isValid()
        ) {

            landMap.fitBounds(
                bounds,
                {
                    padding:
                        [40, 40],
                    maxZoom:
                        18
                }
            );

        }

    }

}


// ==================================================
// DISPLAY PARCEL REFERENCE
// ==================================================

function displayParcelReference(
    parcel
) {

    if (
        parcel?.lp_number !==
            null &&
        parcel?.lp_number !==
            undefined &&
        String(
            parcel.lp_number
        ).trim() !== "" &&
        String(
            parcel.lp_number
        ) !== "0"
    ) {

        return (
            "LP " +
            parcel.lp_number
        );

    }


    if (
        parcel?.survey_number
    ) {

        return (
            "Survey " +
            parcel.survey_number
        );

    }


    return (
        parcel?.parcel_id ||
        "Parcel"
    );

}


// ==================================================
// MAP STATUS
// ==================================================

function updateMapSelectionStatus(
    message
) {

    const status =
        getElement(
            "mapSelectionStatus"
        );


    if (status) {

        status.textContent =
            message;

    }

}


// ==================================================
// CITIZEN PUBLIC PARCEL INFORMATION
// ==================================================

function showParcelInformation(
    parcel
) {

    const parcelInfo =
        getElement(
            "parcelInfo"
        );


    if (!parcelInfo) {

        return;

    }


    const publicStatus =
        parcel.citizen_status ||
        "Not Assessed";


    const disputeIndicator =
        parcel.dispute_indicator ||
        "No";


    const encumbranceIndicator =
        parcel.encumbrance_indicator ||
        "No";


    const verificationClass =
        "landstack-status-pill";


    parcelInfo.innerHTML = `

        <div class="landstack-official-section">

            <h3>
                Parcel Information
            </h3>

            <p>
                <strong>Parcel ID:</strong>
                ${escapeHtml(parcel.parcel_id)}
            </p>

            <p>
                <strong>LP Number:</strong>
                ${escapeHtml(parcel.lp_number)}
            </p>

            <p>
                <strong>Survey Number:</strong>
                ${escapeHtml(parcel.survey_number)}
            </p>

            <p>
                <strong>Subdivision:</strong>
                ${escapeHtml(parcel.subdivision_number)}
            </p>

            <p>
                <strong>ULPIN:</strong>
                ${escapeHtml(parcel.ulpin)}
            </p>

            <p>
                <strong>Area:</strong>
                ${escapeHtml(parcel.area_sq_yards)}
                sq. yd.
            </p>

            <p>
                <strong>Village:</strong>
                ${escapeHtml(parcel.village)}
            </p>

            <p>
                <strong>Mandal:</strong>
                ${escapeHtml(parcel.mandal)}
            </p>

            <p>
                <strong>District:</strong>
                ${escapeHtml(parcel.district)}
            </p>

            <p>
                <strong>Land Use:</strong>
                ${escapeHtml(
                    parcel.land_use
                )}
            </p>

            <hr>

            <h4>
                Public Record Indicators
            </h4>

            <p>
                <strong>Record Status:</strong>
                <span class="${verificationClass}">
                    ${escapeHtml(publicStatus)}
                </span>
            </p>

            <p>
                <strong>Active Dispute Indicator:</strong>
                ${escapeHtml(disputeIndicator)}
            </p>

            <p>
                <strong>Encumbrance Indicator:</strong>
                ${escapeHtml(encumbranceIndicator)}
            </p>

            <p>
                <strong>Planning Status:</strong>
                ${escapeHtml(
                    parcel.planning_status
                )}
            </p>

            <p class="landstack-muted">
                Detailed ownership, transaction and tax
                information requires protected access.
            </p>

        </div>

    `;

}


// ==================================================
// CLEAR CITIZEN PARCEL SELECTION
// ==================================================

function clearParcelSelection() {

    if (
        selectedParcelLayer &&
        parcelLayer
    ) {

        parcelLayer.resetStyle(
            selectedParcelLayer
        );

    }


    selectedParcelLayer =
        null;


    selectedCitizenParcel =
        null;


    citizenDetailedAccessGranted =
        false;


    const lpInput =
        getElement(
            "lpSearch"
        );


    const surveyInput =
        getElement(
            "surveySearch"
        );


    const ulpinInput =
        getElement(
            "ulpinSearch"
        );


    if (lpInput) {

        lpInput.value =
            "";

    }


    if (surveyInput) {

        surveyInput.value =
            "";

    }


    if (ulpinInput) {

        ulpinInput.value =
            "";

    }


    updateMapSelectionStatus(
        "No parcel selected"
    );


    const parcelInfo =
        getElement(
            "parcelInfo"
        );


    if (parcelInfo) {

        parcelInfo.innerHTML = `

            <h3>
                Parcel Information
            </h3>

            <p>
                Click a parcel on the map
                to view its public information.
            </p>

        `;

    }


    const detailedInfo =
        getElement(
            "citizenDetailedParcelInfo"
        );


    if (detailedInfo) {

        detailedInfo.style.display =
            "none";

        detailedInfo.innerHTML =
            "";

    }


    const otpBox =
        getElement(
            "myLandOtpBox"
        );


    


    const otpInput =
        getElement(
            "myLandOtp"
        );


    if (otpInput) {

        otpInput.value =
            "";

    }


    const otpMessage =
        getElement(
            "myLandOtpMessage"
        );


    if (otpMessage) {

        otpMessage.textContent =
            "Please select a parcel and enter the OTP.";

    }

}


// ==================================================
// RESET MAP
// ==================================================

function resetMapView() {

    if (
        landMap &&
        parcelLayer
    ) {

        const bounds =
            parcelLayer.getBounds();


        if (
            bounds.isValid()
        ) {

            landMap.fitBounds(
                bounds,
                {
                    padding:
                        [20, 20]
                }
            );

        }

    }


    clearParcelSelection();

}


// ==================================================
// CITIZEN SEARCH
// ==================================================

function normalizeSearchValue(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(/\.0+$/, "");

}


function searchParcel() {

    if (
        !parcelData ||
        !parcelLayer
    ) {

        alert(
            "Parcel data is still loading. Please wait."
        );

        return;

    }


    const lpInput =
        getElement(
            "lpSearch"
        );


    const surveyInput =
        getElement(
            "surveySearch"
        );


    const ulpinInput =
        getElement(
            "ulpinSearch"
        );


    const lpValue =
        normalizeSearchValue(
            lpInput?.value
        );


    const surveyValue =
        normalizeSearchValue(
            surveyInput?.value
        );


    const ulpinValue =
        normalizeSearchValue(
            ulpinInput?.value
        );


    if (
        !lpValue &&
        !surveyValue &&
        !ulpinValue
    ) {

        alert(
            "Enter an LP Number, Survey Number or ULPIN."
        );

        return;

    }


    const matchingFeature =
        parcelData.features.find(
            function (feature) {

                const properties =
                    feature.properties ||
                    {};


                const featureLP =
                    normalizeSearchValue(
                        properties.lp_number
                    );


                const featureSurvey =
                    normalizeSearchValue(
                        properties.survey_number
                    );


                const featureULPIN =
                    normalizeSearchValue(
                        properties.ulpin ||
                        properties.lp_number
                    );


                return (

                    (
                        lpValue &&
                        featureLP ===
                            lpValue
                    )

                    ||

                    (
                        surveyValue &&
                        featureSurvey ===
                            surveyValue
                    )

                    ||

                    (
                        ulpinValue &&
                        featureULPIN ===
                            ulpinValue
                    )

                );

            }
        );


    if (!matchingFeature) {

        alert(
            "No parcel found for the entered LP, Survey Number or ULPIN."
        );

        return;

    }


    let matchingLayer =
        null;


    parcelLayer.eachLayer(
        function (layer) {

            if (
                layer.feature ===
                matchingFeature
            ) {

                matchingLayer =
                    layer;

            }

        }
    );


    if (!matchingLayer) {

        alert(
            "Parcel found, but its map geometry could not be located."
        );

        return;

    }


    selectParcel(
        matchingFeature.properties,
        matchingLayer
    );

}


// ==================================================
// CITIZEN SEARCH BUTTON
// ==================================================

const searchParcelBtn =
    getElement(
        "searchParcelBtn"
    );


if (searchParcelBtn) {

    searchParcelBtn.addEventListener(
        "click",
        searchParcel
    );

}


// ==================================================
// CITIZEN SEARCH ENTER KEY
// ==================================================

[
    "lpSearch",
    "surveySearch",
    "ulpinSearch"
].forEach(
    function (id) {

        const input =
            getElement(id);


        if (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        searchParcel();

                    }

                }
            );

        }

    }
);


// ==================================================
// RESET CITIZEN DETAILED ACCESS
// ==================================================

function resetCitizenDetailedAccess() {

    citizenDetailedAccessGranted =
        false;


    const detailedInfo =
        getElement(
            "citizenDetailedParcelInfo"
        );


    const otpBox =
        getElement(
            "myLandOtpBox"
        );


    const otpInput =
        getElement(
            "myLandOtp"
        );


    const otpMessage =
        getElement(
            "myLandOtpMessage"
        );


    if (detailedInfo) {

        detailedInfo.style.display =
            "none";

        detailedInfo.innerHTML =
            "";

    }


    


    if (otpInput) {

        otpInput.value =
            "";

    }


    if (otpMessage) {

        otpMessage.textContent =
            "Please select a parcel and enter the OTP.";

    }

}


// ==================================================
// RESET SEARCH WHEN INPUT CHANGES
// ==================================================

[
    "lpSearch",
    "surveySearch",
    "ulpinSearch"
].forEach(
    function (id) {

        const input =
            getElement(id);


        if (!input) {

            return;

        }


        input.addEventListener(
            "input",
            function () {

                resetCitizenDetailedAccess();


                const lpValue =
                    getElement(
                        "lpSearch"
                    )?.value.trim() ||
                    "";


                const surveyValue =
                    getElement(
                        "surveySearch"
                    )?.value.trim() ||
                    "";


                const ulpinValue =
                    getElement(
                        "ulpinSearch"
                    )?.value.trim() ||
                    "";


                if (
                    !lpValue &&
                    !surveyValue &&
                    !ulpinValue
                ) {

                    clearParcelSelection();

                }

            }
        );

    }
);


// ==================================================
// MAP VIEW BUTTON
// ==================================================

const mapViewBtn =
    getElement(
        "mapViewBtn"
    );


if (mapViewBtn) {

    mapViewBtn.addEventListener(
        "click",
        resetMapView
    );

}


// ==================================================
// RESET MAP BUTTON
// ==================================================

const resetMapBtn =
    getElement(
        "resetMapBtn"
    );


if (resetMapBtn) {

    resetMapBtn.addEventListener(
        "click",
        resetMapView
    );

}


// ==================================================
// CLEAR SELECTION BUTTON
// ==================================================

const clearSelectionBtn =
    getElement(
        "clearSelectionBtn"
    );


if (clearSelectionBtn) {

    clearSelectionBtn.addEventListener(
        "click",
        clearParcelSelection
    );

}


// ==================================================
// TOOLBAR SEARCH BUTTON
// ==================================================

const toolbarSearchBtn =
    getElement(
        "toolbarSearchBtn"
    );


if (toolbarSearchBtn) {

    toolbarSearchBtn.addEventListener(
        "click",
        function () {

            const searchSection =
                getElement(
                    "parcelSearchSection"
                );


            if (searchSection) {

                searchSection.scrollIntoView({
                    behavior:
                        "smooth",
                    block:
                        "start"
                });

            }

        }
    );

}


// ==================================================
// MY LAND OTP
// ==================================================

const myLandDetailsBtn =
    getElement(
        "myLandDetailsBtn"
    );


const myLandOtpBox =
    getElement(
        "myLandOtpBox"
    );


const verifyMyLandOtpBtn =
    getElement(
        "verifyMyLandOtpBtn"
    );


const myLandOtp =
    getElement(
        "myLandOtp"
    );


const myLandOtpMessage =
    getElement(
        "myLandOtpMessage"
    );


const citizenDetailedParcelInfo =
    getElement(
        "citizenDetailedParcelInfo"
    );



// ==================================================
// OPEN MY LAND DETAILS
// ==================================================

if (myLandDetailsBtn) {

    myLandDetailsBtn.addEventListener(
        "click",
        function () {

            if (!selectedCitizenParcel) {

                if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        "Please select a parcel from the Citizen View map.";

                }

                return;

            }


            citizenDetailedAccessGranted =
                false;


            if (citizenDetailedParcelInfo) {

                citizenDetailedParcelInfo.style.display =
                    "none";

            }


            if (myLandOtp) {

                myLandOtp.value =
                    "";

            }


            if (myLandOtpMessage) {

                myLandOtpMessage.textContent =
                    "Enter the 6-digit OTP to unlock My Land Details.";

            }


            if (myLandOtpBox) {

                myLandOtpBox.style.display =
                    "block";

            }


            if (myLandOtp) {

                myLandOtp.focus();

            }

        }
    );

}


// ==================================================
// VERIFY MY LAND OTP
// ==================================================

if (verifyMyLandOtpBtn) {

    verifyMyLandOtpBtn.addEventListener(
        "click",
        async function () {

            const enteredOtp =
                displayValue(
                    myLandOtp?.value
                ).trim();


            if (
                !selectedCitizenParcel
            ) {

                if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        "Please select a parcel from the Citizen View map first.";

                }

                return;

            }


            if (
                !/^\d{6}$/.test(
                    enteredOtp
                )
            ) {

                if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        "OTP must contain exactly 6 numbers.";

                }

                return;

            }


            if (
                enteredOtp !==
                DEMO_LAND_OWNER_OTP
            ) {

                if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        "Invalid OTP. Access denied.";

                }


                if (citizenDetailedParcelInfo) {

                    citizenDetailedParcelInfo.style.display =
                        "none";

                }

                return;

            }


            try {

                const user =
                    auth.currentUser;


                if (!user) {

                    throw new Error(
                        "Please login again."
                    );

                }


                const idToken =
                    await user.getIdToken(true);


                const parcelId =
                    selectedCitizenParcel.parcel_id;


                const response =
                    await fetch(

                        `${SERVER_URL}/api/citizen/parcel-details?parcelId=` +
                        encodeURIComponent(
                            parcelId
                        ),

                        {

                            method:
                                "GET",

                            headers: {

                                Authorization:
                                    `Bearer ${idToken}`,

                                "X-Land-Access-OTP":
                                    enteredOtp

                            }

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not load detailed land information."
                    );

                }


                citizenDetailedAccessGranted =
    true;


// Store the same integrated land data
// used by My Land Details for the report.
window.landStackCitizenReportParcel = {
    ...(selectedCitizenParcel || {}),
    ...(data.data || {})
};


if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        "OTP verified. Detailed land information unlocked.";

                }


                showCitizenDetailedParcelInformation(
                    data.data
                );


                if (
                    citizenDetailedParcelInfo
                ) {

                    citizenDetailedParcelInfo.style.display =
                        "block";

                }

            } catch (error) {

                console.error(
                    "Citizen detailed access error:",
                    error
                );


                if (myLandOtpMessage) {

                    myLandOtpMessage.textContent =
                        error.message;

                }

            }

        }
    );

}


// ==================================================
// SHOW CITIZEN DETAILED PARCEL INFORMATION
// ==================================================

function showCitizenDetailedParcelInformation(
    data
) {

    const container =
        document.getElementById(
            "citizenDetailedParcelInfo"
        );


    if (!container) {
        return;
    }


    function value(value) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            return "Data not available in current dataset";

        }

        return String(value);

    }


    function protectedValue(value) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            return "Data not available in current dataset";

        }

        return String(value);

    }


    function statusValue(
        value,
        fallback = "Not available"
    ) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            return fallback;

        }

        return String(value);

    }


    function statusClass(status) {

        const text =
            String(status)
                .toLowerCase();


        if (
            text.includes("paid") ||
            text.includes("completed") ||
            text.includes("approved") ||
            text.includes("conforming") ||
            text.includes("none") ||
            text.includes("clear") ||
            text.includes("available")
        ) {

            return "positive";

        }


        if (
            text.includes("pending") ||
            text.includes("review") ||
            text.includes("due") ||
            text.includes("under")
        ) {

            return "review";

        }


        return "neutral";

    }


    const ownershipStatus =
        statusValue(
            data.ownership_status
        );


    const registrationStatus =
        statusValue(
            data.registration_status
        );


    const planningStatus =
        statusValue(
            data.planning_status
        );


    const taxStatus =
        statusValue(
            data.tax_status
        );


    const mutationStatus =
        statusValue(
            data.mutation_status
        );


    const buildingStatus =
        statusValue(
            data.building_status
        );


    const restrictionStatus =
        statusValue(
            data.restriction_status
        );


    const encumbranceStatus =
        statusValue(
            data.encumbrance_status
        );


    let verificationSummary =
        "No pending verification flag identified in the current demonstration dataset.";


    const reviewValues = [

        planningStatus,

        mutationStatus,

        buildingStatus,

        restrictionStatus,

        encumbranceStatus,

        registrationStatus

    ];


    const needsReview =
        reviewValues.some(
            function (item) {

                const text =
                    String(item)
                        .toLowerCase();

                return (
                    text.includes("pending") ||
                    text.includes("review") ||
                    text.includes("under")
                );

            }
        );


    if (needsReview) {

        verificationSummary =
            "Some records require verification or review based on the current demonstration dataset.";

    }


    container.innerHTML = `

        <div
            class="landstack-citizen-detail-wrap"
            style="
                margin-top:20px;
                padding:20px;
                border:1px solid #d9dee5;
                border-radius:10px;
                background:#ffffff;
            "
        >

            <div
                style="
                    border-bottom:2px solid #243b53;
                    padding-bottom:12px;
                    margin-bottom:20px;
                "
            >

                <h2
                    style="
                        margin:0 0 6px 0;
                        color:#243b53;
                    "
                >
                    My Land Details
                </h2>


                <p
                    style="
                        margin:0;
                        color:#667085;
                        font-size:14px;
                    "
                >
                    Consent-based detailed land information
                </p>

            </div>


            <!-- =====================================
                 PARCEL REFERENCE
                 ===================================== -->

            <h3
                style="
                    color:#243b53;
                    margin-top:0;
                "
            >
                Parcel Information
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Parcel ID
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.parcel_id)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        LP Number
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.lp_number)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Survey Number
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.survey_number)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Subdivision Number
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.subdivision_number)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        ULPIN
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.ulpin)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Area (sq. yards)
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.area_sq_yards)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Village
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.village)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Mandal
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.mandal)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        District
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.district)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            text-align:left;
                            padding:9px;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        State
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.state)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 INTEGRATED LAND STATUS
                 ===================================== -->

            <div
                style="
                    border:1px solid #d9dee5;
                    border-radius:8px;
                    padding:15px;
                    margin-bottom:24px;
                    background:#fafbfc;
                "
            >

                <h3
                    style="
                        margin-top:0;
                        color:#243b53;
                    "
                >
                    Integrated Land Status
                </h3>


                <p style="margin:7px 0;">
                    <strong>GIS Parcel:</strong>
                    Available
                </p>


                <p style="margin:7px 0;">
                    <strong>Ownership:</strong>
                    ${protectedValue(ownershipStatus)}
                </p>


                <p style="margin:7px 0;">
                    <strong>Registration:</strong>
                    ${protectedValue(registrationStatus)}
                </p>


                <p style="margin:7px 0;">
                    <strong>Land Use:</strong>
                    ${value(data.current_land_use)}
                </p>


                <p style="margin:7px 0;">
                    <strong>Planning:</strong>
                    ${planningStatus}
                </p>


                <p style="margin:7px 0;">
                    <strong>Property Tax:</strong>
                    ${taxStatus}
                </p>


                <p style="margin:7px 0;">
                    <strong>Mutation:</strong>
                    ${mutationStatus}
                </p>


                <p style="margin:7px 0;">
                    <strong>Building Permission:</strong>
                    ${buildingStatus}
                </p>


                <p style="margin:7px 0;">
                    <strong>Restrictions:</strong>
                    ${restrictionStatus}
                </p>


                <p style="margin:7px 0;">
                    <strong>Encumbrance:</strong>
                    ${encumbranceStatus}
                </p>


                <p
                    style="
                        margin:12px 0 0 0;
                        padding-top:10px;
                        border-top:1px solid #d9dee5;
                    "
                >

                    <strong>
                        Verification Status:
                    </strong>

                    ${verificationSummary}

                </p>

            </div>


            <!-- =====================================
                 OWNERSHIP
                 ===================================== -->

            <h3 style="color:#243b53;">
                Ownership
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Owner Name
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.owner_name)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Owner Type
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.owner_type)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Ownership Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.ownership_status)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Ownership Start
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.ownership_start_date)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 REGISTRATION
                 ===================================== -->

            <h3 style="color:#243b53;">
                Registration
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Transaction Type
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.transaction_type)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Registration Number
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.registration_number)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Transaction Date
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.transaction_date)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Registration Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.registration_status)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 LAND USE & PLANNING
                 ===================================== -->

            <h3 style="color:#243b53;">
                Land Use & Planning
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Current Land Use
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.current_land_use)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Previous Land Use
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.previous_land_use)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Conversion Required
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.conversion_required)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Conversion Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.conversion_status)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Planning Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.planning_status)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 PROPERTY TAX
                 ===================================== -->

            <h3 style="color:#243b53;">
                Property Tax
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Property Tax Number
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.property_tax_number)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Financial Year
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.financial_year)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Tax Amount
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.tax_amount)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Amount Paid
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.amount_paid)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Tax Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.tax_status)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 RESTRICTIONS & ENCUMBRANCE
                 ===================================== -->

            <h3 style="color:#243b53;">
                Restrictions & Encumbrance
            </h3>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                "
            >

                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Restriction Type
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.restriction_type)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Restriction Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.restriction_status)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Encumbrance Status
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.encumbrance_status)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Encumbrance Type
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.encumbrance_type)}
                    </td>

                </tr>


                <tr>

                    <th
                        style="
                            padding:9px;
                            text-align:left;
                            border:1px solid #d9dee5;
                            background:#f3f6f9;
                        "
                    >
                        Authority
                    </th>

                    <td
                        style="
                            padding:9px;
                            border:1px solid #d9dee5;
                        "
                    >
                        ${value(data.authority_name)}
                    </td>

                </tr>

            </table>


            <!-- =====================================
                 ACCESS NOTE
                 ===================================== -->

            <div
                style="
                    padding:13px;
                    border:1px solid #d9dee5;
                    background:#f7f8fa;
                    color:#52606d;
                    font-size:13px;
                    line-height:1.5;
                    margin-top:10px;
                "
            >

                <strong>
                    Consent-Based Access:
                </strong>

                Detailed land information shown above was
                unlocked after successful consent verification.
                Information displayed is based on the current
                LandStack demonstration dataset.

            </div>


            <div
                style="
                    margin-top:18px;
                    padding-top:8px;
                    border-top:1px solid #d9dee5;
                    text-align:center;
                    font-size:10px;
                    color:#777777;
                "
            >

                Prototype / Demonstration Data –
                Not a Legal Land Record.

            </div>

        </div>

    `;


    // ==================================================
    // APPLY STATUS CLASSES WHERE POSSIBLE
    // ==================================================

    container
        .querySelectorAll("[data-status]")
        .forEach(
            function (element) {

                const status =
                    element.getAttribute(
                        "data-status"
                    );


                element.classList.add(
                    statusClass(status)
                );

            }
        );

}


// ==================================================
// OFFICER ELEMENT REFERENCES
// ==================================================

const officerDashboard =
    getElement(
        "officerDashboard"
    );

const officerMapSection =
    getElement(
        "officerMapSection"
    );

const officerSearchSection =
    getElement(
        "officerSearchSection"
    );

const officerVerificationSection =
    getElement(
        "officerVerificationSection"
    );

const officerMapBtn =
    getElement(
        "officerMapBtn"
    );

const officerSearchBtn =
    getElement(
        "officerSearchBtn"
    );

const officerVerificationBtn =
    getElement(
        "officerVerificationBtn"
    );

const officerSearchParcelBtn =
    getElement(
        "officerSearchParcelBtn"
    );

const officerSearchMessage =
    getElement(
        "officerSearchMessage"
    );

const officerSearchResult =
    getElement(
        "officerSearchResult"
    );

const officerClearSearchBtn =
    getElement(
        "officerClearSearchBtn"
    );

const officerClearBtn =
    getElement(
        "officerClearBtn"
    );


// ==================================================
// HIDE OFFICER SECTIONS
// ==================================================

function hideOfficerSections() {

    if (officerDashboard) {

        officerDashboard.style.display =
            "none";

    }

    if (officerMapSection) {

        officerMapSection.style.display =
            "none";

    }

    if (officerSearchSection) {

        officerSearchSection.style.display =
            "none";

    }

    if (officerVerificationSection) {

        officerVerificationSection.style.display =
            "none";

    }

        if (
        officerVerificationQueueSection
    ) {

        officerVerificationQueueSection.style.display =
            "none";

    }


    if (
        officerAuditHistory
    ) {

        officerAuditHistory.style.display =
            "none";

    }



}


// ==================================================
// OFFICER DASHBOARD HELPERS
// ==================================================

function getOfficerReferenceText(
    parcel
) {

    const references = [];


    const lp =
        displayValue(
            parcel?.lp_number
        );


    const survey =
        displayValue(
            parcel?.survey_number
        );


    const ulpin =
        displayValue(
            parcel?.ulpin ||
            parcel?.lp_number
        );


    if (
        lp !== "Not available" &&
        lp !== "0"
    ) {

        references.push(
            `LP ${lp}`
        );

    }


    if (
        survey !== "Not available" &&
        survey !== "0"
    ) {

        references.push(
            `Survey ${survey}`
        );

    }


    if (
        ulpin !== "Not available" &&
        ulpin !== "0"
    ) {

        references.push(
            `ULPIN ${ulpin}`
        );

    }


    if (
        references.length > 0
    ) {

        return references.join(
            " | "
        );

    }


    return (
        parcel?.parcel_id ||
        "Parcel"
    );

}


function normalizeStatusText(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


function isDueStatus(
    value
) {

    return normalizeStatusText(
        value
    ).includes(
        "due"
    );

}


function isPendingStatus(
    value
) {

    return normalizeStatusText(
        value
    ).includes(
        "pending"
    );

}


function hasActiveDispute(
    parcel
) {

    const values = [

        parcel?.dispute_indicator,

        parcel?.dispute_status,

        parcel?.dispute_current_status

    ]
        .map(
            normalizeStatusText
        )
        .filter(
            Boolean
        );


    if (
        values.length === 0
    ) {

        return false;

    }


    return values.some(
        function (value) {

            return (

                value.includes("yes") ||

                value.includes("active") ||

                value.includes("recorded") ||

                value.includes("pending") ||

                value.includes("case") ||

                (
                    value !== "no" &&
                    value !== "none" &&
                    value !== "clear" &&
                    value !== "cleared" &&
                    !value.includes(
                        "no active"
                    ) &&
                    !value.includes(
                        "not available"
                    ) &&
                    !value.includes(
                        "not recorded"
                    )

                )

            );

        }
    );

}


function hasActiveEncumbrance(
    parcel
) {

    const values = [

        parcel?.encumbrance_indicator,

        parcel?.encumbrance_status,

        parcel?.encumbrance_type

    ]
        .map(
            normalizeStatusText
        )
        .filter(
            Boolean
        );


    if (
        values.length === 0
    ) {

        return false;

    }


    return values.some(
        function (value) {

            return (

                value === "yes" ||

                value.includes("active") ||

                value.includes("encumbered") ||

                (
                    value !== "no" &&
                    value !== "none" &&
                    value !== "clear" &&
                    value !== "cleared" &&
                    !value.includes(
                        "no active"
                    ) &&
                    !value.includes(
                        "not available"
                    ) &&
                    !value.includes(
                        "not recorded"
                    ) &&
                    value.length > 0

                )

            );

        }
    );

}


function getVerificationRecordsFromResponse(
    payload
) {

    if (
        Array.isArray(payload)
    ) {

        return payload;

    }


    if (
        Array.isArray(
            payload?.records
        )
    ) {

        return payload.records;

    }


    if (
        Array.isArray(
            payload?.items
        )
    ) {

        return payload.items;

    }


    if (
        Array.isArray(
            payload?.data
        )
    ) {

        return payload.data;

    }


    return [];

}


function getLatestVerificationMap(
    records
) {

    const latest =
        new Map();


    records.forEach(
        function (record) {

            const key =
                getOfficerParcelKey(
                    record
                );


            if (!key) {

                return;

            }


            const existing =
                latest.get(key);


            const currentTime =
                new Date(
                    record.created_at ||
                    0
                ).getTime();


            const existingTime =
                existing
                    ? new Date(
                        existing.created_at ||
                        0
                    ).getTime()
                    : -1;


            if (
                !existing ||
                currentTime >= existingTime
            ) {

                latest.set(
                    key,
                    record
                );

            }

        }
    );


    return latest;

}


// ==================================================
// CREATE OFFICER DASHBOARD SUMMARY
// ==================================================

function ensureOfficerDashboardSummaryContainer() {

    if (!officerDashboard) {

        return null;

    }


    let container =
        getElement(
            "landstackOfficerDashboardSummary"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "landstackOfficerDashboardSummary";


        officerDashboard.appendChild(
            container
        );

    }


    return container;

}


function renderOfficerDashboardSummary(
    parcels,
    latestVerification
) {

    const container =
        ensureOfficerDashboardSummaryContainer();


    if (!container) {

        return;

    }


    const parcelRows =
        parcels || [];


    const totalParcels =
        parcelRows.length;


    const verificationRequired =
        parcelRows.filter(
            function (parcel) {

                const key =
                    getOfficerParcelKey(
                        parcel
                    );


                const verification =
                    latestVerification.get(
                        key
                    );


                const action =
                    verification?.action ||
                    parcel.verification_action ||
                    parcel.verification_status;


                return (
                    action ===
                    "verification_required"
                );

            }
        );


    const furtherReview =
        parcelRows.filter(
            function (parcel) {

                const key =
                    getOfficerParcelKey(
                        parcel
                    );


                const verification =
                    latestVerification.get(
                        key
                    );


                const action =
                    verification?.action ||
                    parcel.verification_action ||
                    parcel.verification_status;


                return (
                    action ===
                    "further_review"
                );

            }
        );


    const clearedVerified =
        parcelRows.filter(
            function (parcel) {

                const key =
                    getOfficerParcelKey(
                        parcel
                    );


                const verification =
                    latestVerification.get(
                        key
                    );


                const action =
                    verification?.action ||
                    parcel.verification_action ||
                    parcel.verification_status;


                return (
                    action ===
                    "cleared"
                );

            }
        );


    const landDisputes =
        parcelRows.filter(
            hasActiveDispute
        );


    const activeEncumbrances =
        parcelRows.filter(
            hasActiveEncumbrance
        );


    const propertyTaxDue =
        parcelRows.filter(
            function (parcel) {

                return isDueStatus(
                    parcel.tax_status
                );

            }
        );


    const pendingMutations =
        parcelRows.filter(
            function (parcel) {

                return isPendingStatus(
                    parcel.mutation_status
                );

            }
        );


    const cards = [

        {
            type:
                "total",

            label:
                "Total Land Parcels",

            count:
                totalParcels,

            clickable:
                false

        },

        {
            type:
                "verification_required",

            label:
                "Verification Required",

            count:
                verificationRequired.length,

            clickable:
                true

        },

        {
            type:
                "further_review",

            label:
                "Further Review",

            count:
                furtherReview.length,

            clickable:
                true

        },

        {
            type:
                "cleared",

            label:
                "Cleared / Verified",

            count:
                clearedVerified.length,

            clickable:
                true

        },

        {
            type:
                "disputes",

            label:
                "Land Disputes",

            count:
                landDisputes.length,

            clickable:
                true

        },

        {
            type:
                "encumbrances",

            label:
                "Active Encumbrances",

            count:
                activeEncumbrances.length,

            clickable:
                true

        },

        {
            type:
                "property_tax_due",

            label:
                "Property Tax Due",

            count:
                propertyTaxDue.length,

            clickable:
                true

        },

        {
            type:
                "pending_mutations",

            label:
                "Pending Mutations",

            count:
                pendingMutations.length,

            clickable:
                true

        }

    ];


    container.innerHTML = `

        <div class="landstack-official-card"
             style="padding:20px;">

            <h2 class="ls-dashboard-summary-title">
                Officer Dashboard
            </h2>

            <p class="ls-dashboard-summary-subtitle">
                Integrated land governance work status
                across the registered parcel dataset.
            </p>

            <div class="ls-summary-grid">

                ${cards.map(
                    function (card) {

                        return `

                            <div
                                class="
                                    ls-summary-card
                                    ${card.clickable
                                        ? ""
                                        : "ls-summary-card-disabled"}
                                "
                                data-summary-type="${card.type}"
                                title="${
                                    card.clickable
                                        ? "Click to view affected parcels"
                                        : "Total parcel count"
                                }"
                            >

                                <div class="ls-summary-label">
                                    ${escapeHtml(
                                        card.label
                                    )}
                                </div>

                                <div class="ls-summary-count">
                                    ${escapeHtml(
                                        card.count
                                    )}
                                </div>

                                <div class="ls-summary-action">
                                    ${
                                        card.clickable
                                            ? "View affected parcels"
                                            : "Full parcel dataset"
                                    }
                                </div>

                            </div>

                        `;

                    }
                ).join("")}

            </div>

            <div id="landstackOfficerDashboardQueue"></div>

        </div>

    `;


    const summaryQueue =
        getElement(
            "landstackOfficerDashboardQueue"
        );


    container
        .querySelectorAll(
            "[data-summary-type]"
        )
        .forEach(
            function (cardElement) {

                if (
                    cardElement.dataset.summaryType ===
                    "total"
                ) {

                    return;

                }


                cardElement.addEventListener(
                    "click",
                    function () {

                        showOfficerDashboardQueue(
                            cardElement.dataset.summaryType,
                            parcelRows,
                            latestVerification
                        );

                    }
                );

            }
        );


    if (summaryQueue) {

        summaryQueue.innerHTML = `

            <div
                class="ls-dashboard-queue"
                style="margin-top:20px;"
            >

                <div
                    class="ls-dashboard-queue-header"
                >

                    <div>

                        <h3 class="ls-dashboard-queue-title">
                            Operational Work Queue
                        </h3>

                        <p class="ls-dashboard-queue-subtitle">
                            Click any dashboard card to
                            see only the affected parcel references.
                        </p>

                    </div>

                </div>

                <p class="landstack-muted"
                   style="margin:0;">
                    Select a work-status card above.
                </p>

            </div>

        `;

    }

}


function showOfficerDashboardQueue(
    type,
    parcels,
    latestVerification
) {

    const queue =
        getElement(
            "landstackOfficerDashboardQueue"
        );


    if (!queue) {

        return;

    }


    let matchingParcels = [];


    let title =
        "";


    let subtitle =
        "";


    if (
        type ===
        "verification_required"
    ) {

        title =
            "Verification Required";

        subtitle =
            "Parcels currently flagged for verification.";

        matchingParcels =
            parcels.filter(
                function (parcel) {

                    const key =
                        getOfficerParcelKey(
                            parcel
                        );


                    const record =
                        latestVerification.get(
                            key
                        );


                    return (
                        (
                            record?.action ||
                            parcel.verification_action ||
                            parcel.verification_status
                        ) ===
                        "verification_required"
                    );

                }
            );

    }


    if (
        type ===
        "further_review"
    ) {

        title =
            "Further Review";

        subtitle =
            "Parcels currently requiring further review.";

        matchingParcels =
            parcels.filter(
                function (parcel) {

                    const key =
                        getOfficerParcelKey(
                            parcel
                        );


                    const record =
                        latestVerification.get(
                            key
                        );


                    return (
                        (
                            record?.action ||
                            parcel.verification_action ||
                            parcel.verification_status
                        ) ===
                        "further_review"
                    );

                }
            );

    }


    if (
        type ===
        "cleared"
    ) {

        title =
            "Cleared / Verified";

        subtitle =
            "Parcels whose latest verification action is cleared.";

        matchingParcels =
            parcels.filter(
                function (parcel) {

                    const key =
                        getOfficerParcelKey(
                            parcel
                        );


                    const record =
                        latestVerification.get(
                            key
                        );


                    return (
                        (
                            record?.action ||
                            parcel.verification_action ||
                            parcel.verification_status
                        ) ===
                        "cleared"
                    );

                }
            );

    }


    if (
        type ===
        "disputes"
    ) {

        title =
            "Land Disputes";

        subtitle =
            "Parcels with a recorded active dispute indicator.";

        matchingParcels =
            parcels.filter(
                hasActiveDispute
            );

    }


    if (
        type ===
        "encumbrances"
    ) {

        title =
            "Active Encumbrances";

        subtitle =
            "Parcels with an active encumbrance record.";

        matchingParcels =
            parcels.filter(
                hasActiveEncumbrance
            );

    }


    if (
        type ===
        "property_tax_due"
    ) {

        title =
            "Property Tax Due";

        subtitle =
            "Parcels currently carrying a property tax due status.";

        matchingParcels =
            parcels.filter(
                function (parcel) {

                    return isDueStatus(
                        parcel.tax_status
                    );

                }
            );

    }


    if (
        type ===
        "pending_mutations"
    ) {

        title =
            "Pending Mutations";

        subtitle =
            "Parcels with a pending mutation status.";

        matchingParcels =
            parcels.filter(
                function (parcel) {

                    return isPendingStatus(
                        parcel.mutation_status
                    );

                }
            );

    }


    queue.innerHTML = `

        <div class="ls-dashboard-queue">

            <div class="ls-dashboard-queue-header">

                <div>

                    <h3 class="ls-dashboard-queue-title">
                        ${escapeHtml(title)}
                    </h3>

                    <p class="ls-dashboard-queue-subtitle">
                        ${escapeHtml(subtitle)}
                    </p>

                </div>

                <div class="landstack-status-pill">
                    ${matchingParcels.length} parcel(s)
                </div>

            </div>

            ${
                matchingParcels.length === 0

                    ? `

                        <p class="landstack-muted"
                           style="margin:0;">
                            No affected parcels are currently recorded.
                        </p>

                      `

                    : matchingParcels.map(
                        function (
                            parcel,
                            index
                        ) {

                            return `

                                <div
                                    class="ls-dashboard-queue-item"
                                    data-dashboard-queue-index="${index}"
                                >

                                    <div>

                                        <div
                                            class="ls-dashboard-parcel-reference"
                                        >
                                            ${escapeHtml(
                                                getOfficerReferenceText(
                                                    parcel
                                                )
                                            )}
                                        </div>

                                    </div>

                                    <div class="ls-dashboard-queue-note">
                                        Open parcel record
                                    </div>

                                </div>

                            `;

                        }
                    ).join("")
            }

        </div>

    `;


    queue
        .querySelectorAll(
            "[data-dashboard-queue-index]"
        )
        .forEach(
            function (element) {

                element.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                element.dataset
                                    .dashboardQueueIndex
                            );


                        const parcel =
                            matchingParcels[index];


                        locateOfficerParcelFromDashboard(
                            parcel
                        );

                    }
                );

            }
        );

}


function locateOfficerParcelFromDashboard(
    parcel
) {

    if (
        !parcel ||
        !officerParcelData ||
        !officerParcelData.features
    ) {

        return;

    }


    const parcelId =
        normalizeSearchValue(
            parcel.parcel_id
        );


    const lp =
        normalizeSearchValue(
            parcel.lp_number
        );


    const survey =
        normalizeSearchValue(
            parcel.survey_number
        );


    const feature =
        officerParcelData.features.find(
            function (item) {

                const p =
                    item.properties ||
                    {};


                return (

                    (
                        parcelId &&
                        normalizeSearchValue(
                            p.parcel_id
                        ) ===
                        parcelId
                    )

                    ||

                    (
                        lp &&
                        normalizeSearchValue(
                            p.lp_number
                        ) ===
                        lp
                    )

                    ||

                    (
                        survey &&
                        normalizeSearchValue(
                            p.survey_number
                        ) ===
                        survey
                    )

                );

            }
        );


    if (!feature) {

        alert(
            "The selected dashboard parcel could not be located on the map."
        );

        return;

    }


    locateOfficerFeature(
        feature
    );

}


async function loadOfficerDashboardSummary() {

    if (
        !officerDashboard
    ) {

        return;

    }


    if (
        !activeOfficerKey
    ) {

        return;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            return;

        }


        const idToken =
            await user.getIdToken(true);


        const headers = {

            Authorization:
                `Bearer ${idToken}`,

            "X-Officer-Key":
                activeOfficerKey

        };


        const responses =
            await Promise.all([

                fetch(
                    `${SERVER_URL}/api/officer/parcels`,
                    {
                        method:
                            "GET",
                        headers:
                            headers
                    }
                ),

                fetch(
                  `${SERVER_URL}/officer/verification-queue`,
                    {
                        method:
                            "GET",
                        headers:
                            headers
                    }
                )

            ]);


        const parcelResponse =
            responses[0];


        const verificationResponse =
            responses[1];


        const parcelDataResponse =
            await parcelResponse.json();


        const verificationDataResponse =
            await verificationResponse.json();


        if (
            !parcelResponse.ok
        ) {

            throw new Error(
                parcelDataResponse.message ||
                "Could not load officer parcel summary."
            );

        }


        if (
            !verificationResponse.ok
        ) {

            throw new Error(
                verificationDataResponse.message ||
                "Could not load verification summary."
            );

        }


        const parcels =
            Array.isArray(
                parcelDataResponse.features
            )
                ? parcelDataResponse.features
                : [];


        const verificationRecords =
            getVerificationRecordsFromResponse(
                verificationDataResponse
            );


        const latestVerification =
            getLatestVerificationMap(
                verificationRecords
            );


        renderOfficerDashboardSummary(
            parcels,
            latestVerification
        );


    } catch (error) {

        console.error(
            "Officer dashboard summary error:",
            error
        );


        const container =
            ensureOfficerDashboardSummaryContainer();


        if (container) {

            container.innerHTML = `

                <div
                    class="landstack-official-card"
                    style="
                        padding:20px;
                        border-top:4px solid #123b5d;
                    "
                >

                    <h3>
                        Officer Dashboard
                    </h3>

                    <p class="landstack-muted">
                        Could not load the current dashboard summary.
                    </p>

                    <p style="margin-bottom:0;">
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


window.refreshLandStackOfficerDashboard =
    loadOfficerDashboardSummary;


// ==================================================
// LOAD OFFICER PARCEL MAP
// ==================================================

async function loadOfficerParcelMap() {

    try {

        if (!activeOfficerKey) {

            return;

        }


        const user =
            auth.currentUser;


        if (!user) {

            throw new Error(
                "Please login again."
            );

        }


        const mapContainer =
            getElement(
                "officerMap"
            );


        if (!mapContainer) {

            return;

        }


        if (!officerMap) {

            officerMap =
                L.map(
                    "officerMap"
                ).setView(
                    [16.85, 81.38],
                    14
                );


            L.control.zoom({
                position:
                    "topright"
            }).addTo(
                officerMap
            );


            L.control.scale({
                position:
                    "bottomleft",
                metric:
                    true,
                imperial:
                    false
            }).addTo(
                officerMap
            );


            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {

                    attribution:
                        "&copy; OpenStreetMap contributors"

                }
            ).addTo(
                officerMap
            );

        }


        const idToken =
            await user.getIdToken(true);


        const response =
            await fetch(
                `${SERVER_URL}/api/officer/parcels`,
                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${idToken}`,

                        "X-Officer-Key":
                            activeOfficerKey

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load Officer parcel data."
            );

        }


        const geoJsonData = {

            type:
                "FeatureCollection",

            features:
                (data.features || []).map(
                    function (row) {

                        const {
                            geometry,
                            ...properties
                        } = row;


                        return {

                            type:
                                "Feature",

                            properties:
                                properties,

                            geometry:
                                geometry

                        };

                    }
                )

        };


        officerParcelData =
            geoJsonData;


        const officerParcelCount =
            getElement(
                "officerParcelCount"
            );


        if (officerParcelCount) {

            officerParcelCount.textContent =
                data.count ??
                geoJsonData.features.length;

        }


        if (officerParcelLayer) {

            officerMap.removeLayer(
                officerParcelLayer
            );

        }


        officerParcelLayer =
            L.geoJSON(
                geoJsonData,
                {

                    style:
                        function () {

                            return {

                                color:
                                    "#29485c",

                                weight:
                                    1,

                                fillColor:
                                    "#c8dce8",

                                fillOpacity:
                                    0.48

                            };

                        },

onEachFeature:
    function (
        feature,
        layer
    ) {

        // =====================================================
        // SHOW PARCEL / LP NUMBER ON THE OFFICER MAP
        // =====================================================

        const lpNumber =
            feature.properties?.Lp_number ??
            feature.properties?.lp_number ??
            feature.properties?.LP_Number ??
            feature.properties?.lp_no ??
            feature.properties?.LP_No ??
            feature.properties?.survey_number ??
            feature.properties?.Survey_Number ??
            "";

        if (
            lpNumber !== null &&
            lpNumber !== undefined &&
            String(lpNumber).trim() !== ""
        ) {

            layer.bindTooltip(
                String(lpNumber),
                {
                    permanent:
                        true,

                    direction:
                        "center",

                    className:
                        "parcel-number-label",

                    opacity:
                        1
                }
            );

        }


        // =====================================================
        // PARCEL CLICK
        // =====================================================

        layer.on(
            "click",
            function () {

                selectOfficerParcel(
                    feature.properties,
                    layer
                );

            }
        );


        // =====================================================
        // PARCEL HOVER
        // =====================================================

        layer.on(
            "mouseover",
            function () {

                if (
                    selectedOfficerParcelLayer !==
                    layer
                ) {

                    layer.setStyle({

                        weight:
                            3,

                        fillColor:
                            "#a8c8da",

                        fillOpacity:
                            0.70

                    });

                }

            }
        );


        layer.on(
            "mouseout",
            function () {

                if (
                    selectedOfficerParcelLayer !==
                    layer
                ) {

                    officerParcelLayer.resetStyle(
                        layer
                    );

                }

            }
        );

    }
                }
            ).addTo(
                officerMap
            );


        const bounds =
            officerParcelLayer.getBounds();


        if (
            bounds.isValid()
        ) {

            officerMap.fitBounds(
                bounds,
                {
                    padding:
                        [20, 20]
                }
            );

        }


        if (selectedOfficerParcel) {

            const selectedId =
                String(
                    selectedOfficerParcel.parcel_id ??
                    ""
                );


            let restoredFeature =
                null;


            let restoredLayer =
                null;


            officerParcelLayer.eachLayer(
                function (layer) {

                    if (
                        layer.feature?.properties?.parcel_id &&
                        String(
                            layer.feature.properties.parcel_id
                        ) ===
                        selectedId
                    ) {

                        restoredFeature =
                            layer.feature;

                        restoredLayer =
                            layer;

                    }

                }
            );


            if (
                restoredFeature &&
                restoredLayer
            ) {

                selectOfficerParcel(
                    restoredFeature.properties,
                    restoredLayer
                );

            }

        }


    } catch (error) {

        console.error(
            "Officer GIS loading error:",
            error
        );


        alert(
            error.message
        );

    }

}


// ==================================================
// SELECT OFFICER PARCEL
// ==================================================

function selectOfficerParcel(
    parcel,
    layer
) {

    if (
        selectedOfficerParcelLayer &&
        selectedOfficerParcelLayer !== layer &&
        officerParcelLayer
    ) {

        officerParcelLayer.resetStyle(
            selectedOfficerParcelLayer
        );

    }


    selectedOfficerParcel =
        parcel;


    selectedOfficerParcelLayer =
        layer;


    if (layer) {

        layer.setStyle({

            weight:
                4,

            color:
                "#123b5d",

            fillColor:
                "#9dbed1",

            fillOpacity:
                0.78

        });


        if (
            typeof layer.bringToFront ===
            "function"
        ) {

            layer.bringToFront();

        }

    }


    showOfficerParcelInformation(
        parcel
    );


    updateVerificationSummary(
        parcel
    );


    loadOfficerVerificationStatus(
        parcel
    );


    const parcelDisplay =
        getElement(
            "officerVerificationParcel"
        );


    if (parcelDisplay) {

        parcelDisplay.textContent =
            `LP ${
                displayValue(
                    parcel.lp_number
                )
            } / Survey ${
                displayValue(
                    parcel.survey_number
                )
            }`;

    }


    const status =
        getElement(
            "officerVerificationStatus"
        );


    if (status) {

        status.textContent =
            "Parcel selected — Pending Verification";

    }


    if (
        officerMap &&
        layer
    ) {

        const bounds =
            layer.getBounds();


        if (
            bounds.isValid()
        ) {

            officerMap.fitBounds(
                bounds,
                {
                    padding:
                        [40, 40],
                    maxZoom:
                        18
                }
            );

        }

    }

}


// ==================================================
// UPDATE VERIFICATION SUMMARY
// ==================================================

function updateVerificationSummary(
    parcel
) {

    const ids = [

        "verificationOwnership",

        "verificationRegistration",

        "verificationLandUse",

        "verificationTax",

        "verificationRestrictions",

        "verificationEncumbrance"

    ];


    if (!parcel) {

        ids.forEach(
            function (id) {

                const element =
                    getElement(id);


                if (element) {

                    element.textContent =
                        "Not selected";

                }

            }
        );

        return;

    }


    const values = {

        verificationOwnership:
            parcel.ownership_status ||
            parcel.owner_name,

        verificationRegistration:
            parcel.registration_status ||
            parcel.registration_number,

        verificationLandUse:
            parcel.planning_status ||
            parcel.current_land_use,

        verificationTax:
            parcel.tax_status ||
            "Not available",

        verificationRestrictions:
            parcel.restriction_status ||
            parcel.restriction_type,

        verificationEncumbrance:
            parcel.encumbrance_status

    };


    Object.keys(values).forEach(
        function (id) {

            const element =
                getElement(id);


            if (element) {

                element.textContent =
                    displayValue(
                        values[id]
                    );

            }

        }
    );

}


// ==================================================
// OFFICER PARCEL INFORMATION
// ==================================================

function showOfficerParcelInformation(
    parcel
) {

    let container =
        getElement(
            "officerParcelInfo"
        );


    if (!container) {

        const section =
            officerMapSection;


        if (!section) {

            return;

        }


        container =
            document.createElement(
                "div"
            );


        container.id =
            "officerParcelInfo";


        container.style.marginTop =
            "20px";


        section.appendChild(
            container
        );

    }


    container.className =
        "landstack-official-card";


    container.style.padding =
        "20px";


    container.innerHTML = `

        <div class="landstack-official-section">

            <h3>
                Officer Parcel Review
            </h3>

            <p>
                <strong>Parcel ID:</strong>
                ${escapeHtml(parcel.parcel_id)}
            </p>

            <p>
                <strong>LP Number:</strong>
                ${escapeHtml(parcel.lp_number)}
            </p>

            <p>
                <strong>Survey Number:</strong>
                ${escapeHtml(parcel.survey_number)}
            </p>

            <p>
                <strong>Subdivision:</strong>
                ${escapeHtml(parcel.subdivision_number)}
            </p>

            <p>
                <strong>ULPIN:</strong>
                ${escapeHtml(parcel.ulpin)}
            </p>

            <p>
                <strong>Area:</strong>
                ${escapeHtml(parcel.area_sq_yards)}
                sq. yd.
            </p>

            <p>
                <strong>Village:</strong>
                ${escapeHtml(parcel.village)}
            </p>

            <p>
                <strong>Mandal:</strong>
                ${escapeHtml(parcel.mandal)}
            </p>

            <p>
                <strong>District:</strong>
                ${escapeHtml(parcel.district)}
            </p>

            <hr>

            <h4>
                Ownership
            </h4>

            <p>
                <strong>Owner:</strong>
                ${escapeHtml(parcel.owner_name)}
            </p>

            <p>
                <strong>Owner Type:</strong>
                ${escapeHtml(parcel.owner_type)}
            </p>

            <p>
                <strong>Ownership Status:</strong>
                ${escapeHtml(parcel.ownership_status)}
            </p>

            <hr>

            <h4>
                Registration
            </h4>

            <p>
                <strong>Transaction Type:</strong>
                ${escapeHtml(parcel.transaction_type)}
            </p>

            <p>
                <strong>Registration Number:</strong>
                ${escapeHtml(parcel.registration_number)}
            </p>

            <p>
                <strong>Transaction Date:</strong>
                ${escapeHtml(parcel.transaction_date)}
            </p>

            <p>
                <strong>Registration Status:</strong>
                ${escapeHtml(parcel.registration_status)}
            </p>

            <hr>

            <h4>
                Land Use & Planning
            </h4>

            <p>
                <strong>Current Land Use:</strong>
                ${escapeHtml(parcel.current_land_use)}
            </p>

            <p>
                <strong>Previous Land Use:</strong>
                ${escapeHtml(parcel.previous_land_use)}
            </p>

            <p>
                <strong>Conversion Required:</strong>
                ${escapeHtml(
                    parcel.land_use_conversion_required
                )}
            </p>

            <p>
                <strong>Conversion Status:</strong>
                ${escapeHtml(
                    parcel.land_use_conversion_status
                )}
            </p>

            <p>
                <strong>Zoning:</strong>
                ${escapeHtml(parcel.zoning)}
            </p>

            <p>
                <strong>Planning Status:</strong>
                ${escapeHtml(parcel.planning_status)}
            </p>

            <hr>

            <h4>
                Property Tax
            </h4>

            <p>
                <strong>Property Tax Number:</strong>
                ${escapeHtml(
                    parcel.property_tax_number
                )}
            </p>

            <p>
                <strong>Financial Year:</strong>
                ${escapeHtml(
                    parcel.property_tax_financial_year
                )}
            </p>

            <p>
                <strong>Tax Amount:</strong>
                ${escapeHtml(parcel.tax_amount)}
            </p>

            <p>
                <strong>Amount Paid:</strong>
                ${escapeHtml(parcel.amount_paid)}
            </p>

            <p>
                <strong>Tax Status:</strong>
                ${escapeHtml(parcel.tax_status)}
            </p>

            <hr>

            <h4>
                Land Tax
            </h4>

            <p>
                <strong>Assessment Number:</strong>
                ${escapeHtml(
                    parcel.land_tax_assessment_number
                )}
            </p>

            <p>
                <strong>Land Tax Amount:</strong>
                ${escapeHtml(
                    parcel.land_tax_amount
                )}
            </p>

            <p>
                <strong>Amount Paid:</strong>
                ${escapeHtml(
                    parcel.land_tax_amount_paid
                )}
            </p>

            <p>
                <strong>Land Tax Status:</strong>
                ${escapeHtml(
                    parcel.land_tax_status
                )}
            </p>

            <hr>

            <h4>
                Building Permission
            </h4>

            <p>
                <strong>Permission Number:</strong>
                ${escapeHtml(
                    parcel.permission_number
                )}
            </p>

            <p>
                <strong>Building Type:</strong>
                ${escapeHtml(
                    parcel.building_type
                )}
            </p>

            <p>
                <strong>Floors:</strong>
                ${escapeHtml(
                    parcel.number_of_floors
                )}
            </p>

            <p>
                <strong>Built-up Area:</strong>
                ${escapeHtml(
                    parcel.built_up_area_sqft
                )}
                sq. ft.
            </p>

            <p>
                <strong>Permission Status:</strong>
                ${escapeHtml(
                    parcel.building_permission_status
                )}
            </p>

            <hr>

            <h4>
                Encumbrance
            </h4>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(
                    parcel.encumbrance_status
                )}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHtml(
                    parcel.encumbrance_type
                )}
            </p>

            <p>
                <strong>Document:</strong>
                ${escapeHtml(
                    parcel.encumbrance_document_number
                )}
            </p>

            <p>
                <strong>Holder:</strong>
                ${escapeHtml(
                    parcel.encumbrance_holder
                )}
            </p>

            <hr>

            <h4>
                Restrictions
            </h4>

            <p>
                <strong>Type:</strong>
                ${escapeHtml(
                    parcel.restriction_type
                )}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(
                    parcel.restriction_status
                )}
            </p>

            <p>
                <strong>Authority:</strong>
                ${escapeHtml(
                    parcel.restriction_authority
                )}
            </p>

            <hr>

            <h4>
                Land Dispute
            </h4>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(
                    parcel.dispute_status
                )}
            </p>

            <p>
                <strong>Reference:</strong>
                ${escapeHtml(
                    parcel.dispute_reference
                )}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHtml(
                    parcel.dispute_type
                )}
            </p>

            <p>
                <strong>Authority:</strong>
                ${escapeHtml(
                    parcel.dispute_authority
                )}
            </p>

            <p>
                <strong>Current Status:</strong>
                ${escapeHtml(
                    parcel.dispute_current_status
                )}
            </p>

            <hr>

            <h4>
                Mutation
            </h4>

            <p>
                <strong>Application Number:</strong>
                ${escapeHtml(
                    parcel.mutation_application_number
                )}
            </p>

            <p>
                <strong>Mutation Type:</strong>
                ${escapeHtml(
                    parcel.mutation_type
                )}
            </p>

            <p>
                <strong>Mutation Status:</strong>
                ${escapeHtml(
                    parcel.mutation_status
                )}
            </p>

            <hr>

            <h4>
                Integrated Status
            </h4>

            <p>
                <strong>Due Diligence:</strong>
                ${escapeHtml(
                    parcel.due_diligence_status
                )}
            </p>

            <p>
                <strong>Citizen Status:</strong>
                ${escapeHtml(
                    parcel.citizen_status
                )}
            </p>

        </div>

        <div
            id="officerEditPanel"
            class="landstack-edit-panel"
        >

            <h4>
                Update Record
            </h4>

            <p class="landstack-muted">
                Controlled fields only. Changes are written
                directly to the LandStack PostgreSQL database.
            </p>

            <div class="landstack-edit-grid">

                <div class="landstack-field">

                    <label for="editPropertyTaxStatus">
                        Property Tax Status
                    </label>

                    <select id="editPropertyTaxStatus">

                        <option value="Paid">
                            Paid
                        </option>

                        <option value="Due">
                            Due
                        </option>

                        <option value="Partially Paid">
                            Partially Paid
                        </option>

                    </select>

                </div>


                <div class="landstack-field">

                    <label for="editPropertyTaxAmountPaid">
                        Property Tax Amount Paid
                    </label>

                    <input
                        id="editPropertyTaxAmountPaid"
                        type="number"
                        min="0"
                        step="0.01"
                        value="${escapeHtml(
                            parcel.amount_paid
                        )}"
                    >

                </div>


                <div class="landstack-field">

                    <label for="editLandTaxStatus">
                        Land Tax Status
                    </label>

                    <select id="editLandTaxStatus">

                        <option value="Paid">
                            Paid
                        </option>

                        <option value="Due">
                            Due
                        </option>

                        <option value="Not Applicable">
                            Not Applicable
                        </option>

                    </select>

                </div>


                <div class="landstack-field">

                    <label for="editMutationStatus">
                        Mutation Status
                    </label>

                    <select id="editMutationStatus">

                        <option value="Completed">
                            Completed
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                    </select>

                </div>


                <div class="landstack-field">

                    <label for="editPlanningStatus">
                        Planning Status
                    </label>

                    <select id="editPlanningStatus">

                        <option value="Conforming">
                            Conforming
                        </option>

                        <option value="Verification Required">
                            Verification Required
                        </option>

                    </select>

                </div>


                <div class="landstack-field">

                    <label for="editBuildingStatus">
                        Building Permission Status
                    </label>

                    <select id="editBuildingStatus">

                        <option value="Approved">
                            Approved
                        </option>

                        <option value="Under Review">
                            Under Review
                        </option>

                        <option value="Not Applicable">
                            Not Applicable
                        </option>

                    </select>

                </div>


                <div class="landstack-field">

                    <label for="editRestrictionStatus">
                        Restriction Status
                    </label>

                    <select id="editRestrictionStatus">

                        <option value="None">
                            None
                        </option>

                        <option value="Review Required">
                            Review Required
                        </option>

                    </select>

                </div>

            </div>


            <div class="landstack-button-row">

                <button
                    id="saveOfficerRecordBtn"
                    type="button"
                >
                    Save Record
                </button>

                <button
                    id="cancelOfficerEditBtn"
                    type="button"
                    class="landstack-secondary-button"
                >
                    Reset Fields
                </button>

            </div>


            <div
                id="officerEditMessage"
                class="landstack-muted"
                style="margin-top:10px;"
            ></div>

        </div>
        <div
    class="landstack-button-row"
    style="margin-top:16px;"
>

    <button
        id="officerDownloadReportBtn"
        type="button"
    >
        Download Verification Report
    </button>

</div>

    `;


    const taxStatus =
        getElement(
            "editPropertyTaxStatus"
        );


    const landTaxStatus =
        getElement(
            "editLandTaxStatus"
        );


    const mutationStatus =
        getElement(
            "editMutationStatus"
        );


    const planningStatus =
        getElement(
            "editPlanningStatus"
        );


    const buildingStatus =
        getElement(
            "editBuildingStatus"
        );


    const restrictionStatus =
        getElement(
            "editRestrictionStatus"
        );


    if (taxStatus) {

        taxStatus.value =
            parcel.tax_status ||
            "Paid";

    }


    if (landTaxStatus) {

        landTaxStatus.value =
            parcel.land_tax_status ||
            "Not Applicable";

    }


    if (mutationStatus) {

        mutationStatus.value =
            parcel.mutation_status ||
            "Completed";

    }


    if (planningStatus) {

        planningStatus.value =
            parcel.planning_status ||
            "Conforming";

    }


    if (buildingStatus) {

        buildingStatus.value =
            parcel.building_permission_status ||
            "Not Applicable";

    }


    if (restrictionStatus) {

        restrictionStatus.value =
            parcel.restriction_status ||
            "None";

    }


    const saveBtn =
        getElement(
            "saveOfficerRecordBtn"
        );


    const resetBtn =
        getElement(
            "cancelOfficerEditBtn"
        );


    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            function () {

                saveOfficerRecordUpdate(
                    parcel
                );

            }
        );

    }


    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            function () {

                showOfficerParcelInformation(
                    parcel
                );

            }
        );

    }
    const officerDownloadReportBtn =
    getElement(
        "officerDownloadReportBtn"
    );


if (officerDownloadReportBtn) {

    officerDownloadReportBtn.addEventListener(
        "click",
        function () {

            downloadOfficerVerificationReport(
                parcel
            );

        }
    );

}

}


// ==================================================
// OFFICER EDIT - SAVE
// ==================================================

async function saveOfficerRecordUpdate(
    parcel
) {

    if (!parcel) {

        return;

    }


    if (!activeOfficerKey) {

        alert(
            "Officer session is not active."
        );

        return;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            throw new Error(
                "Please login again."
            );

        }


        const taxStatus =
            getElement(
                "editPropertyTaxStatus"
            )?.value;


        const amountPaid =
            getElement(
                "editPropertyTaxAmountPaid"
            )?.value;


        const landTaxStatus =
            getElement(
                "editLandTaxStatus"
            )?.value;


        const mutationStatus =
            getElement(
                "editMutationStatus"
            )?.value;


        const planningStatus =
            getElement(
                "editPlanningStatus"
            )?.value;


        const buildingStatus =
            getElement(
                "editBuildingStatus"
            )?.value;


        const restrictionStatus =
            getElement(
                "editRestrictionStatus"
            )?.value;


        const message =
            getElement(
                "officerEditMessage"
            );


        if (message) {

            message.textContent =
                "Saving record...";

        }


        const idToken =
            await user.getIdToken(true);


        const response =
            await fetch(
                `${SERVER_URL}/officer/parcel-update`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${idToken}`,

                        "X-Officer-Key":
                            activeOfficerKey

                    },

                    body:
                        JSON.stringify({

                            parcelId:
                                parcel.parcel_id,

                            updates: {

                                propertyTax: {

                                    taxStatus:
                                        taxStatus,

                                    amountPaid:
                                        amountPaid

                                },

                                landTax: {

                                    taxStatus:
                                        landTaxStatus

                                },

                                mutation: {

                                    status:
                                        mutationStatus

                                },

                                planning: {

                                    status:
                                        planningStatus

                                },

                                building: {

                                    status:
                                        buildingStatus

                                },

                                restriction: {

                                    status:
                                        restrictionStatus

                                }

                            }

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Record update failed."
            );

        }


        if (message) {

            message.textContent =
                "Record updated successfully in PostgreSQL.";

        }


        const updatedParcel =
            data.data;


        if (
            updatedParcel
        ) {

            selectedOfficerParcel =
                updatedParcel;


            showOfficerParcelInformation(
                updatedParcel
            );


            updateVerificationSummary(
                updatedParcel
            );

        }


        await loadOfficerVerificationQueue();

        await loadOfficerDashboardSummary();

        await loadLandStackMainDashboardCards();


    } catch (error) {

        console.error(
            "Officer record update error:",
            error
        );


        const message =
            getElement(
                "officerEditMessage"
            );


        if (message) {

            message.textContent =
                error.message;

        }

    }

}
// ==================================================
// BUILD OFFICER VERIFICATION REPORT
// ==================================================

function buildOfficerVerificationReport(
    parcel
) {

    return `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        LandStack Officer Verification Report
    </title>

    <style>

        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #222;
        }

        h1 {
            margin-bottom: 5px;
        }

        h2 {
            margin-top: 28px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 6px;
        }

        .header {
            margin-bottom: 25px;
        }

        .status {
            padding: 10px;
            border: 1px solid #ccc;
            margin-top: 15px;
        }

        .row {
            margin: 5px 0;
        }

        strong {
            display: inline-block;
            min-width: 190px;
        }

        .footer {
            margin-top: 40px;
            font-size: 13px;
            color: #666;
        }

    </style>

</head>

<body>

    <div class="header">

        <h1>
            LandStack
        </h1>

        <h2>
            Officer Verification Report
        </h2>

        <p>
            Generated on:
            ${new Date().toLocaleString()}
        </p>

    </div>


    <h2>
        Parcel Information
    </h2>

    <div class="row">
        <strong>Parcel ID:</strong>
        ${escapeHtml(parcel.parcel_id)}
    </div>

    <div class="row">
        <strong>LP Number:</strong>
        ${escapeHtml(parcel.lp_number)}
    </div>

    <div class="row">
        <strong>Survey Number:</strong>
        ${escapeHtml(parcel.survey_number)}
    </div>

    <div class="row">
        <strong>Subdivision:</strong>
        ${escapeHtml(parcel.subdivision_number)}
    </div>

    <div class="row">
        <strong>ULPIN:</strong>
        ${escapeHtml(parcel.ulpin)}
    </div>

    <div class="row">
        <strong>Area:</strong>
        ${escapeHtml(parcel.area_sq_yards)}
        sq. yd.
    </div>

    <div class="row">
        <strong>Village:</strong>
        ${escapeHtml(parcel.village)}
    </div>

    <div class="row">
        <strong>Mandal:</strong>
        ${escapeHtml(parcel.mandal)}
    </div>

    <div class="row">
        <strong>District:</strong>
        ${escapeHtml(parcel.district)}
    </div>


    <h2>
        Ownership & Registration
    </h2>

    <div class="row">
        <strong>Owner:</strong>
        ${escapeHtml(parcel.owner_name)}
    </div>

    <div class="row">
        <strong>Owner Type:</strong>
        ${escapeHtml(parcel.owner_type)}
    </div>

    <div class="row">
        <strong>Ownership Status:</strong>
        ${escapeHtml(parcel.ownership_status)}
    </div>

    <div class="row">
        <strong>Registration Number:</strong>
        ${escapeHtml(parcel.registration_number)}
    </div>

    <div class="row">
        <strong>Registration Status:</strong>
        ${escapeHtml(parcel.registration_status)}
    </div>


    <h2>
        Taxes
    </h2>

    <div class="row">
        <strong>Property Tax Status:</strong>
        ${escapeHtml(parcel.tax_status)}
    </div>

    <div class="row">
        <strong>Property Tax Amount:</strong>
        ${escapeHtml(parcel.tax_amount)}
    </div>

    <div class="row">
        <strong>Property Tax Paid:</strong>
        ${escapeHtml(parcel.amount_paid)}
    </div>

    <div class="row">
        <strong>Land Tax Status:</strong>
        ${escapeHtml(parcel.land_tax_status)}
    </div>

    <div class="row">
        <strong>Land Tax Amount:</strong>
        ${escapeHtml(parcel.land_tax_amount)}
    </div>


    <h2>
        Planning & Building
    </h2>

    <div class="row">
        <strong>Current Land Use:</strong>
        ${escapeHtml(parcel.current_land_use)}
    </div>

    <div class="row">
        <strong>Zoning:</strong>
        ${escapeHtml(parcel.zoning)}
    </div>

    <div class="row">
        <strong>Planning Status:</strong>
        ${escapeHtml(parcel.planning_status)}
    </div>

    <div class="row">
        <strong>Building Permission:</strong>
        ${escapeHtml(parcel.building_permission_status)}
    </div>


    <h2>
        Mutation
    </h2>

    <div class="row">
        <strong>Application Number:</strong>
        ${escapeHtml(parcel.mutation_application_number)}
    </div>

    <div class="row">
        <strong>Mutation Type:</strong>
        ${escapeHtml(parcel.mutation_type)}
    </div>

    <div class="row">
        <strong>Mutation Status:</strong>
        ${escapeHtml(parcel.mutation_status)}
    </div>


    <h2>
        Encumbrance & Restrictions
    </h2>

    <div class="row">
        <strong>Encumbrance Status:</strong>
        ${escapeHtml(parcel.encumbrance_status)}
    </div>

    <div class="row">
        <strong>Encumbrance Type:</strong>
        ${escapeHtml(parcel.encumbrance_type)}
    </div>

    <div class="row">
        <strong>Restriction Type:</strong>
        ${escapeHtml(parcel.restriction_type)}
    </div>

    <div class="row">
        <strong>Restriction Status:</strong>
        ${escapeHtml(parcel.restriction_status)}
    </div>


    <h2>
        Land Dispute
    </h2>

    <div class="row">
        <strong>Dispute Status:</strong>
        ${escapeHtml(parcel.dispute_status)}
    </div>

    <div class="row">
        <strong>Dispute Reference:</strong>
        ${escapeHtml(parcel.dispute_reference)}
    </div>

    <div class="row">
        <strong>Dispute Type:</strong>
        ${escapeHtml(parcel.dispute_type)}
    </div>


    <h2>
        Integrated Verification
    </h2>

    <div class="status">

        <div class="row">
            <strong>Due Diligence:</strong>
            ${escapeHtml(parcel.due_diligence_status)}
        </div>

        <div class="row">
            <strong>Citizen Status:</strong>
            ${escapeHtml(parcel.citizen_status)}
        </div>

    </div>


    <div class="footer">

        LandStack Officer Verification Report.
        This report is generated from the integrated
        LandStack parcel record.

    </div>

</body>

</html>
    `;

}

// ==================================================
// OFFICER SEARCH
// ==================================================

function searchOfficerParcel() {

    if (
        !officerParcelData ||
        !officerParcelData.features
    ) {

        alert(
            "Officer parcel data is still loading."
        );

        return;

    }


    const lpInput =
        getElement(
            "officerLpSearch"
        );


    const surveyInput =
        getElement(
            "officerSurveySearch"
        );


    const ulpinInput =
        getElement(
            "officerUlpINSearch"
        );


    const lpValue =
        normalizeSearchValue(
            lpInput?.value
        );


    const surveyValue =
        normalizeSearchValue(
            surveyInput?.value
        );


    const ulpinValue =
        normalizeSearchValue(
            ulpinInput?.value
        );


    if (
        !lpValue &&
        !surveyValue &&
        !ulpinValue
    ) {

        alert(
            "Enter an LP Number, Survey Number or ULPIN."
        );

        return;

    }


    const results =
        officerParcelData.features.filter(
            function (feature) {

                const properties =
                    feature.properties ||
                    {};


                const featureLp =
                    normalizeSearchValue(
                        properties.lp_number
                    );


                const featureSurvey =
                    normalizeSearchValue(
                        properties.survey_number
                    );


                const featureULPIN =
                    normalizeSearchValue(
                        properties.ulpin ||
                        properties.lp_number
                    );


                return (

                    (
                        lpValue &&
                        featureLp ===
                            lpValue
                    )

                    ||

                    (
                        surveyValue &&
                        featureSurvey ===
                            surveyValue
                    )

                    ||

                    (
                        ulpinValue &&
                        featureULPIN ===
                            ulpinValue
                    )

                );

            }
        );


    if (
        results.length ===
        0
    ) {

        if (
            officerSearchMessage
        ) {

            officerSearchMessage.textContent =
                "No matching parcel found.";

        }


        if (
            officerSearchResult
        ) {

            officerSearchResult.innerHTML =
                "<h3>Search Result</h3><p>No matching parcel found.</p>";

        }


        return;

    }


    if (
        officerSearchMessage
    ) {

        officerSearchMessage.textContent =
            `${results.length} parcel(s) found.`;

    }


    if (
        officerSearchResult
    ) {

        officerSearchResult.innerHTML =
            results.map(
                function (
                    feature,
                    index
                ) {

                    const p =
                        feature.properties ||
                        {};


                    return `

                        <div
                            class="landstack-official-card"
                            data-result-index="${index}"
                            style="
                                padding:15px;
                                margin-bottom:10px;
                                cursor:pointer;
                            "
                        >

                            <strong>
                                Parcel ${index + 1}
                            </strong>

                            <p>
                                LP Number:
                                ${escapeHtml(
                                    p.lp_number
                                )}
                            </p>

                            <p>
                                Survey Number:
                                ${escapeHtml(
                                    p.survey_number
                                )}
                            </p>

                            <p>
                                ULPIN:
                                ${escapeHtml(
                                    p.ulpin
                                )}
                            </p>

                            <small>
                                Click to locate this parcel.
                            </small>

                        </div>

                    `;

                }
            ).join("");


        officerSearchResult
            .querySelectorAll(
                "[data-result-index]"
            )
            .forEach(
                function (
                    element
                ) {

                    element.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    element.dataset.resultIndex
                                );


                            const feature =
                                results[index];


                            locateOfficerFeature(
                                feature
                            );

                        }
                    );

                }
            );

    }

}


// ==================================================
// LOCATE OFFICER FEATURE
// ==================================================

function locateOfficerFeature(
    feature
) {

    if (
        !feature ||
        !officerParcelLayer
    ) {

        return;

    }


    let matchingLayer =
        null;


    officerParcelLayer.eachLayer(
        function (layer) {

            if (
                layer.feature ===
                feature
            ) {

                matchingLayer =
                    layer;

            }

        }
    );


    if (!matchingLayer) {

        alert(
            "Parcel geometry could not be located."
        );

        return;

    }


    hideOfficerSections();


    if (
        officerMapSection
    ) {

        officerMapSection.style.display =
            "block";

    }


    setTimeout(
        function () {

            if (officerMap) {

                officerMap.invalidateSize();


                const bounds =
                    matchingLayer.getBounds();


                if (
                    bounds.isValid()
                ) {

                    officerMap.fitBounds(
                        bounds,
                        {
                            padding:
                                [40, 40],
                            maxZoom:
                                18
                        }
                    );

                }

            }


            selectOfficerParcel(
                feature.properties,
                matchingLayer
            );

        },
        100
    );

}


// ==================================================
// OFFICER SEARCH BUTTONS
// ==================================================

if (officerSearchParcelBtn) {

    officerSearchParcelBtn.addEventListener(
        "click",
        searchOfficerParcel
    );

}


if (officerSearchBtn) {

    officerSearchBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();


            if (
                officerSearchSection
            ) {

                officerSearchSection.style.display =
                    "block";

            }

        }
    );

}


// ==================================================
// OFFICER SEARCH ENTER KEY
// ==================================================

[
    "officerLpSearch",
    "officerSurveySearch",
    "officerUlpINSearch"
].forEach(
    function (id) {

        const input =
            getElement(id);


        if (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        searchOfficerParcel();

                    }

                }
            );

        }

    }
);


// ==================================================
// OFFICER CLEAR SEARCH
// ==================================================

function clearOfficerSearch() {

    [
        "officerLpSearch",
        "officerSurveySearch",
        "officerUlpINSearch"
    ].forEach(
        function (id) {

            const input =
                getElement(id);


            if (input) {

                input.value =
                    "";

            }

        }
    );


    if (
        officerSearchMessage
    ) {

        officerSearchMessage.textContent =
            "";

    }


    if (
        officerSearchResult
    ) {

        officerSearchResult.innerHTML = `

            <h3>
                Search Result
            </h3>

            <p>
                Search for a parcel to view the result.
            </p>

        `;

    }

}


if (officerClearSearchBtn) {

    officerClearSearchBtn.addEventListener(
        "click",
        clearOfficerSearch
    );

}


if (officerClearBtn) {

    officerClearBtn.addEventListener(
        "click",
        clearOfficerSearch
    );

}


// ==================================================
// OFFICER MAP NAVIGATION
// ==================================================

if (officerMapBtn) {

    officerMapBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();


            if (
                officerMapSection
            ) {

                officerMapSection.style.display =
                    "block";

            }


            if (
                officerMap
            ) {

                setTimeout(
                    function () {

                        officerMap.invalidateSize();

                    },
                    100
                );

            }

        }
    );

}


// ==================================================
// OFFICER VERIFICATION NAVIGATION
// ==================================================

if (officerVerificationBtn) {

    officerVerificationBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();


            if (
                officerVerificationSection
            ) {

                officerVerificationSection.style.display =
                    "block";

            }


            updateVerificationSummary(
                selectedOfficerParcel
            );

        }
    );

}


// ==================================================
// OFFICER RESET MAP
// ==================================================

const officerResetMapBtn =
    getElement(
        "officerResetMapBtn"
    );


if (officerResetMapBtn) {

    officerResetMapBtn.addEventListener(
        "click",
        function () {

            if (
                officerMap &&
                officerParcelLayer
            ) {

                const bounds =
                    officerParcelLayer.getBounds();


                if (
                    bounds.isValid()
                ) {

                    officerMap.fitBounds(
                        bounds,
                        {
                            padding:
                                [20, 20]
                        }
                    );

                }

            }


            selectedOfficerParcelLayer =
                null;

        }
    );

}


// ==================================================
// OFFICER VERIFICATION QUEUE
// ==================================================

let officerVerificationQueueSection =
    getElement(
        "officerVerificationQueueSection"
    );


let officerVerificationQueueBtn =
    getElement(
        "officerVerificationQueueBtn"
    );


if (
    !officerVerificationQueueBtn &&
    officerDashboard
) {

    officerVerificationQueueBtn =
        document.createElement(
            "button"
        );


    officerVerificationQueueBtn.id =
        "officerVerificationQueueBtn";


    officerVerificationQueueBtn.textContent =
        "Verification Queue";


    officerVerificationQueueBtn.style.marginLeft =
        "8px";


    officerDashboard.appendChild(
        officerVerificationQueueBtn
    );

}


if (
    !officerVerificationQueueSection &&
    officerView
) {

    officerVerificationQueueSection =
        document.createElement(
            "div"
        );


    officerVerificationQueueSection.id =
        "officerVerificationQueueSection";


    officerVerificationQueueSection.style.display =
        "none";


    officerVerificationQueueSection.style.padding =
        "20px";


    officerVerificationQueueSection.innerHTML = `

        <div
            class="landstack-official-card"
            style="
                max-width:1000px;
                margin:0 auto;
                padding:24px;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <h2>
                        Verification Queue
                    </h2>

                    <p class="landstack-muted">
                        Parcels currently requiring
                        verification or further review.
                    </p>

                </div>


                <button
                    id="refreshVerificationQueueBtn"
                >
                    Refresh Queue
                </button>

            </div>


            <div
                id="verificationQueueStatus"
                style="
                    margin:15px 0;
                    font-weight:700;
                "
            >
                Loading...
            </div>


            <div
                id="verificationQueueList"
            ></div>

        </div>

    `;


    officerView.appendChild(
        officerVerificationQueueSection
    );

}


// ==================================================
// LOAD VERIFICATION QUEUE
// ==================================================

async function loadOfficerVerificationQueue() {

    const statusElement =
        getElement(
            "verificationQueueStatus"
        );


    const listElement =
        getElement(
            "verificationQueueList"
        );


    if (
        !statusElement ||
        !listElement
    ) {

        return;

    }


    if (!activeOfficerKey) {

        statusElement.textContent =
            "Officer session is not active.";

        return;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            throw new Error(
                "Please login again."
            );

        }


        const idToken =
            await user.getIdToken(true);


        const response =
            await fetch(
                `${SERVER_URL}/officer/verification-queue`,
                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${idToken}`,

                        "X-Officer-Key":
                            activeOfficerKey

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load verification queue."
            );

        }


        if (
            !data.items ||
            data.items.length === 0
        ) {

            statusElement.textContent =
                "No parcels currently require verification.";


            listElement.innerHTML = `

                <div
                    class="landstack-official-card"
                    style="padding:20px;"
                >

                    The verification queue is clear.

                </div>

            `;


            return;

        }


        statusElement.textContent =
            `${data.count} parcel(s) currently require action.`;


        listElement.innerHTML =
            data.items.map(
                function (
                    item,
                    index
                ) {

                    const actionText =
                        item.action ===
                        "verification_required"

                            ? "Verification Required"

                            : "Further Review Required";


                    return `

                        <div
                            class="
                                landstack-official-card
                                landstack-queue-item
                            "
                            data-queue-index="${index}"
                            style="
                                padding:18px;
                                margin-bottom:12px;
                                cursor:pointer;
                            "
                        >

                            <strong>
                                Parcel ${index + 1}
                            </strong>

                            <p>
                                LP Number:
                                ${escapeHtml(
                                    item.lp_number
                                )}
                            </p>

                            <p>
                                Survey Number:
                                ${escapeHtml(
                                    item.survey_number
                                )}
                            </p>

                            <p>
                                <strong>
                                    ${actionText}
                                </strong>
                            </p>

                            <small>
                                Last action:
                                ${escapeHtml(
                                    new Date(
                                        item.created_at
                                    ).toLocaleString()
                                )}
                            </small>

                        </div>

                    `;

                }
            ).join("");


        listElement
            .querySelectorAll(
                "[data-queue-index]"
            )
            .forEach(
                function (element) {

                    element.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    element.dataset.queueIndex
                                );


                            const queueItem =
                                data.items[index];


                            openVerificationQueueParcel(
                                queueItem
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "Verification queue loading error:",
            error
        );


        statusElement.textContent =
            "Could not load verification queue.";


        listElement.innerHTML =
            `<p>${escapeHtml(
                error.message
            )}</p>`;

    }

}


// ==================================================
// OPEN QUEUE PARCEL
// ==================================================

function openVerificationQueueParcel(
    queueItem
) {

    if (
        !queueItem ||
        !officerParcelData ||
        !officerParcelLayer
    ) {

        return;

    }


    const queueParcelId =
        normalizeSearchValue(
            queueItem.parcel_id
        );


    const queueLp =
        normalizeSearchValue(
            queueItem.lp_number
        );


    const queueSurvey =
        normalizeSearchValue(
            queueItem.survey_number
        );


    const feature =
        officerParcelData.features.find(
            function (
                item
            ) {

                const p =
                    item.properties ||
                    {};


                return (

                    (
                        queueParcelId &&
                        normalizeSearchValue(
                            p.parcel_id
                        ) ===
                        queueParcelId
                    )

                    ||

                    (
                        queueLp &&
                        normalizeSearchValue(
                            p.lp_number
                        ) ===
                        queueLp
                    )

                    ||

                    (
                        queueSurvey &&
                        normalizeSearchValue(
                            p.survey_number
                        ) ===
                        queueSurvey
                    )

                );

            }
        );


    if (!feature) {

        alert(
            "The queued parcel could not be located."
        );

        return;

    }


    locateOfficerFeature(
        feature
    );


    setTimeout(
        function () {

            const status =
                getElement(
                    "officerVerificationStatus"
                );


            if (status) {

                status.textContent =
                    queueItem.action ===
                    "verification_required"

                        ? "Verification Required"

                        : "Further Review Required";

            }

        },
        120
    );

}


// ==================================================
// QUEUE BUTTON
// ==================================================

if (officerVerificationQueueBtn) {

    officerVerificationQueueBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();


            if (
                officerVerificationQueueSection
            ) {

                officerVerificationQueueSection.style.display =
                    "block";

            }


            loadOfficerVerificationQueue();

        }
    );

}


// ==================================================
// REFRESH QUEUE
// ==================================================

const refreshVerificationQueueBtn =
    getElement(
        "refreshVerificationQueueBtn"
    );


if (refreshVerificationQueueBtn) {

    refreshVerificationQueueBtn.addEventListener(
        "click",
        loadOfficerVerificationQueue
    );

}


// ==================================================
// OFFICER VERIFICATION ACTIONS
// ==================================================

const markVerifiedBtn =
    getElement(
        "markVerifiedBtn"
    );


const requestReviewBtn =
    getElement(
        "requestReviewBtn"
    );


const viewCompleteRecordBtn =
    getElement(
        "viewCompleteRecordBtn"
    );


let removeVerificationBtn =
    getElement(
        "removeVerificationBtn"
    );


if (
    !removeVerificationBtn
) {

    const actionsContainer =
        document.querySelector(
            ".verification-actions"
        );


    if (actionsContainer) {

        removeVerificationBtn =
            document.createElement(
                "button"
            );


        removeVerificationBtn.id =
            "removeVerificationBtn";


        removeVerificationBtn.textContent =
            "Remove Verification";


        removeVerificationBtn.className =
            "landstack-danger-button";


        removeVerificationBtn.style.display =
            "none";


        actionsContainer.appendChild(
            removeVerificationBtn
        );

    }

}


// ==================================================
// GET OFFICER PARCEL KEY
// ==================================================

function getOfficerParcelKey(
    parcel
) {

    return String(
        parcel?.parcel_id ??
        parcel?.lp_number ??
        parcel?.survey_number ??
        ""
    ).trim();

}


// ==================================================
// APPLY VERIFICATION STATUS
// ==================================================

function applyVerificationStatus(
    status
) {

    const verificationStatus =
        getElement(
            "officerVerificationStatus"
        );


    const reviewStatus =
        getElement(
            "officerReviewStatus"
        );


    if (
        status ===
        "verification_required"
    ) {

        if (verificationStatus) {

            verificationStatus.textContent =
                "Verification Required";

        }


        if (reviewStatus) {

            reviewStatus.textContent =
                "This parcel has been flagged for verification.";

        }


        if (removeVerificationBtn) {

            removeVerificationBtn.style.display =
                "inline-block";

        }


        return;

    }


    if (
        status ===
        "further_review"
    ) {

        if (verificationStatus) {

            verificationStatus.textContent =
                "Further Review Required";

        }


        if (reviewStatus) {

            reviewStatus.textContent =
                "Further review has been requested for this parcel.";

        }


        if (removeVerificationBtn) {

            removeVerificationBtn.style.display =
                "inline-block";

        }


        return;

    }


    if (
        status ===
        "cleared"
    ) {

        if (verificationStatus) {

            verificationStatus.textContent =
                "Verification Cleared";

        }


        if (reviewStatus) {

            reviewStatus.textContent =
                "Verification flag has been removed.";

        }


        if (removeVerificationBtn) {

            removeVerificationBtn.style.display =
                "none";

        }


        return;

    }


    if (verificationStatus) {

        verificationStatus.textContent =
            "No Verification Required";

    }


    if (reviewStatus) {

        reviewStatus.textContent =
            "No verification action is currently recorded.";

    }


    if (removeVerificationBtn) {

        removeVerificationBtn.style.display =
            "none";

    }

}


// ==================================================
// SAVE OFFICER VERIFICATION ACTION
// ==================================================

async function saveOfficerVerificationAction(
    action,
    note
) {

    if (!selectedOfficerParcel) {

        alert(
            "Please select a parcel first."
        );

        return false;

    }


    if (!activeOfficerKey) {

        alert(
            "Officer session is not active."
        );

        return false;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            throw new Error(
                "Please login again."
            );

        }


        const idToken =
            await user.getIdToken(true);


        const response =
            await fetch(
                `${SERVER_URL}/officer/verification`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${idToken}`,

                        "X-Officer-Key":
                            activeOfficerKey

                    },

                    body:
                        JSON.stringify({

                            parcelId:
                                getOfficerParcelKey(
                                    selectedOfficerParcel
                                ),

                            lpNumber:
                                selectedOfficerParcel.lp_number,

                            surveyNumber:
                                selectedOfficerParcel.survey_number,

                            action:
                                action,

                            note:
                                note || "",

                            officerUid:
                                user.uid

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not save verification action."
            );

        }


        selectedOfficerParcel.verification_action =
            action;


        selectedOfficerParcel.verification_status =
            action;


        applyVerificationStatus(
            action
        );


        await loadOfficerVerificationQueue();

        await loadOfficerDashboardSummary();

        await loadLandStackMainDashboardCards();


        return true;


    } catch (error) {

        console.error(
            "Verification action error:",
            error
        );


        alert(
            error.message
        );


        return false;

    }

}


// ==================================================
// LOAD SAVED VERIFICATION STATUS
// ==================================================

async function loadOfficerVerificationStatus(
    parcel
) {

    if (
        !parcel ||
        !activeOfficerKey
    ) {

        return;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            return;

        }


        const idToken =
            await user.getIdToken(true);


        const parcelId =
            getOfficerParcelKey(
                parcel
            );


        const response =
            await fetch(

                `${SERVER_URL}/officer/verification?parcelId=` +
                encodeURIComponent(
                    parcelId
                ),

                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${idToken}`,

                        "X-Officer-Key":
                            activeOfficerKey

                    }

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load verification status."
            );

        }


        const currentStatus =
            data.status ||
            "none";


        parcel.verification_action =
            currentStatus;


        parcel.verification_status =
            currentStatus;


        applyVerificationStatus(
            currentStatus
        );


    } catch (error) {

        console.error(
            "Verification status loading error:",
            error
        );

    }

}


// ==================================================
// MARK FOR VERIFICATION
// ==================================================

if (markVerifiedBtn) {

    markVerifiedBtn.addEventListener(
        "click",
        async function () {

            await saveOfficerVerificationAction(
                "verification_required",
                "Officer flagged parcel for verification."
            );

        }
    );

}


// ==================================================
// REQUEST FURTHER REVIEW
// ==================================================

if (requestReviewBtn) {

    requestReviewBtn.addEventListener(
        "click",
        async function () {

            await saveOfficerVerificationAction(
                "further_review",
                "Officer requested further review."
            );

        }
    );

}


// ==================================================
// REMOVE VERIFICATION
// ==================================================

if (removeVerificationBtn) {

    removeVerificationBtn.addEventListener(
        "click",
        async function () {

            if (
                !confirm(
                    "Remove the verification flag for this parcel?"
                )
            ) {

                return;

            }


            await saveOfficerVerificationAction(
                "cleared",
                "Officer cleared the verification requirement."
            );

        }
    );

}


// ==================================================
// VIEW COMPLETE RECORD
// ==================================================

if (viewCompleteRecordBtn) {

    viewCompleteRecordBtn.addEventListener(
        "click",
        function () {

            if (!selectedOfficerParcel) {

                alert(
                    "Please select a parcel first."
                );

                return;

            }


            showOfficerParcelInformation(
                selectedOfficerParcel
            );


            const status =
                getElement(
                    "officerVerificationStatus"
                );


            if (status) {

                status.textContent =
                    "Complete parcel record loaded for officer review";

            }


            updateVerificationSummary(
                selectedOfficerParcel
            );

        }
    );

}

// ==================================================
// SHOW / HIDE PASSWORD
// ==================================================

function createPasswordToggle(
    passwordId,
    checkboxId
) {

    const passwordInput =
        getElement(passwordId);


    if (!passwordInput) {

        return;

    }


    let checkbox =
        getElement(checkboxId);


    // Create checkbox if it does not already exist

    if (!checkbox) {

        const label =
            document.createElement(
                "label"
            );


        label.style.display =
            "block";


        label.style.marginTop =
            "8px";


        label.style.cursor =
            "pointer";


        label.style.fontSize =
            "14px";


        checkbox =
            document.createElement(
                "input"
            );


        checkbox.type =
            "checkbox";


        checkbox.id =
            checkboxId;


        label.appendChild(
            checkbox
        );


        label.appendChild(
            document.createTextNode(
                " Show Password"
            )
        );


        passwordInput.parentNode.insertBefore(
            label,
            passwordInput.nextSibling
        );

    }


    checkbox.addEventListener(
        "change",
        function () {

            passwordInput.type =
                checkbox.checked
                    ? "text"
                    : "password";

        }
    );

}


createPasswordToggle(
    "loginPassword",
    "showLoginPassword"
);

createPasswordToggle(
    "registerPassword",
    "showRegisterPassword"
);

createPasswordToggle(
    "officerKey",
    "showOfficerKey"
);


// ==================================================
// OFFICER DASHBOARD BUTTON
// ==================================================

const officerDashboardBtn =
    document.getElementById(
        "officerDashboardBtn"
    );


if (officerDashboardBtn) {

    officerDashboardBtn.addEventListener(
        "click",
        async function () {

            hideOfficerSections();

            if (officerDashboard) {

                officerDashboard.style.display =
                    "block";

            }


            await loadOfficerDashboardSummary();

        }
    );

}


// ==================================================
// OFFICER QUICK ACTION - OPEN MAP
// ==================================================

const officerOpenMapBtn =
    document.getElementById(
        "officerOpenMapBtn"
    );


if (officerOpenMapBtn) {

    officerOpenMapBtn.addEventListener(
        "click",
        async function () {

            hideOfficerSections();

            if (officerMapSection) {

                officerMapSection.style.display =
                    "block";

            }

            await loadOfficerParcelMap();

            if (officerMap) {

                setTimeout(
                    function () {

                        officerMap.invalidateSize();

                    },
                    100
                );

            }

        }
    );

}


// ==================================================
// OFFICER QUICK ACTION - OPEN SEARCH
// ==================================================

const officerOpenSearchBtn =
    document.getElementById(
        "officerOpenSearchBtn"
    );


if (officerOpenSearchBtn) {

    officerOpenSearchBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();

            if (officerSearchSection) {

                officerSearchSection.style.display =
                    "block";

            }

        }
    );

}


// ==================================================
// OFFICER QUICK ACTION - OPEN VERIFICATION
// ==================================================

const officerOpenVerificationBtn =
    document.getElementById(
        "officerOpenVerificationBtn"
    );


if (officerOpenVerificationBtn) {

    officerOpenVerificationBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();

            if (officerVerificationSection) {

                officerVerificationSection.style.display =
                    "block";

            }

            updateVerificationSummary(
                selectedOfficerParcel
            );

        }
    );

}
// ==================================================
// OFFICER QUICK ACTION - AUDIT HISTORY
// ==================================================

const officerOpenAuditBtn =
    document.getElementById(
        "officerOpenAuditBtn"
    );


const officerAuditHistory =
    document.getElementById(
        "officerAuditHistory"
    );


const officerAuditList =
    document.getElementById(
        "officerAuditList"
    );


const officerRefreshAuditBtn =
    document.getElementById(
        "officerRefreshAuditBtn"
    );


const officerAuditBackBtn =
    document.getElementById(
        "officerAuditBackBtn"
    );


// --------------------------------------------------
// OPEN AUDIT HISTORY
// --------------------------------------------------

if (officerOpenAuditBtn) {

    officerOpenAuditBtn.addEventListener(
        "click",
        async function () {

            hideOfficerSections();

            if (officerAuditHistory) {

                officerAuditHistory.style.display =
                    "block";

            }

            await loadOfficerAuditHistory();

        }
    );

}


// --------------------------------------------------
// LOAD AUDIT HISTORY
// --------------------------------------------------

async function loadOfficerAuditHistory() {

    if (!officerAuditList) {
        return;
    }


    officerAuditList.innerHTML =
        "<p>Loading audit history...</p>";


    try {

        if (
            !auth ||
            !auth.currentUser
        ) {

            officerAuditList.innerHTML =
                "<p>Officer session not available.</p>";

            return;

        }


        const idToken =
            await auth.currentUser.getIdToken(
                true
            );


        const response =
            await fetch(
                "http://localhost:5000/officer/audit-history",
                {
                    method: "GET",

                    headers: {
    "Authorization":
        `Bearer ${idToken}`,

    "X-Officer-Key":
        activeOfficerKey
}
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Could not load audit history."
            );

        }


        const history =
            result.history || [];


        if (history.length === 0) {

            officerAuditList.innerHTML =
                "<p>No audit history found.</p>";

            return;

        }


        officerAuditList.innerHTML =
            history
                .map(
                    function (item) {

                        let details = {};

                        try {

                            details =
                                JSON.parse(
                                    item.action_details ||
                                    "{}"
                                );

                        } catch (error) {

                            details = {};

                        }


                        const parcel =
                            details.parcel_id ||
                            item.record_id ||
                            "Unknown";


                        const officer =
                            item.officer_name ||
                            "Unknown officer";


                        const date =
                            item.created_at
                                ? new Date(
                                    item.created_at
                                ).toLocaleString()
                                : "Unknown";


                        let changes =
                            "Parcel updated";


                        if (
                            details.updates
                        ) {

                            const updateParts = [];


                            if (
                                details.updates.mutation &&
                                details.updates.mutation.status
                            ) {

                                updateParts.push(
                                    `Mutation: ${details.updates.mutation.status}`
                                );

                            }


                            if (
                                details.updates.planning &&
                                details.updates.planning.status
                            ) {

                                updateParts.push(
                                    `Planning: ${details.updates.planning.status}`
                                );

                            }


                            if (
                                details.updates.building &&
                                details.updates.building.status
                            ) {

                                updateParts.push(
                                    `Building: ${details.updates.building.status}`
                                );

                            }


                            if (
                                details.updates.restriction &&
                                details.updates.restriction.status
                            ) {

                                updateParts.push(
                                    `Restriction: ${details.updates.restriction.status}`
                                );

                            }


                            if (
                                details.updates.propertyTax &&
                                details.updates.propertyTax.taxStatus
                            ) {

                                updateParts.push(
                                    `Property Tax: ${details.updates.propertyTax.taxStatus}`
                                );

                            }


                            if (
                                details.updates.landTax &&
                                details.updates.landTax.taxStatus
                            ) {

                                updateParts.push(
                                    `Land Tax: ${details.updates.landTax.taxStatus}`
                                );

                            }


                            if (
                                updateParts.length > 0
                            ) {

                                changes =
                                    updateParts.join(
                                        " • "
                                    );

                            }

                        }


                        return `
                            <div
                                style="
                                    border:1px solid #ddd;
                                    border-radius:10px;
                                    padding:14px;
                                    margin-bottom:12px;
                                    background:#fff;
                                "
                            >

                                <strong>
                                    ${officer}
                                </strong>

                                <div
                                    style="
                                        margin-top:6px;
                                    "
                                >
                                    Parcel:
                                    <strong>
                                        ${parcel}
                                    </strong>
                                </div>

                                <div
                                    style="
                                        margin-top:4px;
                                    "
                                >
                                    Action:
                                    ${item.action || "Updated"}
                                </div>

                                <div
                                    style="
                                        margin-top:4px;
                                    "
                                >
                                    Changes:
                                    ${changes}
                                </div>

                                <div
                                    style="
                                        margin-top:6px;
                                        font-size:13px;
                                        opacity:0.7;
                                    "
                                >
                                    ${date}
                                </div>

                            </div>
                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Audit history error:",
            error
        );


        officerAuditList.innerHTML =
            `
            <p>
                Could not load audit history.
            </p>
            `;

    }

}


// --------------------------------------------------
// REFRESH AUDIT HISTORY
// --------------------------------------------------

if (officerRefreshAuditBtn) {

    officerRefreshAuditBtn.addEventListener(
        "click",
        function () {

            loadOfficerAuditHistory();

        }
    );

}


// --------------------------------------------------
// BACK TO OFFICER DASHBOARD
// --------------------------------------------------

if (officerAuditBackBtn) {

    officerAuditBackBtn.addEventListener(
        "click",
        function () {

            hideOfficerSections();

            const dashboard =
                document.getElementById(
                    "officerDashboard"
                );


            if (dashboard) {

                dashboard.style.display =
                    "block";

            }

        }
    );

}

// ==================================================
// OFFICER MAP CLEAR SELECTION
// ==================================================

const officerClearSelectionBtn =
    document.getElementById(
        "officerClearSelectionBtn"
    );


if (officerClearSelectionBtn) {

    officerClearSelectionBtn.addEventListener(
        "click",
        function () {

            if (
                selectedOfficerParcelLayer &&
                officerParcelLayer
            ) {

                officerParcelLayer.resetStyle(
                    selectedOfficerParcelLayer
                );

            }


            selectedOfficerParcelLayer =
                null;

            selectedOfficerParcel =
                null;


            const parcelInfo =
                document.getElementById(
                    "officerParcelInfo"
                );


            if (parcelInfo) {

                parcelInfo.innerHTML = `

                    <h3>
                        Selected Parcel
                    </h3>

                    <p>
                        Select a parcel to inspect
                        its integrated information.
                    </p>

                `;

            }


            const status =
                document.getElementById(
                    "officerMapSelectionStatus"
                );


            if (status) {

                status.textContent =
                    "No parcel selected";

            }


            const verificationStatus =
                document.getElementById(
                    "officerVerificationStatus"
                );


            if (verificationStatus) {

                verificationStatus.textContent =
                    "No parcel selected";

            }


            const verificationParcel =
                document.getElementById(
                    "officerVerificationParcel"
                );


            if (verificationParcel) {

                verificationParcel.textContent =
                    "—";

            }


            updateVerificationSummary(
                null
            );

        }
    );

}


// ==================================================
// INITIAL OFFICER STATE
// ==================================================

hideOfficerSections();


// ==================================================
// CITIZEN PORTAL UI REDESIGN
// ==================================================

(function setupCitizenPortalRedesign() {

    const style =
        document.createElement("style");


    style.id =
        "landstack-citizen-redesign-style";


    style.textContent = `

        #citizenMapStack {
            width: 100% !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
        }


        #citizenMapStack #map {
            width: 100% !important;
            height: 580px !important;
            min-height: 420px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            background: #eef2f7 !important;
            overflow: hidden !important;
        }


        #citizenMapStack #mapSelectionStatus {
            margin: -4px 0 0 0 !important;
            padding: 10px 12px !important;
            border: 1px solid #d7dee8 !important;
            border-radius: 3px !important;
            background: #f8fafc !important;
            color: #334155 !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
        }


        #citizenMapStack #parcelInfo {
            width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 20px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            background: #ffffff !important;
            box-shadow:
                0 1px 3px rgba(15, 23, 42, 0.08) !important;
        }


        #citizenMapStack #parcelInfo .ls-parcel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 1px solid #dbe2ea;
        }


        #citizenMapStack #parcelInfo .ls-parcel-title {
            margin: 0;
            color: #12355b;
            font-size: 19px;
            font-weight: 700;
        }


        #citizenMapStack #parcelInfo .ls-parcel-subtitle {
            margin: 4px 0 0 0;
            color: #64748b;
            font-size: 12px;
        }


        #citizenMapStack #parcelInfo .ls-info-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 12px;
        }


        #citizenMapStack #parcelInfo .ls-info-item {
            min-width: 0;
            padding: 12px 13px;
            border: 1px solid #e2e8f0;
            border-radius: 3px;
            background: #f8fafc;
            box-sizing: border-box;
        }


        #citizenMapStack #parcelInfo .ls-info-label {
            display: block;
            margin-bottom: 5px;
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }


        #citizenMapStack #parcelInfo .ls-info-value {
            display: block;
            color: #1e293b;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.4;
            word-break: break-word;
        }


        #citizenMapStack #parcelInfo .ls-status-heading {
            margin: 20px 0 10px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            color: #12355b;
            font-size: 14px;
            font-weight: 700;
        }


        #citizenMapStack #parcelInfo .ls-status-grid {
            display: grid;
            grid-template-columns:
                repeat(3, minmax(0, 1fr));
            gap: 12px;
        }


        #citizenMapStack #parcelInfo .ls-status-item {
            padding: 12px 13px;
            border: 1px solid #e2e8f0;
            border-radius: 3px;
            background: #ffffff;
        }


        #citizenMapStack #parcelInfo .ls-status-value {
            display: block;
            margin-top: 5px;
            color: #1e293b;
            font-size: 14px;
            font-weight: 700;
        }


        #citizenMapStack #parcelInfo .ls-empty-state {
            padding: 22px;
            text-align: center;
        }


        #citizenMapStack #parcelInfo .ls-empty-title {
            margin: 0 0 7px 0;
            color: #12355b;
            font-size: 17px;
            font-weight: 700;
        }


        #citizenMapStack #parcelInfo .ls-empty-text {
            margin: 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }


        @media (max-width: 1050px) {

            #citizenMapStack #parcelInfo .ls-info-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }


            #citizenMapStack #parcelInfo .ls-status-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 720px) {

            #citizenMapStack {
                width: 100% !important;
                gap: 12px !important;
            }


            #citizenMapStack #map {
                height: 420px !important;
                min-height: 320px !important;
                border-radius: 3px !important;
            }


            #citizenMapStack #parcelInfo {
                padding: 14px !important;
            }


            #citizenMapStack #parcelInfo .ls-parcel-header {
                display: block;
            }


            #citizenMapStack #parcelInfo .ls-info-grid {
                grid-template-columns:
                    1fr !important;
                gap: 9px !important;
            }


            #citizenMapStack #parcelInfo .ls-status-grid {
                grid-template-columns:
                    1fr !important;
                gap: 9px !important;
            }


            #citizenMapStack #parcelInfo .ls-info-item,
            #citizenMapStack #parcelInfo .ls-status-item {
                padding: 10px 11px;
            }


            #citizenMapStack #parcelInfo .ls-parcel-title {
                font-size: 17px;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    function arrangeCitizenParcelLayout() {

        const citizenView =
            document.getElementById(
                "citizenView"
            );

        const map =
            document.getElementById(
                "map"
            );

        const parcelInfo =
            document.getElementById(
                "parcelInfo"
            );


        if (
            !citizenView ||
            !map ||
            !parcelInfo
        ) {

            return;

        }


        const mapPanel =
            map.parentElement;


        if (!mapPanel) {

            return;

        }


        let stack =
            document.getElementById(
                "citizenMapStack"
            );


        if (!stack) {

            stack =
                document.createElement(
                    "div"
                );


            stack.id =
                "citizenMapStack";


            const mapPanelParent =
                mapPanel.parentElement;


            if (!mapPanelParent) {

                return;

            }


            mapPanelParent.insertBefore(
                stack,
                mapPanel
            );


            stack.appendChild(
                mapPanel
            );

        }


        if (
            parcelInfo.parentElement !==
            stack
        ) {

            stack.appendChild(
                parcelInfo
            );

        }


        mapPanel.style.width =
            "100%";


        mapPanel.style.minWidth =
            "0";

    }


    arrangeCitizenParcelLayout();


    setTimeout(
        arrangeCitizenParcelLayout,
        300
    );


    setTimeout(
        arrangeCitizenParcelLayout,
        1000
    );


    const citizenButton =
        document.getElementById(
            "citizenViewBtn"
        );


    if (citizenButton) {

        citizenButton.addEventListener(
            "click",
            function () {

                setTimeout(
                    function () {

                        arrangeCitizenParcelLayout();


                        if (landMap) {

                            landMap.invalidateSize();

                        }

                    },
                    250
                );

            }
        );

    }

})();


// ==========================================================
// CITIZEN PARCEL INFORMATION DISPLAY
// ==========================================================

showParcelInformation = function (
    parcel
) {

    const parcelInfo =
        document.getElementById(
            "parcelInfo"
        );


    if (!parcelInfo) {

        return;

    }


    function valueOrDefault(
        value,
        fallback = "Not available"
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return fallback;

        }

        return String(value);

    }


    function addInfoItem(
        label,
        value
    ) {

        return `
            <div class="ls-info-item">
                <span class="ls-info-label">
                    ${label}
                </span>

                <span class="ls-info-value">
                    ${escapeHtml(
                        valueOrDefault(value)
                    )}
                </span>
            </div>
        `;

    }


    function addStatusItem(
        label,
        value
    ) {

        return `
            <div class="ls-status-item">
                <span class="ls-info-label">
                    ${label}
                </span>

                <span class="ls-status-value">
                    ${escapeHtml(
                        valueOrDefault(value)
                    )}
                </span>
            </div>
        `;

    }


    parcelInfo.innerHTML = `

        <div class="ls-parcel-header">

            <div>

                <h3 class="ls-parcel-title">
                    Selected Land Parcel
                </h3>

                <p class="ls-parcel-subtitle">
                    Public parcel information
                </p>

            </div>

        </div>


        <div class="ls-info-grid">

            ${addInfoItem(
                "Parcel ID",
                parcel.parcel_id
            )}

            ${addInfoItem(
                "LP Number",
                parcel.lp_number
            )}

            ${addInfoItem(
                "Survey Number",
                parcel.survey_number
            )}

            ${addInfoItem(
                "Subdivision",
                parcel.subdivision_number
            )}

            ${addInfoItem(
                "ULPIN",
                parcel.ulpin
            )}

            ${addInfoItem(
                "Area (sq. yd.)",
                parcel.area_sq_yards
            )}

            ${addInfoItem(
                "Village",
                parcel.village
            )}

            ${addInfoItem(
                "Mandal",
                parcel.mandal
            )}

            ${addInfoItem(
                "District",
                parcel.district
            )}

            ${addInfoItem(
                "State",
                parcel.state
            )}

            ${addInfoItem(
                "Land Use",
                parcel.land_use ||
                parcel.current_land_use
            )}

            ${addInfoItem(
                "Record Status",
                parcel.status ||
                parcel.citizen_status
            )}

        </div>


        <div class="ls-status-heading">
            Public Record Indicators
        </div>


        <div class="ls-status-grid">

            ${addStatusItem(
                "Active Dispute",
                parcel.dispute_indicator ||
                "No active dispute recorded"
            )}

            ${addStatusItem(
                "Encumbrance",
                parcel.encumbrance_indicator ||
                "No active encumbrance recorded"
            )}

            ${addStatusItem(
                "Verification",
                parcel.verification_status ||
                "Not available"
            )}

        </div>

    `;

};


// ==========================================================
// CITIZEN CLEAR SELECTION REDESIGN
// ==========================================================

clearParcelSelection = function () {

    if (
        selectedParcelLayer &&
        parcelLayer
    ) {

        parcelLayer.resetStyle(
            selectedParcelLayer
        );

    }


    selectedParcelLayer =
        null;


    selectedCitizenParcel =
        null;


    citizenDetailedAccessGranted =
        false;


    updateMapSelectionStatus(
        "No parcel selected"
    );


    const parcelInfo =
        document.getElementById(
            "parcelInfo"
        );


    if (parcelInfo) {

        parcelInfo.innerHTML = `

            <div class="ls-empty-state">

                <h3 class="ls-empty-title">
                    Land Parcel Information
                </h3>

                <p class="ls-empty-text">
                    Select a parcel on the map or
                    search using LP Number, Survey Number,
                    or ULPIN to view public parcel information.
                </p>

            </div>

        `;

    }

};


// ==================================================
// FINAL LANDSTACK INITIALIZATION
// ==================================================

if (
    activeOfficerKey &&
    auth.currentUser
) {

    setTimeout(
        function () {

            loadOfficerDashboardSummary();

        },
        500
    );

}


// ==================================================
// END OF LANDSTACK APP.JS
// ==================================================


// ==========================================================
// LANDSTACK MAIN OFFICER DASHBOARD CARDS
// ==========================================================

(function setupLandStackMainDashboardCards() {

    if (
        document.getElementById(
            "landstackMainDashboardCardStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "landstackMainDashboardCardStyles";


    style.textContent = `

        #landstackMainDashboardCards {
            width: 100%;
            box-sizing: border-box;
            margin: 0 0 22px 0;
        }


        .ls-main-dashboard-heading {
            margin: 0 0 6px 0;
            color: #123b5d;
            font-size: 21px;
            font-weight: 700;
        }


        .ls-main-dashboard-subheading {
            margin: 0 0 18px 0;
            color: #65727e;
            font-size: 13px;
        }


        .ls-main-dashboard-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 14px;
        }


        .ls-main-dashboard-card {
            box-sizing: border-box;
            min-height: 122px;
            padding: 17px;
            background: #ffffff;
            border: 1px solid #c8d1d9;
            border-top: 4px solid #123b5d;
            border-radius: 5px;
            box-shadow:
                0 2px 7px rgba(24, 44, 61, 0.07);
            cursor: pointer;
        }


        .ls-main-dashboard-card:hover {
            background: #f7fafc;
            border-color: #aebbc6;
        }


        .ls-main-dashboard-card.disabled {
            cursor: default;
        }


        .ls-main-dashboard-card.disabled:hover {
            background: #ffffff;
            border-color: #c8d1d9;
        }


        .ls-main-dashboard-label {
            color: #65727e;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }


        .ls-main-dashboard-number {
            margin-top: 9px;
            color: #123b5d;
            font-size: 30px;
            line-height: 1;
            font-weight: 700;
        }


        .ls-main-dashboard-link {
            margin-top: 10px;
            color: #164968;
            font-size: 12px;
        }


        .ls-main-dashboard-panel {
            margin-top: 18px;
            padding: 18px;
            background: #ffffff;
            border: 1px solid #c8d1d9;
            border-top: 4px solid #123b5d;
            border-radius: 5px;
            box-shadow:
                0 2px 7px rgba(24, 44, 61, 0.07);
        }


        .ls-main-dashboard-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }


        .ls-main-dashboard-panel-title {
            margin: 0;
            color: #123b5d;
            font-size: 18px;
        }


        .ls-main-dashboard-panel-subtitle {
            margin: 3px 0 0 0;
            color: #65727e;
            font-size: 12px;
        }


        .ls-main-dashboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 12px 13px;
            margin-bottom: 8px;
            background: #fbfcfd;
            border: 1px solid #dbe2e8;
            border-radius: 4px;
            cursor: pointer;
        }


        .ls-main-dashboard-item:last-child {
            margin-bottom: 0;
        }


        .ls-main-dashboard-item:hover {
            background: #f4f8fa;
        }


        .ls-main-dashboard-reference {
            color: #123b5d;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
        }


        .ls-main-dashboard-item-note {
            color: #65727e;
            font-size: 12px;
        }


        @media (max-width: 1100px) {

            .ls-main-dashboard-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 700px) {

            .ls-main-dashboard-grid {
                grid-template-columns: 1fr;
            }


            .ls-main-dashboard-item {
                display: block;
            }

        }

    `;


    document.head.appendChild(
        style
    );


})();


// ==========================================================
// MAIN DASHBOARD CARD HELPERS
// ==========================================================

function landStackDashboardNormalize(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


function landStackDashboardDue(
    value
) {

    return landStackDashboardNormalize(
        value
    ).includes(
        "due"
    );

}


function landStackDashboardPending(
    value
) {

    return landStackDashboardNormalize(
        value
    ).includes(
        "pending"
    );

}


function landStackDashboardHasDispute(
    parcel
) {

    const values = [

        parcel?.dispute_indicator,

        parcel?.dispute_status,

        parcel?.dispute_current_status

    ]
        .map(
            landStackDashboardNormalize
        )
        .filter(
            Boolean
        );


    return values.some(
        function (value) {

            return (

                value === "yes" ||

                value.includes("active") ||

                value.includes("recorded") ||

                value.includes("pending") ||

                value.includes("case") ||

                (
                    value !== "no" &&
                    value !== "none" &&
                    value !== "clear" &&
                    value !== "cleared" &&
                    !value.includes(
                        "not available"
                    ) &&
                    !value.includes(
                        "not recorded"
                    ) &&
                    !value.includes(
                        "no active"
                    )

                )

            );

        }
    );

}


function landStackDashboardHasEncumbrance(
    parcel
) {

    const values = [

        parcel?.encumbrance_indicator,

        parcel?.encumbrance_status,

        parcel?.encumbrance_type

    ]
        .map(
            landStackDashboardNormalize
        )
        .filter(
            Boolean
        );


    return values.some(
        function (value) {

            return (

                value === "yes" ||

                value.includes("active") ||

                value.includes("encumbered") ||

                (
                    value !== "no" &&
                    value !== "none" &&
                    value !== "clear" &&
                    value !== "cleared" &&
                    !value.includes(
                        "not available"
                    ) &&
                    !value.includes(
                        "not recorded"
                    ) &&
                    !value.includes(
                        "no active"
                    )

                )

            );

        }
    );

}


function landStackDashboardReference(
    parcel
) {

    const references = [];


    const lp =
        displayValue(
            parcel?.lp_number
        );


    const survey =
        displayValue(
            parcel?.survey_number
        );


    const ulpin =
        displayValue(
            parcel?.ulpin ||
            parcel?.lp_number
        );


    if (
        lp !== "Not available" &&
        lp !== "0"
    ) {

        references.push(
            `LP ${lp}`
        );

    }


    if (
        survey !== "Not available" &&
        survey !== "0"
    ) {

        references.push(
            `Survey ${survey}`
        );

    }


    if (
        ulpin !== "Not available" &&
        ulpin !== "0"
    ) {

        references.push(
            `ULPIN ${ulpin}`
        );

    }


    return references.length
        ? references.join(" | ")
        : (
            parcel?.parcel_id ||
            "Parcel"
        );

}


// ==========================================================
// OPEN PARCEL FROM DASHBOARD
// ==========================================================

function openLandStackDashboardParcel(
    parcel
) {

    if (
        !parcel ||
        !officerParcelData ||
        !officerParcelData.features
    ) {

        return;

    }


    const parcelId =
        landStackDashboardNormalize(
            parcel.parcel_id
        );


    const lp =
        landStackDashboardNormalize(
            parcel.lp_number
        );


    const survey =
        landStackDashboardNormalize(
            parcel.survey_number
        );


    const feature =
        officerParcelData.features.find(
            function (item) {

                const p =
                    item.properties ||
                    {};


                return (

                    (
                        parcelId &&
                        landStackDashboardNormalize(
                            p.parcel_id
                        ) ===
                        parcelId
                    )

                    ||

                    (
                        lp &&
                        landStackDashboardNormalize(
                            p.lp_number
                        ) ===
                        lp
                    )

                    ||

                    (
                        survey &&
                        landStackDashboardNormalize(
                            p.survey_number
                        ) ===
                        survey
                    )

                );

            }
        );


    if (!feature) {

        alert(
            "The selected parcel could not be located."
        );

        return;

    }


    locateOfficerFeature(
        feature
    );

}


// ==========================================================
// RENDER DASHBOARD WORK LIST
// ==========================================================

function renderLandStackDashboardWorkList(
    title,
    subtitle,
    parcels
) {

    const panel =
        getElement(
            "landstackMainDashboardWorkList"
        );


    if (!panel) {
        return;
    }


    panel.innerHTML = `

        <div class="ls-main-dashboard-panel">

            <div
                class="ls-main-dashboard-panel-header"
            >

                <div>

                    <h3
                        class="ls-main-dashboard-panel-title"
                    >
                        ${escapeHtml(title)}
                    </h3>

                    <p
                        class="ls-main-dashboard-panel-subtitle"
                    >
                        ${escapeHtml(subtitle)}
                    </p>

                </div>

                <span class="landstack-status-pill">
                    ${parcels.length} parcel(s)
                </span>

            </div>


            ${
                parcels.length === 0

                    ? `

                        <p class="landstack-muted">
                            No affected parcels are currently recorded.
                        </p>

                    `

                    :

                parcels.map(
                    function (parcel) {

                        return `

                            <div
                                class="
                                    ls-main-dashboard-item
                                "
                                data-main-dashboard-parcel-id="${
                                    escapeHtml(
                                        parcel.parcel_id
                                    )
                                }"
                            >

                                <div>

                                    <div
                                        class="
                                            ls-main-dashboard-reference
                                        "
                                    >
                                        ${escapeHtml(
                                            landStackDashboardReference(
                                                parcel
                                            )
                                        )}
                                    </div>

                                </div>

                                <div
                                    class="
                                        ls-main-dashboard-item-note
                                    "
                                >
                                    Open parcel record
                                </div>

                            </div>

                        `;

                    }
                ).join("")

            }

        </div>

    `;


    panel
        .querySelectorAll(
            "[data-main-dashboard-parcel-id]"
        )
        .forEach(
            function (element) {

                element.addEventListener(
                    "click",
                    function () {

                        const id =
                            landStackDashboardNormalize(
                                element.dataset
                                    .mainDashboardParcelId
                            );


                        const parcel =
                            parcels.find(
                                function (item) {

                                    return (
                                        landStackDashboardNormalize(
                                            item.parcel_id
                                        ) ===
                                        id
                                    );

                                }
                            );


                        if (parcel) {

                            openLandStackDashboardParcel(
                                parcel
                            );

                        }

                    }
                );

            }
        );

}


// ==========================================================
// LOAD MAIN DASHBOARD CARDS
// ==========================================================

async function loadLandStackMainDashboardCards() {

    const dashboard =
        document.getElementById(
            "officerDashboard"
        );


    if (!dashboard) {
        return;
    }


    if (!activeOfficerKey) {
        return;
    }


    const user =
        auth.currentUser;


    if (!user) {
        return;
    }


    try {

        const idToken =
            await user.getIdToken(true);


        const headers = {

            Authorization:
                `Bearer ${idToken}`,

            "X-Officer-Key":
                activeOfficerKey

        };


        const parcelResponse =
            await fetch(
                `${SERVER_URL}/api/officer/parcels`,
                {

                    method:
                        "GET",

                    headers:
                        headers

                }
            );


        const parcelPayload =
            await parcelResponse.json();


        if (!parcelResponse.ok) {

            throw new Error(
                parcelPayload.message ||
                "Could not load officer parcel data."
            );

        }


        const parcels =
            Array.isArray(
                parcelPayload.features
            )
                ? parcelPayload.features.map(
                    function (feature) {

                        return (
                            feature.properties ||
                            feature
                        );

                    }
                )
                : [];


        let queueItems =
            [];


        try {

            const queueResponse =
                await fetch(
                    `${SERVER_URL}/officer/verification-queue`,
                    {

                        method:
                            "GET",

                        headers:
                            headers

                    }
                );


            const queuePayload =
                await queueResponse.json();


            if (
                queueResponse.ok &&
                Array.isArray(
                    queuePayload.items
                )
            ) {

                queueItems =
                    queuePayload.items;

            }

        } catch (queueError) {

            console.warn(
                "Dashboard verification queue read failed:",
                queueError
            );

        }


        const verificationRequired =
            queueItems.filter(
                function (item) {

                    return (
                        item.action ===
                        "verification_required"
                    );

                }
            );


        const furtherReview =
            queueItems.filter(
                function (item) {

                    return (
                        item.action ===
                        "further_review"
                    );

                }
            );


        const cleared =
            parcels.filter(
                function (parcel) {

                    return (
                        landStackDashboardNormalize(
                            parcel.verification_status
                        ) ===
                        "cleared"
                    );

                }
            );


        const disputes =
            parcels.filter(
                landStackDashboardHasDispute
            );


        const encumbrances =
            parcels.filter(
                landStackDashboardHasEncumbrance
            );


        const propertyTaxDue =
            parcels.filter(
                function (parcel) {

                    return landStackDashboardDue(
                        parcel.tax_status
                    );

                }
            );


        const pendingMutations =
            parcels.filter(
                function (parcel) {

                    return landStackDashboardPending(
                        parcel.mutation_status
                    );

                }
            );


        let container =
            document.getElementById(
                "landstackMainDashboardCards"
            );


        if (!container) {

            container =
                document.createElement(
                    "div"
                );


            container.id =
                "landstackMainDashboardCards";


            dashboard.insertBefore(
                container,
                dashboard.firstChild
            );

        }


        container.innerHTML = `

            <div>

                <h2
                    class="ls-main-dashboard-heading"
                >
                    LandStack Dashboard
                </h2>

                <p
                    class="ls-main-dashboard-subheading"
                >
                    Current integrated land-record work status
                    for officer operations.
                </p>

            </div>


            <div
                class="ls-main-dashboard-grid"
            >

                <div
                    class="
                        ls-main-dashboard-card
                        disabled
                    "
                    data-main-card-type="total"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Total Land Parcels
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${parcels.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        Registered parcel dataset
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="verification_required"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Verification Required
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${verificationRequired.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="further_review"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Further Review
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${furtherReview.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="cleared"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Cleared / Verified
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${cleared.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="disputes"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Land Disputes
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${disputes.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="encumbrances"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Active Encumbrances
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${encumbrances.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="property_tax_due"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Property Tax Due
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${propertyTaxDue.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>


                <div
                    class="ls-main-dashboard-card"
                    data-main-card-type="pending_mutations"
                >

                    <div
                        class="ls-main-dashboard-label"
                    >
                        Pending Mutations
                    </div>

                    <div
                        class="ls-main-dashboard-number"
                    >
                        ${pendingMutations.length}
                    </div>

                    <div
                        class="ls-main-dashboard-link"
                    >
                        View affected parcels
                    </div>

                </div>

            </div>


            <div
                id="landstackMainDashboardWorkList"
            >

                <div
                    class="ls-main-dashboard-panel"
                >

                    <h3
                        class="ls-main-dashboard-panel-title"
                    >
                        Dashboard Work List
                    </h3>

                    <p
                        class="ls-main-dashboard-panel-subtitle"
                    >
                        Select a dashboard card to view
                        the affected parcel references.
                    </p>

                </div>

            </div>

        `;


        const cardData = {

            verification_required:
                verificationRequired.map(
                    function (item) {

                        return {

                            parcel_id:
                                item.parcel_id,

                            lp_number:
                                item.lp_number,

                            survey_number:
                                item.survey_number,

                            ulpin:
                                item.ulpin ||
                                item.lp_number

                        };

                    }
                ),

            further_review:
                furtherReview.map(
                    function (item) {

                        return {

                            parcel_id:
                                item.parcel_id,

                            lp_number:
                                item.lp_number,

                            survey_number:
                                item.survey_number,

                            ulpin:
                                item.ulpin ||
                                item.lp_number

                        };

                    }
                ),

            cleared:
                cleared,

            disputes:
                disputes,

            encumbrances:
                encumbrances,

            property_tax_due:
                propertyTaxDue,

            pending_mutations:
                pendingMutations

        };


        container
            .querySelectorAll(
                "[data-main-card-type]"
            )
            .forEach(
                function (card) {

                    card.addEventListener(
                        "click",
                        function () {

                            const type =
                                card.dataset
                                    .mainCardType;


                            if (
                                type ===
                                "total"
                            ) {

                                return;

                            }


                            const items =
                                cardData[
                                    type
                                ] ||
                                [];


                            const titles = {

                                verification_required:
                                    [
                                        "Verification Required",
                                        "Parcels currently in the officer verification queue."
                                    ],

                                further_review:
                                    [
                                        "Further Review",
                                        "Parcels currently requiring additional review."
                                    ],

                                cleared:
                                    [
                                        "Cleared / Verified",
                                        "Parcels with a cleared verification status."
                                    ],

                                disputes:
                                    [
                                        "Land Disputes",
                                        "Parcels with recorded dispute indicators."
                                    ],

                                encumbrances:
                                    [
                                        "Active Encumbrances",
                                        "Parcels with active encumbrance indicators."
                                    ],

                                property_tax_due:
                                    [
                                        "Property Tax Due",
                                        "Parcels with property tax currently due."
                                    ],

                                pending_mutations:
                                    [
                                        "Pending Mutations",
                                        "Parcels with mutation work currently pending."
                                    ]

                            };


                            renderLandStackDashboardWorkList(
                                titles[type][0],
                                titles[type][1],
                                items
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "Main dashboard card loading error:",
            error
        );

    }

}


// ==========================================================
// REFRESH MAIN DASHBOARD AFTER OFFICER ACTIONS
// ==========================================================

window.refreshLandStackMainDashboardCards =
    loadLandStackMainDashboardCards;


// ==========================================================
// LOAD WHEN OFFICER DASHBOARD OPENS
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setTimeout(
            function () {

                loadLandStackMainDashboardCards();

            },
            500
        );

    }
);


// ==========================================================
// REFRESH WHEN OFFICER DASHBOARD BUTTON IS USED
// ==========================================================

const landStackDashboardButton =
    document.getElementById(
        "officerDashboardBtn"
    );


if (landStackDashboardButton) {

    landStackDashboardButton.addEventListener(
        "click",
        function () {

            setTimeout(
                function () {

                    loadLandStackMainDashboardCards();

                },
                150
            );

        }
    );

}


// ==========================================================
// REFRESH AFTER OFFICER VERIFICATION ACTION
// ==========================================================

const originalRefreshDashboard =
    window.refreshLandStackOfficerDashboard;


window.refreshLandStackOfficerDashboard =
    async function () {

        try {

            if (
                typeof originalRefreshDashboard ===
                "function"
            ) {

                await originalRefreshDashboard();

            }

        } catch (error) {

            console.warn(
                "Existing dashboard refresh failed:",
                error
            );

        }


        await loadLandStackMainDashboardCards();

    };


// ==========================================================
// END MAIN DASHBOARD CARD SYSTEM
// ==========================================================


// ==========================================================
// VIEW SELECTION LOGOUT BUTTON
// ==========================================================

(function setupLandStackLogout() {

    if (!viewSelection) {
        return;
    }


    let logoutArea =
        document.getElementById(
            "landstackLogoutArea"
        );


    if (!logoutArea) {

        logoutArea =
            document.createElement(
                "div"
            );


        logoutArea.id =
            "landstackLogoutArea";


        logoutArea.style.display =
            "flex";


        logoutArea.style.justifyContent =
            "flex-end";


        logoutArea.style.alignItems =
            "center";


        logoutArea.style.marginBottom =
            "15px";


        viewSelection.insertBefore(
            logoutArea,
            viewSelection.firstChild
        );

    }


    let logoutBtn =
        document.getElementById(
            "landstackLogoutBtn"
        );


    if (!logoutBtn) {

        logoutBtn =
            document.createElement(
                "button"
            );


        logoutBtn.id =
            "landstackLogoutBtn";


        logoutBtn.type =
            "button";


        logoutBtn.textContent =
            "Logout";


        logoutBtn.style.background =
            "#7e3434";


        logoutBtn.style.borderColor =
            "#682b2b";


        logoutArea.appendChild(
            logoutBtn
        );

    }


    logoutBtn.onclick =
        async function () {

            try {

                if (verificationWatcher) {

                    clearInterval(
                        verificationWatcher
                    );

                    verificationWatcher =
                        null;

                }


                activeOfficerKey =
                    null;


                sessionStorage.removeItem(
                    "landstackOfficerKey"
                );


                selectedOfficerParcel =
                    null;


                selectedOfficerParcelLayer =
                    null;


                selectedCitizenParcel =
                    null;


                citizenDetailedAccessGranted =
                    false;


                await signOut(
                    auth
                );


                if (citizenView) {

                    citizenView.style.display =
                        "none";

                }


                if (officerView) {

                    officerView.style.display =
                        "none";

                }


                if (officerKeyBox) {

                    officerKeyBox.style.display =
                        "none";

                }


                if (viewSelection) {

                    viewSelection.style.display =
                        "none";

                }


                if (authBox) {

                    authBox.style.display =
                        "block";

                }


                const loginMessage =
                    getElement(
                        "loginMessage"
                    );


                const registerMessage =
                    getElement(
                        "registerMessage"
                    );


                if (loginMessage) {

                    loginMessage.textContent =
                        "";

                }


                if (registerMessage) {

                    registerMessage.textContent =
                        "";

                }


                const loginEmail =
                    getElement(
                        "loginEmail"
                    );


                const loginPassword =
                    getElement(
                        "loginPassword"
                    );


                if (loginEmail) {

                    loginEmail.value =
                        "";

                }


                if (loginPassword) {

                    loginPassword.value =
                        "";

                }


                const officerKey =
                    getElement(
                        "officerKey"
                    );


                if (officerKey) {

                    officerKey.value =
                        "";

                }


                console.log(
                    "LandStack user logged out."
                );


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Could not log out. Please try again."
                );

            }

        };

})();
// ==================================================
// HOMEPAGE LOGIN / REGISTER WINDOWS
// ==================================================

const openLoginBtn =
    getElement("openLoginBtn");

const heroLoginBtn =
    getElement("heroLoginBtn");

const openRegisterBtn =
    getElement("openRegisterBtn");

const closeLoginBtn =
    getElement("closeLoginBtn");

const closeRegisterBtn =
    getElement("closeRegisterBtn");

const backToLoginBtn =
    getElement("backToLoginBtn");

const loginModal =
    getElement("loginModal");

const registerModal =
    getElement("registerModal");


function openLoginWindow() {

    if (loginModal) {

        loginModal.style.display =
            "flex";

    }

    if (registerModal) {

        registerModal.style.display =
            "none";

    }

}


function openRegisterWindow() {

    if (registerModal) {

        registerModal.style.display =
            "flex";

    }

    if (loginModal) {

        loginModal.style.display =
            "none";

    }

}


function closeAuthWindows() {

    if (loginModal) {

        loginModal.style.display =
            "none";

    }

    if (registerModal) {

        registerModal.style.display =
            "none";

    }

}


if (openLoginBtn) {

    openLoginBtn.addEventListener(
        "click",
        openLoginWindow
    );

}


if (heroLoginBtn) {

    heroLoginBtn.addEventListener(
        "click",
        openLoginWindow
    );

}


if (openRegisterBtn) {

    openRegisterBtn.addEventListener(
        "click",
        openRegisterWindow
    );

}


if (closeLoginBtn) {

    closeLoginBtn.addEventListener(
        "click",
        closeAuthWindows
    );

}


if (closeRegisterBtn) {

    closeRegisterBtn.addEventListener(
        "click",
        closeAuthWindows
    );

}


if (backToLoginBtn) {

    backToLoginBtn.addEventListener(
        "click",
        openLoginWindow
    );

}


// ==========================================================
// REGISTRATION VERIFICATION / DIRECT LOGIN ASSISTANT
// ==========================================================

(function setupRegistrationVerificationAssistant() {

    const registerBtn =
        document.getElementById(
            "registerBtn"
        );

    const registerMessage =
        document.getElementById(
            "registerMessage"
        );

    if (
        !registerBtn ||
        !registerMessage
    ) {

        return;

    }


    let verificationPanel =
        document.getElementById(
            "landstackRegistrationVerificationPanel"
        );


    if (!verificationPanel) {

        verificationPanel =
            document.createElement(
                "div"
            );


        verificationPanel.id =
            "landstackRegistrationVerificationPanel";


        verificationPanel.style.display =
            "none";


        verificationPanel.style.marginTop =
            "12px";


        verificationPanel.style.padding =
            "13px 15px";


        verificationPanel.style.border =
            "1px solid #c8d1d9";


        verificationPanel.style.borderRadius =
            "4px";


        verificationPanel.style.background =
            "#f8fafc";


        registerMessage.parentNode.insertBefore(
            verificationPanel,
            registerMessage.nextSibling
        );

    }


    let verificationText =
        document.getElementById(
            "landstackVerificationText"
        );


    if (!verificationText) {

        verificationText =
            document.createElement(
                "div"
            );


        verificationText.id =
            "landstackVerificationText";


        verificationText.style.fontSize =
            "13px";


        verificationText.style.lineHeight =
            "1.5";


        verificationText.style.color =
            "#334155";


        verificationPanel.appendChild(
            verificationText
        );

    }


    let directLoginBtn =
        document.getElementById(
            "landstackVerifiedLoginBtn"
        );


    if (!directLoginBtn) {

        directLoginBtn =
            document.createElement(
                "button"
            );


        directLoginBtn.id =
            "landstackVerifiedLoginBtn";


        directLoginBtn.type =
            "button";


        directLoginBtn.textContent =
            "Login";


        directLoginBtn.style.display =
            "none";


        directLoginBtn.style.marginTop =
            "10px";


        verificationPanel.appendChild(
            directLoginBtn
        );

    }


    function showVerificationWaitingMessage() {

        verificationPanel.style.display =
            "block";


        verificationText.innerHTML = `

            <strong>
                Verification email sent.
            </strong>

            <br>

            Please open the verification email
            and verify your account.

            <br>

            <span style="color:#65727e;">
                If you do not receive the email,
                please check your
                <strong>Spam / Junk</strong> folder.
            </span>

        `;


        directLoginBtn.style.display =
            "none";

    }


    function showVerifiedMessage() {

        verificationPanel.style.display =
            "block";


        verificationText.innerHTML = `

            <strong style="color:#286749;">
                Account verified successfully.
            </strong>

            <br>

            Your email has been verified.
            Click Login to continue to LandStack.

        `;


        directLoginBtn.style.display =
            "inline-block";

    }


    async function checkRegistrationVerificationState() {

        const user =
            auth.currentUser;


        if (!user) {

            return;

        }


        try {

            await reload(
                user
            );


            if (
                user.emailVerified
            ) {

                showVerifiedMessage();

                return true;

            }

        } catch (error) {

            console.error(
                "Registration verification assistant error:",
                error
            );

        }


        return false;

    }


    directLoginBtn.onclick =
        async function () {

            const user =
                auth.currentUser;


            if (!user) {

                verificationText.innerHTML = `

                    <strong>
                        Your login session has expired.
                    </strong>

                    <br>

                    Please create the account again
                    or use the normal Login section.

                `;


                directLoginBtn.style.display =
                    "none";


                return;

            }


            try {

                await reload(
                    user
                );


                if (!user.emailVerified) {

                    verificationText.innerHTML = `

                        Please verify your email first.

                        <br>

                        <span style="color:#65727e;">
                            Also check your Spam / Junk folder
                            if you cannot find the verification email.
                        </span>

                    `;


                    directLoginBtn.style.display =
                        "none";


                    return;

                }


                const fullName =
                    localStorage.getItem(
                        "landstackPendingFullName"
                    ) || "";


                directLoginBtn.disabled =
                    true;


                directLoginBtn.textContent =
                    "Logging in...";


                await completeAuthenticatedUser(
                    user,
                    fullName,
                    registerMessage
                );


            } catch (error) {

                console.error(
                    "Direct login after verification error:",
                    error
                );


                verificationText.innerHTML = `

                    <strong>
                        Account verified.
                    </strong>

                    <br>

                    ${escapeHtml(
                        error.message
                    )}

                `;


                directLoginBtn.disabled =
                    false;


                directLoginBtn.textContent =
                    "Login";

            }

        };


    registerBtn.addEventListener(
        "click",
        function () {

            setTimeout(
                function () {

                    const text =
                        registerMessage.textContent ||
                        "";


                    if (
                        text.toLowerCase()
                            .includes(
                                "verification"
                            )
                    ) {

                        showVerificationWaitingMessage();

                    }

                },
                500
            );

        }
    );


    setInterval(
        async function () {

            const user =
                auth.currentUser;


            if (!user) {

                return;

            }


            const pendingName =
                localStorage.getItem(
                    "landstackPendingFullName"
                );


            if (!pendingName) {

                return;

            }


            const verified =
                await checkRegistrationVerificationState();


            if (
                verified
            ) {

            }

        },
        3000
    );


    setTimeout(
        async function () {

            const user =
                auth.currentUser;


            if (!user) {

                return;

            }


            const pendingName =
                localStorage.getItem(
                    "landstackPendingFullName"
                );


            if (!pendingName) {

                return;

            }


            await checkRegistrationVerificationState();

        },
        1000
    );

})();


// ==================================================
// LANDSTACK REPORTS
// OFFICER VERIFICATION REPORT + CITIZEN MY LAND REPORT
// ==================================================

(function installLandStackReports() {

    if (window.landStackReportsInstalled) {
        return;
    }

    window.landStackReportsInstalled = true;


    // ==================================================
    // STYLES
    // ==================================================

    const style = document.createElement("style");

    style.textContent = `
        .landstack-report-card {
            margin-top: 18px;
            padding: 16px;
            border: 1px solid #d9dee5;
            background: #ffffff;
        }

        .landstack-report-card h3 {
            margin-top: 0;
            color: #243b53;
        }

        .landstack-report-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
        }

        .landstack-report-actions button {
            padding: 9px 14px;
            border: 1px solid #243b53;
            background: #ffffff;
            color: #243b53;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .landstack-report-actions button:hover {
            background: #f3f6f9;
        }

        .landstack-report-actions button:disabled {
            opacity: 0.6;
            cursor: wait;
        }

        .landstack-report-note {
            width: 100%;
            margin: 2px 0 0 0;
            color: #667085;
            font-size: 12px;
        }
    `;

    document.head.appendChild(style);


    // ==================================================
    // COMMON HELPERS
    // ==================================================

    function valueOrNA(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Not available";
        }

        return String(value);

    }


    function escapeHtml(value) {

        return valueOrNA(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function makeSection(title, rows) {

        return `
            <section class="report-section">
                <h2>${escapeHtml(title)}</h2>

                ${rows.map(function (row) {

                    return `
                        <div class="report-row">
                            <div class="report-label">
                                ${escapeHtml(row[0])}
                            </div>

                            <div class="report-value">
                                ${escapeHtml(row[1])}
                            </div>
                        </div>
                    `;

                }).join("")}

            </section>
        `;

    }


    function reportStyles() {

        return `
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 30px;
                background: #ffffff;
                color: #1f2933;
            }

            .report-wrap {
                max-width: 900px;
                margin: auto;
            }

            .report-header {
                border-bottom: 2px solid #243b53;
                padding-bottom: 16px;
                margin-bottom: 22px;
            }

            .report-header h1 {
                margin: 0 0 8px;
                color: #243b53;
            }

            .report-header p {
                margin: 4px 0;
                color: #52606d;
            }

            .report-section {
                border: 1px solid #d9dee5;
                margin-bottom: 16px;
                padding: 16px;
                break-inside: avoid;
            }

            .report-section h2 {
                margin: 0 0 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e4e7eb;
                color: #243b53;
                font-size: 18px;
            }

            .report-row {
                display: grid;
                grid-template-columns: 230px 1fr;
                gap: 16px;
                padding: 7px 0;
                border-bottom: 1px solid #f0f2f5;
            }

            .report-row:last-child {
                border-bottom: none;
            }

            .report-label {
                font-weight: 600;
            }

            .report-value {
                word-break: break-word;
            }

            .report-warning {
                margin-top: 20px;
                padding: 12px;
                border: 1px solid #d9dee5;
                background: #f7f8fa;
                color: #52606d;
                font-size: 13px;
            }

            .report-footer {
                margin-top: 20px;
                font-size: 12px;
                color: #667085;
            }

            @media print {

                body {
                    padding: 10px;
                }

                .report-section {
                    break-inside: avoid;
                }

            }

            @media (max-width: 650px) {

                .report-row {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }

            }
        `;

    }


    function buildReportHtml(
        title,
        subtitle,
        parcel,
        sections,
        reportType
    ) {

        const identityRows = [

            ["Parcel ID", parcel.parcel_id],
            ["LP Number", parcel.lp_number],
            ["Survey Number", parcel.survey_number],
            ["Subdivision Number", parcel.subdivision_number],
            ["ULPIN", parcel.ulpin],
            ["Area (sq. yards)", parcel.area_sq_yards],
            ["Village", parcel.village],
            ["Mandal", parcel.mandal],
            ["District", parcel.district],
            ["State", parcel.state],
            ["GIS ID", parcel.gis_id]

        ];


        const warningText =
            reportType === "citizen"

                ? "This is a LandStack prototype report using synthetic/demo data. It is not an official government land document. Citizen reports contain citizen-view information only."

                : "This is a LandStack prototype report using synthetic/demo data. It is not an official government land document. Officer reports may contain operational verification information for authorized review.";


        return `
            <!DOCTYPE html>

            <html lang="en">

            <head>

                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <title>${escapeHtml(title)}</title>

                <style>
                    ${reportStyles()}
                </style>

            </head>

            <body>

                <div class="report-wrap">

                    <div class="report-header">

                        <h1>
                            ${escapeHtml(title)}
                        </h1>

                        <p>
                            ${escapeHtml(subtitle)}
                        </p>

                        <p>
                            <strong>Generated:</strong>
                            ${escapeHtml(
                                new Date().toLocaleString()
                            )}
                        </p>

                    </div>


                    ${makeSection(
                        "Parcel Identity",
                        identityRows
                    )}


                    ${sections.map(
                        function (item) {

                            return makeSection(
                                item[0],
                                item[1]
                            );

                        }
                    ).join("")}


                    <div class="report-warning">

                        <strong>
                            Prototype Notice:
                        </strong>

                        ${escapeHtml(warningText)}

                    </div>


                    <div class="report-footer">

                        Generated by LandStack Prototype.

                    </div>

                </div>

            </body>

            </html>
        `;

    }

window.downloadReport = function downloadReport(
    filename,
    html
) {

    function loadScript(src) {

        return new Promise(
            function (resolve, reject) {

                const existing =
                    document.querySelector(
                        'script[src="' + src + '"]'
                    );

                if (existing) {

                    resolve();

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    src;


                script.onload =
                    function () {

                        resolve();

                    };


                script.onerror =
                    function () {

                        reject(
                            new Error(
                                "Could not load PDF library."
                            )
                        );

                    };


                document.head.appendChild(
                    script
                );

            }
        );

    }


    async function createPdf() {

        try {

            await loadScript(
                "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
            );


            await loadScript(
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
            );


            const reportContainer =
                document.createElement(
                    "div"
                );


            reportContainer.style.position =
                "fixed";

            reportContainer.style.left =
                "-100000px";

            reportContainer.style.top =
                "0";

            reportContainer.style.width =
                "794px";

            reportContainer.style.background =
                "#ffffff";


            reportContainer.innerHTML =
                html;


            document.body.appendChild(
                reportContainer
            );


            const canvas =
                await html2canvas(
                    reportContainer,
                    {
                        scale:
                            2,

                        useCORS:
                            true,

                        backgroundColor:
                            "#ffffff"
                    }
                );


            const {
                jsPDF
            } =
                window.jspdf;


            const pdf =
                new jsPDF(
                    "p",
                    "mm",
                    "a4"
                );


            const pageWidth =
                pdf.internal.pageSize.getWidth();


            const pageHeight =
                pdf.internal.pageSize.getHeight();


            const margin =
                10;


            const usableWidth =
                pageWidth -
                (margin * 2);


            const imageHeight =
                canvas.height *
                usableWidth /
                canvas.width;


            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );


            let heightLeft =
                imageHeight;


            let position =
                margin;


            pdf.addImage(
                imageData,
                "JPEG",
                margin,
                position,
                usableWidth,
                imageHeight
            );


            heightLeft -=
                pageHeight -
                (margin * 2);


            while (
                heightLeft > 0
            ) {

                position =
                    position -
                    (
                        pageHeight -
                        (margin * 2)
                    );


                pdf.addPage();


                pdf.addImage(
                    imageData,
                    "JPEG",
                    margin,
                    position,
                    usableWidth,
                    imageHeight
                );


                heightLeft -=
                    pageHeight -
                    (margin * 2);

            }


            const pdfFilename =
                String(filename)
                    .replace(
                        /\.html?$/i,
                        ".pdf"
                    );


            pdf.save(
                pdfFilename
            );


            reportContainer.remove();

        }
        catch (error) {

            console.error(
                "PDF generation error:",
                error
            );


            alert(
                "Could not generate the PDF report. Please try again."
            );

        }

    }


    createPdf();

}


    function printReport(html) {

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );


        if (!printWindow) {

            alert(
                "The browser blocked the print window. Please allow pop-ups for LandStack."
            );

            return;

        }


        printWindow.document.open();

        printWindow.document.write(html);

        printWindow.document.close();

        printWindow.focus();


        setTimeout(
            function () {

                printWindow.print();

            },
            500
        );

    }


    // ==================================================
    // CITIZEN CURRENT PARCEL
    // ==================================================

    window.landStackCitizenReportParcel =
        window.landStackCitizenReportParcel || null;


    function getCitizenParcel() {

        if (
            window.landStackCitizenReportParcel
        ) {

            return window.landStackCitizenReportParcel;

        }


        if (
            typeof selectedParcelLayer !== "undefined" &&
            selectedParcelLayer &&
            selectedParcelLayer.feature &&
            selectedParcelLayer.feature.properties
        ) {

            return selectedParcelLayer.feature.properties;

        }


        return null;

    }


    // ==================================================
    // CITIZEN REPORT DATA
    // ==================================================

    function buildCitizenReport(
        parcel
    ) {

        const sections = [

            [
                "Ownership",
                [
                    ["Owner", parcel.owner_name],
                    ["Owner Type", parcel.owner_type],
                    ["Ownership Status", parcel.ownership_status],
                    ["Ownership Start", parcel.ownership_start_date]
                ]
            ],

            [
                "Registration",
                [
                    ["Transaction Type", parcel.transaction_type],
                    ["Registration Number", parcel.registration_number],
                    ["Transaction Date", parcel.transaction_date],
                    ["Registration Status", parcel.registration_status]
                ]
            ],

            [
                "Land Use & Planning",
                [
                    ["Current Land Use", parcel.current_land_use],
                    ["Previous Land Use", parcel.previous_land_use],
                    ["Conversion Required", parcel.conversion_required],
                    ["Conversion Status", parcel.conversion_status],
                    ["Planning Status", parcel.planning_status],
                    ["Zoning", parcel.zoning]
                ]
            ],

            [
                "Property Tax",
                [
                    ["Property Tax Number", parcel.property_tax_number],
                    ["Financial Year", parcel.financial_year],
                    ["Tax Amount", parcel.tax_amount],
                    ["Amount Paid", parcel.amount_paid],
                    ["Tax Status", parcel.tax_status]
                ]
            ],

            [
                "Land Tax",
                [
                    ["Assessment Number", parcel.land_tax_assessment_number],
                    ["Land Tax Status", parcel.land_tax_status],
                    ["Land Tax Amount", parcel.land_tax_amount],
                    ["Land Tax Paid", parcel.land_tax_amount_paid]
                ]
            ],

            [
                "Building Permission",
                [
                    ["Building Permission Status", parcel.building_permission_status],
                    ["Permission Number", parcel.permission_number],
                    ["Building Type", parcel.building_type],
                    ["Number of Floors", parcel.number_of_floors],
                    ["Built-up Area (sq.ft)", parcel.built_up_area_sqft]
                ]
            ],

            [
                "Encumbrance & Restrictions",
                [
                    ["Encumbrance Status", parcel.encumbrance_status],
                    ["Encumbrance Type", parcel.encumbrance_type],
                    ["Encumbrance Document Number", parcel.encumbrance_document_number],
                    ["Encumbrance Holder", parcel.encumbrance_holder],
                    ["Restriction Type", parcel.restriction_type],
                    ["Restriction Status", parcel.restriction_status],
                    ["Restriction Authority", parcel.restriction_authority]
                ]
            ],

            [
                "Land Dispute",
                [
                    ["Dispute Status", parcel.dispute_status],
                    ["Dispute Reference", parcel.dispute_reference],
                    ["Dispute Type", parcel.dispute_type],
                    ["Dispute Authority", parcel.dispute_authority],
                    ["Current Dispute Status", parcel.dispute_current_status]
                ]
            ],

            [
                "Mutation",
                [
                    ["Mutation Application Number", parcel.mutation_application_number],
                    ["Mutation Type", parcel.mutation_type],
                    ["Application Date", parcel.mutation_application_date],
                    ["Mutation Status", parcel.mutation_status]
                ]
            ],

            [
                "Record Status",
                [
                    ["Due Diligence Status", parcel.due_diligence_status],
                    ["Citizen Status", parcel.citizen_status]
                ]
            ]

        ];


        return buildReportHtml(
            "My Land Report",
            "Citizen Land Details",
            parcel,
            sections,
            "citizen"
        );

    }


    // ==================================================
    // CITIZEN REPORT DOWNLOAD
    // OTP PROTECTED
    // ==================================================

    function downloadCitizenReport() {

        if (
            !citizenDetailedAccessGranted
        ) {

            alert(
                "Please verify the OTP first to unlock My Land Report."
            );

            return;

        }


        const parcel =
            getCitizenParcel();


        if (!parcel) {

            alert(
                "Open My Land Details and select your land parcel first."
            );

            return;

        }


        const html =
            buildCitizenReport(parcel);


        const reference =
            parcel.lp_number ||
            parcel.survey_number ||
            parcel.parcel_id ||
            "land";


        downloadReport(
            "LandStack_My_Land_Report_" +
            String(reference)
                .replace(
                    /[^a-z0-9_-]/gi,
                    "_"
                ) +
            ".html",
            html
        );

    }
    // ==================================================
// OFFICER VERIFICATION REPORT
// ==================================================

function downloadOfficerVerificationReport(
    parcel
) {

    if (!parcel) {

        alert(
            "Select a land parcel first."
        );

        return;

    }


    const html =
        buildOfficerVerificationReport(
            parcel
        );


    const reference =
        parcel.lp_number ||
        parcel.survey_number ||
        parcel.parcel_id ||
        "land";


    downloadReport(
        "LandStack_Officer_Verification_Report_" +
        String(reference)
            .replace(
                /[^a-z0-9_-]/gi,
                "_"
            ) +
        ".html",
        html
    );

}


    // ==================================================
    // CITIZEN REPORT PRINT
    // OTP PROTECTED
    // ==================================================

    function printCitizenReport() {

        if (
            !citizenDetailedAccessGranted
        ) {

            alert(
                "Please verify the OTP first to unlock My Land Report."
            );

            return;

        }


        const parcel =
            getCitizenParcel();


        if (!parcel) {

            alert(
                "Open My Land Details and select your land parcel first."
            );

            return;

        }


        printReport(
            buildCitizenReport(parcel)
        );

    }


    // ==================================================
    // OFFICER VERIFICATION DATA
    // ==================================================

    async function getOfficerVerification(
        parcel
    ) {

        try {

            if (
                !parcel ||
                !parcel.parcel_id
            ) {

                return null;

            }


            if (
                typeof auth === "undefined" ||
                !auth.currentUser
            ) {

                return null;

            }


            const idToken =
                await auth.currentUser.getIdToken();


            const officerKey =
                sessionStorage.getItem(
                    "landstackOfficerKey"
                ) || "";


            const response =
                await fetch(
                    `${SERVER_URL}/officer/verification?parcelId=` +
                    encodeURIComponent(
                        parcel.parcel_id
                    ),
                    {
                        headers: {

                            Authorization:
                                "Bearer " +
                                idToken,

                            "X-Officer-Key":
                                officerKey

                        }
                    }
                );


            if (!response.ok) {

                return null;

            }


            return await response.json();

        }
        catch (error) {

            console.warn(
                "Officer verification report data unavailable:",
                error
            );

            return null;

        }

    }


    // ==================================================
    // OFFICER REPORT
    // ==================================================

    async function buildOfficerReport(
        parcel
    ) {

        const verification =
            await getOfficerVerification(
                parcel
            );


        const sections = [

            [
                "Ownership & Registration",
                [
                    ["Owner", parcel.owner_name],
                    ["Owner Type", parcel.owner_type],
                    ["Ownership Status", parcel.ownership_status],
                    ["Registration Number", parcel.registration_number],
                    ["Transaction Type", parcel.transaction_type],
                    ["Transaction Date", parcel.transaction_date],
                    ["Registration Status", parcel.registration_status]
                ]
            ],

            [
                "Land Use & Planning",
                [
                    ["Current Land Use", parcel.current_land_use],
                    ["Previous Land Use", parcel.previous_land_use],
                    ["Conversion Required", parcel.conversion_required],
                    ["Conversion Status", parcel.conversion_status],
                    ["Planning Status", parcel.planning_status],
                    ["Zoning", parcel.zoning]
                ]
            ],

            [
                "Property Tax & Land Tax",
                [
                    ["Property Tax Number", parcel.property_tax_number],
                    ["Financial Year", parcel.financial_year],
                    ["Tax Amount", parcel.tax_amount],
                    ["Amount Paid", parcel.amount_paid],
                    ["Tax Status", parcel.tax_status],
                    ["Land Tax Assessment Number", parcel.land_tax_assessment_number],
                    ["Land Tax Status", parcel.land_tax_status],
                    ["Land Tax Amount", parcel.land_tax_amount],
                    ["Land Tax Paid", parcel.land_tax_amount_paid]
                ]
            ],

            [
                "Building Permission",
                [
                    ["Building Permission Status", parcel.building_permission_status],
                    ["Permission Number", parcel.permission_number],
                    ["Building Type", parcel.building_type],
                    ["Number of Floors", parcel.number_of_floors],
                    ["Built-up Area (sq.ft)", parcel.built_up_area_sqft]
                ]
            ],

            [
                "Encumbrance, Restrictions & Dispute",
                [
                    ["Encumbrance Status", parcel.encumbrance_status],
                    ["Encumbrance Type", parcel.encumbrance_type],
                    ["Encumbrance Document Number", parcel.encumbrance_document_number],
                    ["Encumbrance Holder", parcel.encumbrance_holder],
                    ["Restriction Type", parcel.restriction_type],
                    ["Restriction Status", parcel.restriction_status],
                    ["Restriction Authority", parcel.restriction_authority],
                    ["Dispute Status", parcel.dispute_status],
                    ["Dispute Reference", parcel.dispute_reference],
                    ["Dispute Type", parcel.dispute_type],
                    ["Dispute Authority", parcel.dispute_authority],
                    ["Current Dispute Status", parcel.dispute_current_status]
                ]
            ],

            [
                "Mutation",
                [
                    ["Mutation Application Number", parcel.mutation_application_number],
                    ["Mutation Type", parcel.mutation_type],
                    ["Application Date", parcel.mutation_application_date],
                    ["Mutation Status", parcel.mutation_status]
                ]
            ],

            [
                "Due Diligence",
                [
                    ["Due Diligence Status", parcel.due_diligence_status],
                    ["Citizen Status", parcel.citizen_status],
                    ["Dispute Indicator", parcel.dispute_indicator],
                    ["Encumbrance Indicator", parcel.encumbrance_indicator],
                    ["Land Tax Due Indicator", parcel.land_tax_due_indicator],
                    ["Mutation Pending Indicator", parcel.mutation_pending_indicator]
                ]
            ]

        ];


        if (verification) {

            sections.push(
                [
                    "Officer Verification",
                    [
                        ["Latest Verification Action", verification.action],
                        ["Officer Note", verification.note],
                        ["Verification Recorded At", verification.created_at]
                    ]
                ]
            );

        }
        else {

            sections.push(
                [
                    "Officer Verification",
                    [
                        [
                            "Latest Verification Action",
                            "No recorded verification action"
                        ],
                        [
                            "Officer Note",
                            "Not available"
                        ]
                    ]
                ]
            );

        }


        return buildReportHtml(
            "Officer Verification Report",
            "Authorized Officer Parcel Review",
            parcel,
            sections,
            "officer"
        );

    }


    async function downloadOfficerReport(
        event
    ) {

        if (
            typeof selectedOfficerParcel === "undefined" ||
            !selectedOfficerParcel
        ) {

            alert(
                "Select a parcel from the Officer Map or Officer Search first."
            );

            return;

        }


        const button =
            event &&
            event.currentTarget
                ? event.currentTarget
                : null;


        if (button) {

            button.disabled = true;

            button.textContent =
                "Preparing Report...";

        }


        try {

            const html =
                await buildOfficerReport(
                    selectedOfficerParcel
                );


            const reference =
                selectedOfficerParcel.lp_number ||
                selectedOfficerParcel.survey_number ||
                selectedOfficerParcel.parcel_id ||
                "parcel";


            downloadReport(
                "LandStack_Officer_Verification_Report_" +
                String(reference)
                    .replace(
                        /[^a-z0-9_-]/gi,
                        "_"
                    ) +
                ".html",
                html
            );

        }
        catch (error) {

            console.error(error);

            alert(
                "Could not create the Officer Verification Report."
            );

        }
        finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "Download Verification Report";

            }

        }

    }


    async function printOfficerReport() {

        if (
            typeof selectedOfficerParcel === "undefined" ||
            !selectedOfficerParcel
        ) {

            alert(
                "Select a parcel from the Officer Map or Officer Search first."
            );

            return;

        }


        try {

            const html =
                await buildOfficerReport(
                    selectedOfficerParcel
                );


            printReport(html);

        }
        catch (error) {

            console.error(error);

            alert(
                "Could not prepare the Officer Verification Report."
            );

        }

    }


    // ==================================================
    // ACTION BUTTON CREATOR
    // ==================================================

    function button(
        textValue,
        handler
    ) {

        const btn =
            document.createElement("button");


        btn.type = "button";

        btn.textContent = textValue;


        btn.addEventListener(
            "click",
            handler
        );


        return btn;

    }


    // ==================================================
    // OFFICER REPORT PANEL
    // ==================================================

    function installOfficerReportPanel() {

        if (
            typeof selectedOfficerParcel === "undefined" ||
            !selectedOfficerParcel
        ) {

            return;

        }


        const parcelInfo =
            document.getElementById(
                "officerParcelInfo"
            );


        if (
            parcelInfo &&
            !parcelInfo.querySelector(
                "[data-landstack-officer-report]"
            )
        ) {

            const card =
                document.createElement("div");


            card.className =
                "landstack-report-card";


            card.setAttribute(
                "data-landstack-officer-report",
                "true"
            );


            card.innerHTML =
                `
                    <h3>
                        Officer Report
                    </h3>

                    <p>
                        Generate a report for the selected parcel.
                    </p>
                `;


            const actions =
                document.createElement("div");


            actions.className =
                "landstack-report-actions";


            actions.appendChild(
                button(
                    "Download Verification Report",
                    downloadOfficerReport
                )
            );


            actions.appendChild(
                button(
                    "Print Verification Report",
                    printOfficerReport
                )
            );


            const note =
                document.createElement("p");


            note.className =
                "landstack-report-note";


            note.textContent =
                "Includes parcel information and the latest recorded officer verification action.";


            actions.appendChild(note);


            card.appendChild(actions);


            parcelInfo.appendChild(card);

        }

    }


    // ==================================================
    // FIND MY LAND DETAILS
    // ==================================================

    function findMyLandDetailsTarget() {

        if (!citizenView) {

            return null;

        }


        const elements =
            Array.from(
                citizenView.querySelectorAll(
                    "h1,h2,h3,h4,h5,h6,button,a,strong,label"
                )
            );


        return elements.find(
            function (element) {

                return /my\s+land\s+details/i.test(
                    element.textContent.trim()
                );

            }
        ) || null;

    }


    // ==================================================
    // CITIZEN REPORT PANEL
    // ==================================================

    function installCitizenReportPanel() {

        const parcel =
            getCitizenParcel();


        if (parcel) {

            window.landStackCitizenReportParcel =
                parcel;

        }


        if (!citizenView) {

            return;

        }


        if (
            document.querySelector(
                "[data-landstack-citizen-report]"
            )
        ) {

            return;

        }


        const target =
            findMyLandDetailsTarget();


        if (!target) {

            return;

        }


        const host =
            target.closest(
                "section,article,.card,.panel"
            ) ||
            target.parentElement;


        if (!host) {

            return;

        }


        const card =
            document.createElement("div");


        card.className =
            "landstack-report-card";


        card.setAttribute(
            "data-landstack-citizen-report",
            "true"
        );


        card.innerHTML =
            `
                <h3>
                    My Land Report
                </h3>

                <p>
                    Download or print your detailed land information.
                </p>
            `;


        const actions =
            document.createElement("div");


        actions.className =
            "landstack-report-actions";


        actions.appendChild(
            button(
                "Download My Land Report",
                downloadCitizenReport
            )
        );


        actions.appendChild(
            button(
                "Print My Land Report",
                printCitizenReport
            )
        );


        const note =
            document.createElement("p");


        note.className =
            "landstack-report-note";


        note.textContent =
            "This report contains citizen-view land information only.";


        actions.appendChild(note);


        card.appendChild(actions);


        host.appendChild(card);

    }


    // ==================================================
    // WRAP CITIZEN PARCEL DISPLAY
    // ==================================================

    try {

        if (
            typeof showParcelInformation === "function" &&
            !window.landStackCitizenReportWrapper
        ) {

            const originalCitizenInformation =
                showParcelInformation;


            showParcelInformation =
                function (parcel) {

                    window.landStackCitizenReportParcel =
                        parcel;


                    originalCitizenInformation(
                        parcel
                    );


                    setTimeout(
                        installCitizenReportPanel,
                        0
                    );

                };


            window.landStackCitizenReportWrapper =
                true;

        }

    }
    catch (error) {

        console.warn(
            "Citizen report wrapper could not be installed:",
            error
        );

    }


    // ==================================================
    // WRAP OFFICER PARCEL DISPLAY
    // ==================================================

    try {

        if (
            typeof showOfficerParcelInformation === "function" &&
            !window.landStackOfficerReportWrapper
        ) {

            const originalOfficerInformation =
                showOfficerParcelInformation;


            showOfficerParcelInformation =
                function (parcel) {

                    originalOfficerInformation(
                        parcel
                    );


                    setTimeout(
                        installOfficerReportPanel,
                        0
                    );

                };


            window.landStackOfficerReportWrapper =
                true;

        }

    }
    catch (error) {

        console.warn(
            "Officer report wrapper could not be installed:",
            error
        );

    }


    // ==================================================
    // WATCH CITIZEN VIEW FOR MY LAND DETAILS
    // ==================================================

    if (citizenView) {

        const observer =
            new MutationObserver(
                function () {

                    installCitizenReportPanel();

                }
            );


        observer.observe(
            citizenView,
            {
                childList: true,
                subtree: true
            }
        );

    }


    // ==================================================
    // INITIAL CHECKS
    // ==================================================

    setTimeout(
        installCitizenReportPanel,
        500
    );


    setTimeout(
        installCitizenReportPanel,
        1500
    );


    setTimeout(
        installOfficerReportPanel,
        500
    );

})();


// ==================================================
// CITIZEN BASIC INFORMATION REPORT
// ==================================================

(function installCitizenBasicInformationReport() {

    if (window.landStackBasicInfoReportInstalled) {
        return;
    }

    window.landStackBasicInfoReportInstalled = true;


    // ==================================================
    // STYLES
    // ==================================================

    const style = document.createElement("style");

    style.textContent = `
        .landstack-basic-report-card {
            margin-top: 16px;
            padding: 14px;
            border: 1px solid #d9dee5;
            background: #ffffff;
        }

        .landstack-basic-report-card h3 {
            margin-top: 0;
            color: #243b53;
        }

        .landstack-basic-report-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }

        .landstack-basic-report-actions button {
            padding: 9px 14px;
            border: 1px solid #243b53;
            background: #ffffff;
            color: #243b53;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .landstack-basic-report-actions button:hover {
            background: #f3f6f9;
        }

        .landstack-basic-report-note {
            width: 100%;
            margin: 2px 0 0 0;
            color: #667085;
            font-size: 12px;
        }
    `;

    document.head.appendChild(style);


    // ==================================================
    // HELPERS
    // ==================================================

    function valueOrNA(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Not available";
        }

        return String(value);

    }


    function escapeHtml(value) {

        return valueOrNA(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function row(label, value) {

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(label)}</strong>
                </td>

                <td>
                    ${escapeHtml(value)}
                </td>
            </tr>
        `;

    }
function downloadBasicInformation() {

    const parcel =
        window.landStackCitizenReportParcel;

    if (!parcel) {

        alert(
            "Select a parcel on the Citizen map first."
        );

        return;

    }

    const html =
        buildBasicInformationReport(
            parcel
        );

    const reference =
        parcel.lp_number ||
        parcel.survey_number ||
        parcel.parcel_id ||
        "land";

    downloadReport(
        "LandStack_Basic_Land_Information_" +
        String(reference)
            .replace(
                /[^a-z0-9_-]/gi,
                "_"
            ) +
        ".pdf",
        html
    );

}


// ==================================================
// BUILD BASIC INFORMATION REPORT
// ==================================================

function buildBasicInformationReport(parcel) {

    function safeValue(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "Not available";

        }

        return String(value);

    }


    function escape(value) {

        return safeValue(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function reportRow(label, value) {

        return `
            <tr>

                <td style="
                    padding:8px;
                    border:1px solid #d9dee5;
                    font-weight:bold;
                    width:38%;
                ">
                    ${escape(label)}
                </td>

                <td style="
                    padding:8px;
                    border:1px solid #d9dee5;
                ">
                    ${escape(value)}
                </td>

            </tr>
        `;

    }


    const lpNumber =
        parcel.lp_number ||
        parcel.survey_number ||
        parcel.parcel_id ||
        "Not available";


    const surveyNumber =
        parcel.survey_number ||
        parcel.lp_number ||
        "Not available";


    const ulpin =
        parcel.ulpin ||
        parcel.ULPIN ||
        parcel.ulpin_number ||
        "Not available";


    const landUse =
        parcel.current_land_use ||
        parcel.land_use ||
        parcel.landUse ||
        "Not available";


    const previousLandUse =
        parcel.previous_land_use ||
        "Not available";


    const area =
        parcel.area ||
        parcel.area_sq_m ||
        parcel.area_sqm ||
        parcel.area_sqft ||
        "Not available";


    const planningStatus =
        parcel.planning_status ||
        parcel.planningStatus ||
        "Not available";


    return `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        LandStack Basic Land Information
    </title>

</head>


<body style="
    font-family:Arial,sans-serif;
    margin:30px;
    color:#243b53;
    background:#ffffff;
">

    <div style="
        border:1px solid #d9dee5;
        padding:24px;
    ">

        <h1 style="
            margin-top:0;
            color:#243b53;
        ">
            LandStack
        </h1>


        <h2>
            Basic Land Information Report
        </h2>


        <p style="
            color:#667085;
        ">
            Public parcel information generated
            from the LandStack citizen portal.
        </p>


        <hr>


        <h3>
            Parcel Identification
        </h3>


        <table style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:20px;
        ">

            ${reportRow(
                "LP / Parcel Number",
                lpNumber
            )}

            ${reportRow(
                "Survey Number",
                surveyNumber
            )}

            ${reportRow(
                "ULPIN",
                ulpin
            )}

        </table>


        <h3>
            Land Information
        </h3>


        <table style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:20px;
        ">

            ${reportRow(
                "Current Land Use",
                landUse
            )}

            ${reportRow(
                "Previous Land Use",
                previousLandUse
            )}

            ${reportRow(
                "Area",
                area
            )}

            ${reportRow(
                "Planning Status",
                planningStatus
            )}

            ${reportRow(
                "GIS Parcel Status",
                "Available"
            )}

        </table>


        <h3>
            Citizen Data Protection
        </h3>


        <table style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:20px;
        ">

            ${reportRow(
                "Owner Information",
                "Not disclosed in basic citizen view"
            )}

            ${reportRow(
                "Registration Information",
                "Not disclosed in basic citizen view"
            )}

            ${reportRow(
                "Encumbrance Information",
                "Not disclosed in basic citizen view"
            )}

            ${reportRow(
                "Restriction Information",
                "Not disclosed in basic citizen view"
            )}

        </table>


        <p style="
            font-size:12px;
            color:#667085;
            margin-top:25px;
        ">
            This is a LandStack prototype report.
            Detailed protected information requires
            consent-based verification.
        </p>

    </div>

</body>

</html>
`;

}


// ==================================================
// PRINT BASIC INFORMATION
// ==================================================

function printBasicInformation() {

    const parcel =
        window.landStackCitizenReportParcel;

    if (!parcel) {

        alert(
            "Select a parcel on the Citizen map first."
        );

        return;

    }


    const html =
        buildBasicInformationReport(
            parcel
        );


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=700"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups for LandStack."
        );

        return;

    }


    printWindow.document.open();

    printWindow.document.write(
        html
    );

    printWindow.document.close();


    printWindow.onload =
        function () {

            printWindow.focus();

            printWindow.print();

        };

}


// ==================================================
// INSTALL BASIC INFORMATION REPORT PANEL
// ==================================================

function installBasicInformationPanel() {

    const parcelInfo =
        document.getElementById(
            "parcelInfo"
        );


    if (!parcelInfo) {

        return;

    }


    if (
        document.getElementById(
            "landStackBasicReportCard"
        )
    ) {

        return;

    }


    const card =
        document.createElement(
            "div"
        );


    card.id =
        "landStackBasicReportCard";


    card.className =
        "landstack-basic-report-card";


    card.innerHTML = `

        <h3>
            Basic Information Report
        </h3>

        <p>
            Download the public land information
            available for the selected parcel.
        </p>

        <div class="landstack-basic-report-actions">

            <button
                type="button"
                id="downloadBasicInformationBtn"
            >
                Download Basic Information
            </button>


            <button
                type="button"
                id="printBasicInformationBtn"
            >
                Print Basic Information
            </button>

        </div>

        <p class="landstack-basic-report-note">
            Ownership and other protected information
            is not included in the basic citizen report.
        </p>

    `;


    parcelInfo.appendChild(
        card
    );


    const downloadButton =
        document.getElementById(
            "downloadBasicInformationBtn"
        );


    const printButton =
        document.getElementById(
            "printBasicInformationBtn"
        );


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadBasicInformation
        );

    }


    if (printButton) {

        printButton.addEventListener(
            "click",
            printBasicInformation
        );

    }

}


// ==================================================
// WATCH CITIZEN INFORMATION AREA
// ==================================================

const basicInformationObserver =
    new MutationObserver(
        function () {

            installBasicInformationPanel();

        }
    );


const basicInformationParcelInfo =
    document.getElementById(
        "parcelInfo"
    );


if (basicInformationParcelInfo) {

    basicInformationObserver.observe(
        basicInformationParcelInfo,
        {
            childList: true,
            subtree: true
        }
    );

}


setTimeout(
    installBasicInformationPanel,
    500
);


setTimeout(
    installBasicInformationPanel,
    1500
);


})();