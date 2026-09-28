require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { adminAuth } = require("./firebaseAdmin");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const app = express();
// ==================================================
// SWAGGER / OPENAPI DOCUMENTATION
// ==================================================

const swaggerOptions = {

    definition: {

        openapi: "3.0.0",

        info: {

            title:
                "LandStack API",

            version:
                "1.0.0",

            description:
                "API documentation for the LandStack GIS-based Digital Public Infrastructure for Land Governance."

        },

        servers: [

            {
                url:
                    "http://localhost:5000",

                description:
                    "Local development server"
            }

        ],

        tags: [

            {
                name:
                    "GIS Parcels",

                description:
                    "Parcel map and parcel information APIs"
            },

            {
                name:
                    "Officer",

                description:
                    "Officer verification and parcel management APIs"
            },

            {
                name:
                    "Audit",

                description:
                    "Officer audit history APIs"
            }

        ],

        paths: {

            "/api/parcels": {

                get: {

                    tags:
                        [
                            "GIS Parcels"
                        ],

                    summary:
                        "Get all parcel geometries",

                    description:
                        "Returns parcel geometries and associated parcel identifiers for the LandStack GIS map.",

                    responses: {

                        "200": {

                            description:
                                "Parcel data returned successfully."

                        },

                        "500": {

                            description:
                                "Server error."

                        }

                    }

                }

            },

            "/officer/audit-history": {

                get: {

                    tags:
                        [
                            "Audit"
                        ],

                    summary:
                        "Get officer audit history",

                    description:
                        "Returns the latest officer actions recorded in the LandStack audit log.",

                    responses: {

                        "200": {

                            description:
                                "Audit history returned successfully."

                        },

                        "401": {

                            description:
                                "Officer authentication required."

                        },

                        "500": {

                            description:
                                "Server error."

                        }

                    }

                }

            },

            "/officer/parcel-update": {

                post: {

                    tags:
                        [
                            "Officer"
                        ],

                    summary:
                        "Update parcel verification data",

                    description:
                        "Allows an authenticated officer to update supported parcel verification records such as property tax, land tax, mutation, planning, building and restrictions.",

                    requestBody: {

                        required:
                            true,

                        content: {

                            "application/json": {

                                schema: {

                                    type:
                                        "object",

                                    properties: {

                                        parcelIdentifier: {

                                            type:
                                                "string",

                                            example:
                                                "GIS-0047"

                                        },

                                        updates: {

                                            type:
                                                "object",

                                            example: {

                                                propertyTax: {

                                                    taxStatus:
                                                        "Partially Paid",

                                                    amountPaid:
                                                        "14939.00"

                                                },

                                                mutation: {

                                                    status:
                                                        "Completed"

                                                },

                                                planning: {

                                                    status:
                                                        "Conforming"

                                                },

                                                building: {

                                                    status:
                                                        "Approved"

                                                },

                                                restriction: {

                                                    status:
                                                        "None"

                                                }

                                            }

                                        }

                                    }

                                }

                            }

                        }

                    },

                    responses: {

                        "200": {

                            description:
                                "Parcel verification update saved successfully."

                        },

                        "400": {

                            description:
                                "Invalid parcel data or update values."

                        },

                        "401": {

                            description:
                                "Officer authentication required."

                        },

                        "500": {

                            description:
                                "Server error."

                        }

                    }

                }

            }

        }

    },

    apis: []

};


const swaggerSpec =
    swaggerJsdoc(
        swaggerOptions
    );


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(
        swaggerSpec
    )
);

// ==================================================
// BASIC SERVER CONFIGURATION
// ==================================================

app.disable("x-powered-by");

app.use(
    cors({
        origin: true,
        credentials: false
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);


// ==================================================
// CONSTANTS
// ==================================================

const PORT =
    Number(process.env.PORT) || 5000;


// Prototype-only OTP.
// Move this to .env before any real deployment.
const LAND_ACCESS_OTP =
    String(
        process.env.LAND_ACCESS_OTP || "613824"
    ).trim();


// ==================================================
// BASIC SERVER TEST
// ==================================================

app.get("/", (req, res) => {

    res.json({
        message:
            "LandStack Backend is running",
        service:
            "LandStack Land Governance API",
        status:
            "online"
    });

});


// ==================================================
// DATABASE TEST
// ==================================================

app.get("/test-db", async (req, res) => {

    try {

        const result =
            await pool.query(
                "SELECT NOW()"
            );

        res.json({

            message:
                "PostgreSQL connected successfully",

            database:
                process.env.DB_NAME,

            time:
                result.rows[0].now

        });

    } catch (error) {

        console.error(
            "Database connection error:",
            error.message
        );

        res.status(500).json({

            message:
                "Database connection failed",

            error:
                error.message

        });

    }

});


// ==================================================
// FIREBASE TOKEN HELPER
// ==================================================

async function verifyFirebaseUser(req) {

    const authHeader =
        req.headers.authorization || "";


    if (
        !authHeader.startsWith("Bearer ")
    ) {

        throw new Error(
            "No Firebase ID token provided"
        );

    }


    const idToken =
        authHeader.substring(7).trim();


    if (!idToken) {

        throw new Error(
            "Empty Firebase ID token"
        );

    }


    const decodedToken =
        await adminAuth.verifyIdToken(
            idToken
        );


    return decodedToken;

}


// ==================================================
// FIREBASE AUTHENTICATION TEST
// ==================================================

app.get("/auth-test", async (req, res) => {

    try {

        const decodedToken =
            await verifyFirebaseUser(req);


        res.json({

            message:
                "Firebase token verified successfully",

            uid:
                decodedToken.uid,

            email:
                decodedToken.email,

            emailVerified:
                decodedToken.email_verified === true

        });

    } catch (error) {

        console.error(
            "Firebase authentication error:"
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Message:",
            error.message
        );


        res.status(401).json({

            message:
                "Invalid Firebase ID token",

            errorCode:
                error.code || null,

            errorMessage:
                error.message

        });

    }

});


// ==================================================
// SYNC FIREBASE USER WITH POSTGRESQL
// ==================================================

app.post("/users/sync", async (req, res) => {

    try {

        const decodedToken =
            await verifyFirebaseUser(req);


        const firebaseUid =
            decodedToken.uid;

        const email =
            decodedToken.email;

        const emailVerified =
            decodedToken.email_verified === true;


        if (!emailVerified) {

            return res.status(403).json({

                message:
                    "Email must be verified before syncing user."

            });

        }


        const fullName =
            req.body.fullName ||
            decodedToken.name ||
            email?.split("@")[0] ||
            "LandStack User";


        const result =
            await pool.query(

                `
                INSERT INTO users
                (
                    full_name,
                    email,
                    password_hash,
                    role,
                    is_active,
                    firebase_uid
                )

                VALUES
                (
                    $1,
                    $2,
                    NULL,
                    'citizen',
                    TRUE,
                    $3
                )

                ON CONFLICT (firebase_uid)

                DO UPDATE SET

                    full_name =
                        EXCLUDED.full_name,

                    email =
                        EXCLUDED.email

                RETURNING
                    id,
                    full_name,
                    email,
                    role,
                    is_active,
                    firebase_uid,
                    created_at
                `,

                [
                    fullName,
                    email,
                    firebaseUid
                ]

            );


        res.json({

            message:
                "User synchronized with PostgreSQL successfully",

            user:
                result.rows[0]

        });

    } catch (error) {

        console.error(
            "User synchronization error:",
            error.message
        );

        res.status(500).json({

            message:
                "Failed to synchronize user",

            error:
                error.message

        });

    }

});


// ==================================================
// RECORD CITIZEN / OFFICER VIEW ACCESS
// ==================================================

app.post("/view-access", async (req, res) => {

    try {

        const decodedToken =
            await verifyFirebaseUser(req);


        const viewType =
            String(
                req.body.viewType || ""
            ).trim();


        if (
            viewType !== "citizen" &&
            viewType !== "officer"
        ) {

            return res.status(400).json({

                message:
                    "Invalid view type."

            });

        }


        const userResult =
            await pool.query(

                `
                SELECT id
                FROM users
                WHERE firebase_uid = $1
                LIMIT 1
                `,

                [
                    decodedToken.uid
                ]

            );


        if (
            userResult.rows.length === 0
        ) {

            return res.status(404).json({

                message:
                    "LandStack user profile not found."

            });

        }


        const userId =
            userResult.rows[0].id;


        const result =
            await pool.query(

                `
                INSERT INTO view_access_logs
                (
                    user_id,
                    view_type,
                    access_granted
                )

                VALUES
                (
                    $1,
                    $2,
                    TRUE
                )

                RETURNING
                    id,
                    user_id,
                    view_type,
                    access_granted,
                    accessed_at
                `,

                [
                    userId,
                    viewType
                ]

            );


        res.json({

            message:
                "View access recorded successfully.",

            access:
                result.rows[0]

        });

    } catch (error) {

        console.error(
            "View access error:",
            error.message
        );

        res.status(401).json({

            message:
                "View access verification failed.",

            error:
                error.message

        });

    }

});


// ==================================================
// OFFICER VIEW ACCESS
// ==================================================

app.post("/officer/access", async (req, res) => {

    try {

        const decodedToken =
            await verifyFirebaseUser(req);


        if (
            decodedToken.email_verified !== true
        ) {

            return res.status(403).json({

                message:
                    "Email must be verified before officer access."

            });

        }


        const enteredKey =
            String(
                req.body.officerKey || ""
            ).trim();


        if (!enteredKey) {

            return res.status(400).json({

                message:
                    "Officer passkey is required."

            });

        }


        const correctKey =
            String(
                process.env.OFFICER_ACCESS_KEY || ""
            ).trim();


        if (!correctKey) {

            console.error(
                "OFFICER_ACCESS_KEY is not configured."
            );

            return res.status(500).json({

                message:
                    "Officer access is not configured."

            });

        }


        if (
            enteredKey !== correctKey
        ) {

            try {

                const userResult =
                    await pool.query(

                        `
                        SELECT id
                        FROM users
                        WHERE firebase_uid = $1
                        LIMIT 1
                        `,

                        [
                            decodedToken.uid
                        ]

                    );


                if (
                    userResult.rows.length > 0
                ) {

                    await pool.query(

                        `
                        INSERT INTO view_access_logs
                        (
                            user_id,
                            view_type,
                            access_granted
                        )

                        VALUES
                        (
                            $1,
                            'officer',
                            FALSE
                        )
                        `,

                        [
                            userResult.rows[0].id
                        ]

                    );

                }

            } catch (logError) {

                console.error(
                    "Failed to record officer access attempt:",
                    logError.message
                );

            }


            return res.status(403).json({

                message:
                    "Invalid officer passkey."

            });

        }


        const userResult =
            await pool.query(

                `
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    is_active
                FROM users
                WHERE firebase_uid = $1
                LIMIT 1
                `,

                [
                    decodedToken.uid
                ]

            );


        if (
            userResult.rows.length === 0
        ) {

            return res.status(404).json({

                message:
                    "LandStack user profile not found."

            });

        }


        const user =
            userResult.rows[0];


        if (!user.is_active) {

            return res.status(403).json({

                message:
                    "This LandStack account is inactive."

            });

        }


        const accessResult =
            await pool.query(

                `
                INSERT INTO view_access_logs
                (
                    user_id,
                    view_type,
                    access_granted
                )

                VALUES
                (
                    $1,
                    'officer',
                    TRUE
                )

                RETURNING
                    id,
                    user_id,
                    view_type,
                    access_granted,
                    accessed_at
                `,

                [
                    user.id
                ]

            );


        res.json({

            message:
                "Officer access granted.",

            view:
                "officer",

            user: {

                id:
                    user.id,

                fullName:
                    user.full_name,

                email:
                    user.email

            },

            access:
                accessResult.rows[0]

        });

    } catch (error) {

        console.error(
            "Officer access error:",
            error.message
        );

        res.status(401).json({

            message:
                "Officer access verification failed.",

            error:
                error.message

        });

    }

});


// ==================================================
// OFFICER REQUEST VERIFICATION
// ==================================================

async function verifyOfficerRequest(
    req,
    res
) {

    const authHeader =
        req.headers.authorization || "";


    if (
        !authHeader.startsWith("Bearer ")
    ) {

        res.status(401).json({

            message:
                "Authentication token required."

        });

        return null;

    }


    const token =
        authHeader.substring(7).trim();


    try {

        const decodedToken =
            await adminAuth.verifyIdToken(
                token
            );


        if (
            decodedToken.email_verified !== true
        ) {

            res.status(403).json({

                message:
                    "Email must be verified before officer actions."

            });

            return null;

        }


        const officerKey =
            String(
                req.headers["x-officer-key"] ||
                req.body?.officerKey ||
                ""
            ).trim();


        const correctKey =
            String(
                process.env.OFFICER_ACCESS_KEY || ""
            ).trim();


        if (
            !correctKey ||
            officerKey !== correctKey
        ) {

            res.status(403).json({

                message:
                    "Officer authentication required."

            });

            return null;

        }


        return decodedToken;

    } catch (error) {

        console.error(
            "Officer verification authentication error:",
            error.message
        );


        res.status(401).json({

            message:
                "Invalid authentication token."

        });


        return null;

    }

}


// ==================================================
// PUBLIC PARCEL GIS API
// ==================================================
// Public response contains only basic parcel information.
// Sensitive owner, registration, tax amount and legal
// details are not returned here.
// ==================================================

app.get("/api/parcels", async (req, res) => {

    try {

        const query = `

            SELECT

                v.parcel_pk AS id,

                v.parcel_id,

                v.lp_number,

                v.survey_number,

                v.subdivision_number,

                v.ulpin,

                v.area_sq_yards,

                v.village,

                v.mandal,

                v.district,

                v.state,

                v.land_use,

                p.status,

                v.planning_status,

                v.citizen_status,

                v.dispute_indicator,

                v.encumbrance_indicator,

                v.land_tax_due_indicator,

                v.mutation_pending_indicator,

                v.data_origin,

                ST_AsGeoJSON(pg.geom)::json AS geometry

            FROM landstack_integrated_parcel_view v

            INNER JOIN land_parcels p
                ON p.id = v.parcel_pk

            LEFT JOIN LATERAL
            (
                SELECT geom
                FROM parcel_geometry
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) pg ON TRUE

            ORDER BY v.parcel_pk;

        `;


        const result =
            await pool.query(query);


        const features =
            result.rows.map(row => {

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

            });


        res.json({

            type:
                "FeatureCollection",

            features:
                features,

            count:
                features.length,

            dataOrigin:
                "SYNTHETIC"

        });

    } catch (error) {

        console.error(
            "Error loading public parcel information:",
            error.message
        );


        res.status(500).json({

            message:
                "Failed to load parcel information",

            error:
                error.message

        });

    }

});


// ==================================================
// HELPER: FIND PARCEL PRIMARY KEY
// ==================================================

async function resolveParcelId(
    parcelIdentifier
) {

    const value =
        String(
            parcelIdentifier || ""
        ).trim();


    if (!value) {

        return null;

    }


    const result =
        await pool.query(

            `
            SELECT
                id
            FROM land_parcels
            WHERE
                parcel_id = $1
                OR
                id::TEXT = $1
            LIMIT 1
            `,

            [
                value
            ]

        );


    if (
        result.rows.length === 0
    ) {

        return null;

    }


    return result.rows[0].id;

}


// ==================================================
// CITIZEN DETAILED PARCEL INFORMATION
// ==================================================
// Requires:
// 1. Firebase authentication
// 2. Prototype land-access OTP
//
// This keeps sensitive fields away from the public
// /api/parcels endpoint.
// ==================================================

app.get(
    "/api/citizen/parcel-details",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyFirebaseUser(req);


            if (
                decodedToken.email_verified !== true
            ) {

                return res.status(403).json({

                    message:
                        "Email must be verified."

                });

            }


            const parcelIdentifier =
                req.query.parcelId;


            const parcelPk =
                await resolveParcelId(
                    parcelIdentifier
                );


            if (!parcelPk) {

                return res.status(404).json({

                    message:
                        "Parcel not found."

                });

            }


            const enteredOtp =
                String(
                    req.headers["x-land-access-otp"] ||
                    req.query.otp ||
                    ""
                ).trim();


            if (
                !enteredOtp ||
                enteredOtp !== LAND_ACCESS_OTP
            ) {

                return res.status(403).json({

                    message:
                        "Valid land-access OTP is required."

                });

            }


            const result =
                await pool.query(

                    `

                    SELECT

                        v.*,

                        ST_AsGeoJSON(pg.geom)::json
                            AS geometry

                    FROM landstack_integrated_parcel_view v

                    LEFT JOIN LATERAL
                    (
                        SELECT geom
                        FROM parcel_geometry
                        WHERE parcel_id = v.parcel_pk
                        ORDER BY id DESC
                        LIMIT 1
                    ) pg ON TRUE

                    WHERE v.parcel_pk = $1

                    LIMIT 1;

                    `,

                    [
                        parcelPk
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Integrated parcel record not found."

                });

            }


            res.json({

                message:
                    "Detailed land information retrieved successfully.",

                access:
                    "OTP",

                data:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Citizen detailed parcel error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not load detailed land information.",

                error:
                    error.message

            });

        }

    }

);


// ==================================================
// OFFICER - GET ALL INTEGRATED PARCEL DATA
// ==================================================

app.get(
    "/api/officer/parcels",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyOfficerRequest(
                    req,
                    res
                );


            if (!decodedToken) {

                return;

            }


            const result =
                await pool.query(

                    `

                    SELECT

                        v.*,

                        ST_AsGeoJSON(pg.geom)::json
                            AS geometry

                    FROM landstack_integrated_parcel_view v

                    LEFT JOIN LATERAL
                    (
                        SELECT geom
                        FROM parcel_geometry
                        WHERE parcel_id = v.parcel_pk
                        ORDER BY id DESC
                        LIMIT 1
                    ) pg ON TRUE

                    ORDER BY v.parcel_pk;

                    `

                );


            res.json({

                count:
                    result.rows.length,

                features:
                    result.rows

            });

        } catch (error) {

            console.error(
                "Officer integrated parcel error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not load integrated officer parcel data.",

                error:
                    error.message

            });

        }

    }

);


// ==================================================
// OFFICER - GET ONE COMPLETE PARCEL RECORD
// ==================================================

app.get(
    "/api/officer/parcel/:parcelId",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyOfficerRequest(
                    req,
                    res
                );


            if (!decodedToken) {

                return;

            }


            const parcelPk =
                await resolveParcelId(
                    req.params.parcelId
                );


            if (!parcelPk) {

                return res.status(404).json({

                    message:
                        "Parcel not found."

                });

            }


            const result =
                await pool.query(

                    `

                    SELECT

                        v.*,

                        ST_AsGeoJSON(pg.geom)::json
                            AS geometry

                    FROM landstack_integrated_parcel_view v

                    LEFT JOIN LATERAL
                    (
                        SELECT geom
                        FROM parcel_geometry
                        WHERE parcel_id = v.parcel_pk
                        ORDER BY id DESC
                        LIMIT 1
                    ) pg ON TRUE

                    WHERE v.parcel_pk = $1

                    LIMIT 1;

                    `,

                    [
                        parcelPk
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Integrated parcel record not found."

                });

            }


            res.json({

                data:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Officer complete parcel error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not load complete parcel record.",

                error:
                    error.message

            });

        }

    }

);


// ==================================================
// OFFICER PARCEL EDIT HELPER
// ==================================================

function validNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const numberValue =
        Number(value);


    if (
        !Number.isFinite(numberValue) ||
        numberValue < 0
    ) {

        throw new Error(
            "Invalid numeric value."
        );

    }


    return numberValue;

}


function validDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const valueString =
        String(value).trim();


    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            valueString
        )
    ) {

        throw new Error(
            "Date must use YYYY-MM-DD format."
        );

    }


    return valueString;

}


function allowedValue(
    value,
    allowed,
    fieldName
) {

    if (
        !allowed.includes(value)
    ) {

        throw new Error(
            `Invalid ${fieldName}.`
        );

    }


    return value;

}


// ==================================================
// REFRESH DUE DILIGENCE AFTER OFFICER EDIT
// ==================================================

async function refreshDueDiligence(
    client,
    parcelPk
) {

    const result =
        await client.query(

            `

            SELECT

                COALESCE(
                    pt.tax_status,
                    'Unknown'
                ) AS tax_status,

                COALESCE(
                    lt.tax_status,
                    'Not Applicable'
                ) AS land_tax_status,

                COALESCE(
                    lp.planning_status,
                    'Unknown'
                ) AS planning_status,

                COALESCE(
                    bp.permission_status,
                    'Not Applicable'
                ) AS building_status,

                COALESCE(
                    e.status,
                    'Nil'
                ) AS encumbrance_status,

                COALESCE(
                    lr.restriction_status,
                    'None'
                ) AS restriction_status,

                COALESCE(
                    m.status,
                    'Unknown'
                ) AS mutation_status,

                CASE
                    WHEN d.id IS NOT NULL
                    THEN TRUE
                    ELSE FALSE
                END AS has_dispute

            FROM land_parcels p

            LEFT JOIN LATERAL
            (
                SELECT tax_status
                FROM property_tax_records
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) pt ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT tax_status
                FROM land_tax_records
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) lt ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT planning_status
                FROM land_planning
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) lp ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT permission_status
                FROM building_permissions
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) bp ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT status
                FROM encumbrances
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) e ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT restriction_status
                FROM land_restrictions
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) lr ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT status
                FROM land_mutations
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) m ON TRUE

            LEFT JOIN LATERAL
            (
                SELECT id
                FROM land_disputes
                WHERE parcel_id = p.id
                ORDER BY id DESC
                LIMIT 1
            ) d ON TRUE

            WHERE p.id = $1

            LIMIT 1;

            `,

            [
                parcelPk
            ]

        );


    if (
        result.rows.length === 0
    ) {

        return;

    }


    const row =
        result.rows[0];


    const taxCheck =
        row.tax_status === "Paid"
            ? "Clear"
            : "Review Required";


    const landUseCheck =
        row.planning_status === "Conforming"
            ? "Clear"
            : "Review Required";


    const buildingCheck =
        (
            row.building_status === "Approved" ||
            row.building_status === "Not Applicable"
        )
            ? "Clear"
            : "Review Required";


    const encumbranceCheck =
        row.encumbrance_status === "Nil"
            ? "Clear"
            : "Review Required";


    const restrictionCheck =
        row.restriction_status === "None"
            ? "Clear"
            : "Review Required";


    const requiresVerification =
        row.tax_status !== "Paid" ||
        row.land_tax_status === "Due" ||
        row.planning_status !== "Conforming" ||
        (
            row.building_status !== "Approved" &&
            row.building_status !== "Not Applicable"
        ) ||
        row.encumbrance_status !== "Nil" ||
        row.restriction_status !== "None" ||
        row.mutation_status !== "Completed" ||
        row.has_dispute;


    const overallStatus =
        requiresVerification
            ? "Verification Required"
            : "Clear";


    await client.query(

        `

        UPDATE due_diligence

        SET

            tax_check = $1,

            land_use_check = $2,

            building_permission_check = $3,

            encumbrance_check = $4,

            restriction_check = $5,

            overall_status = $6,

            remarks = $7,

            checked_at = NOW()

        WHERE id =

        (

            SELECT id
            FROM due_diligence
            WHERE parcel_id = $8
            ORDER BY id DESC
            LIMIT 1

        )

        `,

        [

            taxCheck,

            landUseCheck,

            buildingCheck,

            encumbranceCheck,

            restrictionCheck,

            overallStatus,

            "Officer-updated integrated due-diligence status. Road access remains not assessed.",

            parcelPk

        ]

    );

}


// ==================================================
// OFFICER - CONTROLLED PARCEL EDIT
// ==================================================
// This endpoint intentionally allows only selected,
// predefined fields.
// Arbitrary SQL or arbitrary column updates are NOT allowed.
// ==================================================
app.post(
    "/officer/parcel-update",
    async (req, res) => {

        const decodedToken =
            await verifyOfficerRequest(
                req,
                res
            );

        if (!decodedToken) {
            return;
        }

        const client =
            await pool.connect();

        try {

            const parcelIdentifier =
                String(
                    req.body.parcelId || ""
                ).trim();

            if (!parcelIdentifier) {

                return res.status(400).json({
                    message:
                        "Parcel ID is required."
                });

            }

            const parcelPk =
                await resolveParcelId(
                    parcelIdentifier
                );

            if (!parcelPk) {

                return res.status(404).json({
                    message:
                        "Parcel not found."
                });

            }

            const updates =
                req.body.updates || {};

            if (
                typeof updates !== "object" ||
                Array.isArray(updates)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid update data."
                });

            }

            await client.query(
                "BEGIN"
            );


            // --------------------------------------
            // PROPERTY TAX
            // --------------------------------------

            if (
                updates.propertyTax &&
                typeof updates.propertyTax === "object"
            ) {

                const propertyTax =
                    updates.propertyTax;

                let newTaxStatus =
                    propertyTax.taxStatus;

                const newAmountPaid =
                    propertyTax.amountPaid !== undefined
                        ? validNumber(
                            propertyTax.amountPaid
                        )
                        : undefined;

                const newPaymentDate =
                    propertyTax.paymentDate !== undefined
                        ? validDate(
                            propertyTax.paymentDate
                        )
                        : undefined;

                if (
                    newTaxStatus !== undefined
                ) {

                    newTaxStatus =
                        allowedValue(
                            newTaxStatus,
                            [
                                "Paid",
                                "Due",
                                "Partially Paid"
                            ],
                            "property tax status"
                        );

                }

                if (
                    newTaxStatus === "Paid"
                ) {

                    await client.query(
                        `
                        UPDATE property_tax_records
                        SET
                            amount_paid =
                                tax_amount,
                            tax_status =
                                'Paid',
                            payment_date =
                                COALESCE(
                                    $1::DATE,
                                    CURRENT_DATE
                                )
                        WHERE id =
                        (
                            SELECT id
                            FROM property_tax_records
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            newPaymentDate ?? null,
                            parcelPk
                        ]
                    );

                } else if (
                    newTaxStatus === "Due"
                ) {

                    await client.query(
                        `
                        UPDATE property_tax_records
                        SET
                            amount_paid = 0,
                            tax_status = 'Due',
                            payment_date = NULL
                        WHERE id =
                        (
                            SELECT id
                            FROM property_tax_records
                            WHERE parcel_id = $1
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            parcelPk
                        ]
                    );

                } else {

                    const fields = [];
                    const values = [];
                    let index = 1;

                    if (
                        newAmountPaid !== undefined
                    ) {

                        fields.push(
                            `amount_paid = $${index++}`
                        );

                        values.push(
                            newAmountPaid
                        );

                    }

                    if (
                        newTaxStatus !== undefined
                    ) {

                        fields.push(
                            `tax_status = $${index++}`
                        );

                        values.push(
                            newTaxStatus
                        );

                    }

                    if (
                        newPaymentDate !== undefined
                    ) {

                        fields.push(
                            `payment_date = $${index++}::DATE`
                        );

                        values.push(
                            newPaymentDate
                        );

                    }

                    if (
                        fields.length > 0
                    ) {

                        values.push(
                            parcelPk
                        );

                        await client.query(
                            `
                            UPDATE property_tax_records
                            SET
                                ${fields.join(", ")}
                            WHERE id =
                            (
                                SELECT id
                                FROM property_tax_records
                                WHERE parcel_id = $${index}
                                ORDER BY id DESC
                                LIMIT 1
                            )
                            `,
                            values
                        );

                    }

                }

            }


            // --------------------------------------
            // LAND TAX
            // --------------------------------------

            if (
                updates.landTax &&
                typeof updates.landTax === "object"
            ) {

                const landTax =
                    updates.landTax;

                let newLandTaxStatus =
                    landTax.taxStatus;

                const newLandAmountPaid =
                    landTax.amountPaid !== undefined
                        ? validNumber(
                            landTax.amountPaid
                        )
                        : undefined;

                const newLandPaymentDate =
                    landTax.paymentDate !== undefined
                        ? validDate(
                            landTax.paymentDate
                        )
                        : undefined;

                if (
                    newLandTaxStatus !== undefined
                ) {

                    newLandTaxStatus =
                        allowedValue(
                            newLandTaxStatus,
                            [
                                "Paid",
                                "Due",
                                "Not Applicable"
                            ],
                            "land tax status"
                        );

                }

                if (
                    newLandTaxStatus === "Paid"
                ) {

                    await client.query(
                        `
                        UPDATE land_tax_records
                        SET
                            amount_paid =
                                land_tax_amount,
                            tax_status =
                                'Paid',
                            payment_date =
                                COALESCE(
                                    $1::DATE,
                                    CURRENT_DATE
                                )
                        WHERE id =
                        (
                            SELECT id
                            FROM land_tax_records
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            newLandPaymentDate ?? null,
                            parcelPk
                        ]
                    );

                } else if (
                    newLandTaxStatus === "Due"
                ) {

                    await client.query(
                        `
                        UPDATE land_tax_records
                        SET
                            amount_paid = 0,
                            tax_status = 'Due',
                            payment_date = NULL
                        WHERE id =
                        (
                            SELECT id
                            FROM land_tax_records
                            WHERE parcel_id = $1
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            parcelPk
                        ]
                    );

                } else if (
                    newLandTaxStatus === "Not Applicable"
                ) {

                    

                } else {

                    const fields = [];
                    const values = [];
                    let index = 1;

                    if (
                        newLandAmountPaid !== undefined
                    ) {

                        fields.push(
                            `amount_paid = $${index++}`
                        );

                        values.push(
                            newLandAmountPaid
                        );

                    }

                    if (
                        newLandTaxStatus !== undefined
                    ) {

                        fields.push(
                            `tax_status = $${index++}`
                        );

                        values.push(
                            newLandTaxStatus
                        );

                    }

                    if (
                        newLandPaymentDate !== undefined
                    ) {

                        fields.push(
                            `payment_date = $${index++}::DATE`
                        );

                        values.push(
                            newLandPaymentDate
                        );

                    }

                    if (
                        fields.length > 0
                    ) {

                        values.push(
                            parcelPk
                        );

                        await client.query(
                            `
                            UPDATE land_tax_records
                            SET
                                ${fields.join(", ")}
                            WHERE id =
                            (
                                SELECT id
                                FROM land_tax_records
                                WHERE parcel_id = $${index}
                                ORDER BY id DESC
                                LIMIT 1
                            )
                            `,
                            values
                        );

                    }

                }

            }
// --------------------------------------
// MUTATION STATUS
// --------------------------------------

if (
    updates.mutation &&
    typeof updates.mutation === "object"
) {

    const mutationStatus =
        allowedValue(
            String(
                updates.mutation.status || ""
            ).trim(),
            [
                "Pending",
                "Completed"
            ],
            "mutation status"
        );

    await client.query(
        `
        UPDATE land_mutations
        SET
            status = $1::varchar,
            approval_date =
                CASE
                    WHEN $1::varchar = 'Completed'
                    THEN COALESCE(
                        approval_date,
                        CURRENT_DATE
                    )
                    ELSE NULL
                END,
            updated_at = NOW()
        WHERE id =
        (
            SELECT id
            FROM land_mutations
            WHERE parcel_id = $2
            ORDER BY id DESC
            LIMIT 1
        )
        `,
        [
            mutationStatus,
            parcelPk
        ]
    );

}


            // --------------------------------------
            // PLANNING STATUS
            // --------------------------------------

            if (
                updates.planning &&
                typeof updates.planning === "object"
            ) {

                if (
                    updates.planning.status !== undefined
                ) {

                    const planningStatus =
                        allowedValue(
                            String(
                                updates.planning.status
                            ).trim(),
                            [
                                "Conforming",
                                "Verification Required"
                            ],
                            "planning status"
                        );

                    await client.query(
                        `
                        UPDATE land_planning
                        SET
                            planning_status = $1
                        WHERE id =
                        (
                            SELECT id
                            FROM land_planning
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            planningStatus,
                            parcelPk
                        ]
                    );

                }

            }


            // --------------------------------------
            // BUILDING PERMISSION STATUS
            // --------------------------------------

            if (
                updates.building &&
                typeof updates.building === "object"
            ) {

                if (
                    updates.building.status !== undefined
                ) {

                    const buildingStatus =
                        allowedValue(
                            String(
                                updates.building.status
                            ).trim(),
                            [
                                "Approved",
                                "Under Review",
                                "Not Applicable"
                            ],
                            "building permission status"
                        );

                    await client.query(
                        `
                        UPDATE building_permissions
                        SET
                            permission_status = $1
                        WHERE id =
                        (
                            SELECT id
                            FROM building_permissions
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            buildingStatus,
                            parcelPk
                        ]
                    );

                }

            }


            // --------------------------------------
            // RESTRICTION STATUS
            // --------------------------------------

            if (
                updates.restriction &&
                typeof updates.restriction === "object"
            ) {

                if (
                    updates.restriction.status !== undefined
                ) {

                    const restrictionStatus =
                        allowedValue(
                            String(
                                updates.restriction.status
                            ).trim(),
                            [
                                "None",
                                "Review Required"
                            ],
                            "restriction status"
                        );

                    await client.query(
                        `
                        UPDATE land_restrictions
                        SET
                            restriction_status = $1
                        WHERE id =
                        (
                            SELECT id
                            FROM land_restrictions
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            restrictionStatus,
                            parcelPk
                        ]
                    );

                    await client.query(
                        `
                        UPDATE parcel_restrictions
                        SET
                            restriction_status = $1
                        WHERE id =
                        (
                            SELECT id
                            FROM parcel_restrictions
                            WHERE parcel_id = $2
                            ORDER BY id DESC
                            LIMIT 1
                        )
                        `,
                        [
                            restrictionStatus,
                            parcelPk
                        ]
                    );

                }

            }


            // --------------------------------------
            // REFRESH DUE DILIGENCE
            // --------------------------------------

            await refreshDueDiligence(
                client,
                parcelPk
            );


            // --------------------------------------
            // AUDIT LOG
            // --------------------------------------

            const officerResult =
                await client.query(
                    `
                    SELECT id
                    FROM users
                    WHERE firebase_uid = $1::text
                    LIMIT 1
                    `,
                    [
                        decodedToken.uid
                    ]
                );

            const officerUserId =
                officerResult.rows[0]?.id || null;


            const auditDetails =
                JSON.stringify({
                    parcel_id:
                        parcelIdentifier,

                    parcel_pk:
                        parcelPk,

                    updates:
                        updates,

                    officer_firebase_uid:
                        decodedToken.uid
                });


            await client.query(
                `
                INSERT INTO audit_logs
                (
                    user_id,
                    action,
                    table_name,
                    record_id,
                    action_details,
                    created_at
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    CURRENT_TIMESTAMP
                )
                `,
                [
                    officerUserId,
                    "OFFICER_PARCEL_UPDATE",
                    "land_parcels",
                    parcelPk,
                    auditDetails
                ]
            );


            // --------------------------------------
            // GET UPDATED RECORD
            // --------------------------------------

            const updatedResult =
                await client.query(
                    `
                    SELECT *
                    FROM landstack_integrated_parcel_view
                    WHERE parcel_pk = $1
                    LIMIT 1;
                    `,
                    [
                        parcelPk
                    ]
                );


            await client.query(
                "COMMIT"
            );


            res.json({

                message:
                    "Officer parcel update saved successfully.",

                updatedBy:
                    decodedToken.uid,

                auditLogged:
                    true,

                data:
                    updatedResult.rows[0] || null

            });


        } catch (error) {

            await client.query(
                "ROLLBACK"
            );

          console.error(
    "Officer parcel update error:",
    error
);

            res.status(400).json({

                message:
                    "Officer parcel update could not be saved.",

                error:
                    error.message

            });

        } finally {

            client.release();

        }

    }

);
// --------------------------------------
// OFFICER AUDIT HISTORY
// --------------------------------------

app.get(
    "/officer/audit-history",
    async (req, res) => {

        const decodedToken =
            await verifyOfficerRequest(
                req,
                res
            );

        if (!decodedToken) {
            return;
        }

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        a.id,
                        a.action,
                        a.table_name,
                        a.record_id,
                        a.action_details,
                        a.created_at,
                        u.full_name AS officer_name,
                        u.email AS officer_email
                    FROM audit_logs a
                    LEFT JOIN users u
                        ON a.user_id = u.id
                    ORDER BY
                        a.created_at DESC
                    LIMIT 20
                    `
                );

            res.json({
                success: true,
                history: result.rows
            });

        } catch (error) {

            console.error(
                "Officer audit history error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Could not load audit history."
            });

        }
    }
);


// ==================================================
// OFFICER PARCEL VERIFICATION STORAGE
// ==================================================

app.post(
    "/officer/verification",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyOfficerRequest(
                    req,
                    res
                );


            if (!decodedToken) {

                return;

            }


            const parcelId =
                String(
                    req.body.parcelId || ""
                ).trim();


            const lpNumber =
                req.body.lpNumber !== undefined &&
                req.body.lpNumber !== null

                    ? String(
                        req.body.lpNumber
                    ).trim()

                    : null;


            const surveyNumber =
                req.body.surveyNumber !== undefined &&
                req.body.surveyNumber !== null

                    ? String(
                        req.body.surveyNumber
                    ).trim()

                    : null;


            const action =
                String(
                    req.body.action || ""
                ).trim();


            const note =
                req.body.note
                    ? String(
                        req.body.note
                    ).trim()
                    : null;


            const allowedActions = [

                "verification_required",

                "further_review",

                "cleared"

            ];


            if (!parcelId) {

                return res.status(400).json({

                    message:
                        "Parcel ID is required."

                });

            }


            if (
                !allowedActions.includes(
                    action
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid verification action."

                });

            }


            const result =
                await pool.query(

                    `

                    INSERT INTO parcel_verification_actions

                    (
                        parcel_id,
                        lp_number,
                        survey_number,
                        action,
                        note,
                        officer_uid
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )

                    RETURNING *

                    `,

                    [
                        parcelId,
                        lpNumber,
                        surveyNumber,
                        action,
                        note,
                        decodedToken.uid
                    ]

                );


            res.status(201).json({

                message:
                    "Officer verification action saved.",

                action:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Officer verification save error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not save officer verification action."

            });

        }

    }

);


// ==================================================
// GET LATEST OFFICER VERIFICATION STATUS
// ==================================================

app.get(
    "/officer/verification",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyOfficerRequest(
                    req,
                    res
                );


            if (!decodedToken) {

                return;

            }


            const parcelId =
                String(
                    req.query.parcelId || ""
                ).trim();


            if (!parcelId) {

                return res.status(400).json({

                    message:
                        "Parcel ID is required."

                });

            }


            const result =
                await pool.query(

                    `

                    SELECT

                        id,

                        parcel_id,

                        lp_number,

                        survey_number,

                        action,

                        note,

                        officer_uid,

                        created_at

                    FROM parcel_verification_actions

                    WHERE parcel_id = $1

                    ORDER BY
                        created_at DESC

                    LIMIT 1

                    `,

                    [
                        parcelId
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                return res.json({

                    found:
                        false,

                    status:
                        "none"

                });

            }


            res.json({

                found:
                    true,

                status:
                    result.rows[0].action,

                action:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Officer verification status error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not load officer verification status."

            });

        }

    }

);


// ==================================================
// GET OFFICER VERIFICATION QUEUE
// ==================================================

app.get(
    "/officer/verification-queue",
    async (req, res) => {

        try {

            const decodedToken =
                await verifyOfficerRequest(
                    req,
                    res
                );


            if (!decodedToken) {

                return;

            }


            const result =
                await pool.query(

                    `

                    SELECT

                        latest.id,

                        latest.parcel_id,

                        latest.lp_number,

                        latest.survey_number,

                        latest.action,

                        latest.note,

                        latest.officer_uid,

                        latest.created_at

                    FROM

                    (

                        SELECT DISTINCT ON (parcel_id)

                            id,

                            parcel_id,

                            lp_number,

                            survey_number,

                            action,

                            note,

                            officer_uid,

                            created_at

                        FROM parcel_verification_actions

                        ORDER BY

                            parcel_id,

                            created_at DESC

                    ) AS latest

                    WHERE latest.action IN

                    (

                        'verification_required',

                        'further_review'

                    )

                    ORDER BY
                        latest.created_at DESC

                    `

                );


            res.json({

                count:
                    result.rows.length,

                items:
                    result.rows

            });

        } catch (error) {

            console.error(
                "Officer verification queue error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Could not load officer verification queue."

            });

        }

    }

);


// ==================================================
// START SERVER
// ==================================================

const server =
    app.listen(
        PORT,
        () => {

            console.log(
                `LandStack server running on http://localhost:${PORT}`
            );

            console.log(
                "Integrated parcel data:",
                "landstack_integrated_parcel_view"
            );

            console.log(
                "Public GIS endpoint:",
                "/api/parcels"
            );

            console.log(
                "Officer GIS endpoint:",
                "/api/officer/parcels"
            );

        }
    );


// ==================================================
// SERVER ERROR HANDLER
// ==================================================

server.on(
    "error",
    (error) => {

        console.error(
            "SERVER ERROR:",
            error
        );

    }
);


// ==================================================
// SERVER CLOSE HANDLER
// ==================================================

server.on(
    "close",
    () => {

        console.log(
            "SERVER CLOSED"
        );

    }
);
// ==========================================================
// LANDSTACK NEXT BATCH
// Mutation Workflow + Verification Report +
// Satellite Change Detection Prototype
// ==========================================================

if (typeof document !== "undefined") {
    (function setupLandStackNextBatch() {

    // ------------------------------------------------------
    // STYLES
    // ------------------------------------------------------

    if (
        !document.getElementById(
            "landstackNextBatchStyles"
        )
    ) {

        const style =
            document.createElement("style");


        style.id =
            "landstackNextBatchStyles";


        style.textContent = `

            .ls-next-feature-panel {
                margin-top: 18px;
                padding: 18px;
                border: 1px solid #c8d1d9;
                border-top: 4px solid #123b5d;
                border-radius: 5px;
                background: #fafbfc;
            }


            .ls-next-feature-title {
                margin: 0 0 5px 0;
                color: #123b5d;
                font-size: 17px;
            }


            .ls-next-feature-subtitle {
                margin: 0 0 14px 0;
                color: #65727e;
                font-size: 12px;
                line-height: 1.5;
            }


            .ls-next-button-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
            }


            .ls-next-secondary {
                background: #ffffff !important;
                color: #123b5d !important;
                border-color: #164968 !important;
            }


            .ls-next-print {
                background: #ffffff !important;
                color: #286749 !important;
                border-color: #286749 !important;
            }


            .ls-next-status-box {
                margin-top: 12px;
                padding: 10px 12px;
                border: 1px solid #dbe2e8;
                background: #ffffff;
                border-radius: 4px;
                color: #334155;
                font-size: 13px;
            }


            .ls-next-field {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-top: 10px;
            }


            .ls-next-field label {
                color: #123b5d;
                font-size: 12px;
                font-weight: 700;
            }


            .ls-next-field select {
                width: 100%;
                box-sizing: border-box;
            }


            .ls-next-demo-banner {
                padding: 9px 11px;
                margin-bottom: 12px;
                border: 1px solid #d7dee6;
                background: #f4f6f8;
                color: #65727e;
                border-radius: 4px;
                font-size: 12px;
                line-height: 1.5;
            }

        `;


        document.head.appendChild(
            style
        );

    }

    
    // ------------------------------------------------------
    // HELPER: SHOW CURRENT PARCEL AGAIN
    // ------------------------------------------------------

    function refreshCurrentOfficerParcel(
        updatedParcel
    ) {

        if (!updatedParcel) {
            return;
        }


        selectedOfficerParcel =
            updatedParcel;


        showOfficerParcelInformation(
            updatedParcel
        );


        updateVerificationSummary(
            updatedParcel
        );


        if (
            typeof loadOfficerVerificationStatus ===
            "function"
        ) {

            loadOfficerVerificationStatus(
                updatedParcel
            );

        }


        if (
            typeof loadOfficerVerificationQueue ===
            "function"
        ) {

            loadOfficerVerificationQueue();

        }


        if (
            typeof loadOfficerDashboardSummary ===
            "function"
        ) {

            loadOfficerDashboardSummary();

        }


        if (
            typeof loadLandStackMainDashboardCards ===
            "function"
        ) {

            loadLandStackMainDashboardCards();

        }

    }


    // ------------------------------------------------------
    // MUTATION WORKFLOW
    // ------------------------------------------------------

    async function updateMutationStatusFromWorkflow(
        newStatus
    ) {

        if (!selectedOfficerParcel) {

            alert(
                "Please select a parcel first."
            );

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
                                    selectedOfficerParcel.parcel_id,

                                updates: {

                                    mutation: {

                                        status:
                                            newStatus

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
                    "Mutation update failed."
                );

            }


            refreshCurrentOfficerParcel(
                data.data
            );


            const mutationMessage =
                document.getElementById(
                    "landstackMutationWorkflowMessage"
                );


            if (mutationMessage) {

                mutationMessage.textContent =
                    newStatus === "Completed"
                        ? "Mutation marked as completed."
                        : "Mutation remains pending.";

            }

        } catch (error) {

            console.error(
                "Mutation workflow error:",
                error
            );


            alert(
                error.message
            );

        }

    }
    
    
    // ------------------------------------------------------
    // CREATE REPORT HTML
    // ------------------------------------------------------

    function reportValue(
        value
    ) {

        return escapeHtml(
            value === null ||
            value === undefined ||
            value === ""
                ? "Not available"
                : value
        );

    }


    function createVerificationReportHtml(
        parcel,
        verification
    ) {

        const reference =
            getOfficerReferenceText(
                parcel
            );


        const generatedAt =
            new Date().toLocaleString();


        const verificationStatus =
            verification?.status ||
            parcel.verification_status ||
            "No verification action recorded";
        

        return `
        
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        LandStack Verification Report
    </title>

    <style>

        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #24313d;
            background: #ffffff;
        }

        .header {
            border-bottom: 4px solid #123b5d;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        h1 {
            color: #123b5d;
            margin: 0;
        }

        h2 {
            color: #123b5d;
            margin-top: 24px;
            border-bottom: 1px solid #c8d1d9;
            padding-bottom: 7px;
        }

        .demo {
            padding: 10px;
            background: #f3f5f7;
            border: 1px solid #c8d1d9;
            margin-bottom: 18px;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #c8d1d9;
            padding: 9px;
            text-align: left;
            vertical-align: top;
        }

        th {
            width: 28%;
            background: #f3f5f7;
        }

        .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #c8d1d9;
            color: #65727e;
            font-size: 12px;
        }

    </style>

</head>

<body>

    <div class="header">

        <h1>
            LandStack Verification Report
        </h1>

        <p>
            ${reportValue(reference)}
        </p>

    </div>


    <div class="demo">

        <strong>
            LandStack Prototype – Synthetic Data
        </strong>

        <br>

        This report is generated from the
        LandStack demonstration dataset and
        is not an official government record.

    </div>


    <h2>
        Parcel Identity
    </h2>

    <table>

        <tr>
            <th>Parcel ID</th>
            <td>${reportValue(parcel.parcel_id)}</td>
        </tr>

        <tr>
            <th>LP Number</th>
            <td>${reportValue(parcel.lp_number)}</td>
        </tr>

        <tr>
            <th>Survey Number</th>
            <td>${reportValue(parcel.survey_number)}</td>
        </tr>

        <tr>
            <th>Subdivision</th>
            <td>${reportValue(parcel.subdivision_number)}</td>
        </tr>

        <tr>
            <th>ULPIN</th>
            <td>${reportValue(parcel.ulpin)}</td>
        </tr>

        <tr>
            <th>Area</th>
            <td>${reportValue(parcel.area_sq_yards)} sq. yd.</td>
        </tr>

        <tr>
            <th>Village</th>
            <td>${reportValue(parcel.village)}</td>
        </tr>

        <tr>
            <th>Mandal</th>
            <td>${reportValue(parcel.mandal)}</td>
        </tr>

        <tr>
            <th>District</th>
            <td>${reportValue(parcel.district)}</td>
        </tr>

    </table>


    <h2>
        Ownership & Registration
    </h2>

    <table>

        <tr>
            <th>Owner</th>
            <td>${reportValue(parcel.owner_name)}</td>
        </tr>

        <tr>
            <th>Owner Type</th>
            <td>${reportValue(parcel.owner_type)}</td>
        </tr>

        <tr>
            <th>Ownership Status</th>
            <td>${reportValue(parcel.ownership_status)}</td>
        </tr>

        <tr>
            <th>Transaction Type</th>
            <td>${reportValue(parcel.transaction_type)}</td>
        </tr>

        <tr>
            <th>Registration Number</th>
            <td>${reportValue(parcel.registration_number)}</td>
        </tr>

        <tr>
            <th>Transaction Date</th>
            <td>${reportValue(parcel.transaction_date)}</td>
        </tr>

        <tr>
            <th>Registration Status</th>
            <td>${reportValue(parcel.registration_status)}</td>
        </tr>

    </table>


    <h2>
        Land Use & Planning
    </h2>

    <table>

        <tr>
            <th>Current Land Use</th>
            <td>${reportValue(parcel.current_land_use || parcel.land_use)}</td>
        </tr>

        <tr>
            <th>Previous Land Use</th>
            <td>${reportValue(parcel.previous_land_use)}</td>
        </tr>

        <tr>
            <th>Conversion Required</th>
            <td>${reportValue(parcel.land_use_conversion_required)}</td>
        </tr>

        <tr>
            <th>Conversion Status</th>
            <td>${reportValue(parcel.land_use_conversion_status)}</td>
        </tr>

        <tr>
            <th>Zoning</th>
            <td>${reportValue(parcel.zoning)}</td>
        </tr>

        <tr>
            <th>Planning Status</th>
            <td>${reportValue(parcel.planning_status)}</td>
        </tr>

    </table>


    <h2>
        Property Tax & Land Tax
    </h2>

    <table>

        <tr>
            <th>Property Tax Number</th>
            <td>${reportValue(parcel.property_tax_number)}</td>
        </tr>

        <tr>
            <th>Property Tax Status</th>
            <td>${reportValue(parcel.tax_status)}</td>
        </tr>

        <tr>
            <th>Property Tax Amount</th>
            <td>${reportValue(parcel.tax_amount)}</td>
        </tr>

        <tr>
            <th>Amount Paid</th>
            <td>${reportValue(parcel.amount_paid)}</td>
        </tr>

        <tr>
            <th>Land Tax Assessment Number</th>
            <td>${reportValue(parcel.land_tax_assessment_number)}</td>
        </tr>

        <tr>
            <th>Land Tax Status</th>
            <td>${reportValue(parcel.land_tax_status)}</td>
        </tr>

        <tr>
            <th>Land Tax Amount</th>
            <td>${reportValue(parcel.land_tax_amount)}</td>
        </tr>

    </table>


    <h2>
        Building Permission
    </h2>

    <table>

        <tr>
            <th>Permission Number</th>
            <td>${reportValue(parcel.permission_number)}</td>
        </tr>

        <tr>
            <th>Building Type</th>
            <td>${reportValue(parcel.building_type)}</td>
        </tr>

        <tr>
            <th>Number of Floors</th>
            <td>${reportValue(parcel.number_of_floors)}</td>
        </tr>

        <tr>
            <th>Built-up Area</th>
            <td>${reportValue(parcel.built_up_area_sqft)} sq. ft.</td>
        </tr>

        <tr>
            <th>Permission Status</th>
            <td>${reportValue(parcel.building_permission_status)}</td>
        </tr>

    </table>


    <h2>
        Encumbrance & Restrictions
    </h2>

    <table>

        <tr>
            <th>Encumbrance Status</th>
            <td>${reportValue(parcel.encumbrance_status)}</td>
        </tr>

        <tr>
            <th>Encumbrance Type</th>
            <td>${reportValue(parcel.encumbrance_type)}</td>
        </tr>

        <tr>
            <th>Restriction Type</th>
            <td>${reportValue(parcel.restriction_type)}</td>
        </tr>

        <tr>
            <th>Restriction Status</th>
            <td>${reportValue(parcel.restriction_status)}</td>
        </tr>

        <tr>
            <th>Restriction Authority</th>
            <td>${reportValue(parcel.restriction_authority)}</td>
        </tr>

    </table>


    <h2>
        Land Dispute
    </h2>

    <table>

        <tr>
            <th>Dispute Status</th>
            <td>${reportValue(parcel.dispute_status)}</td>
        </tr>

        <tr>
            <th>Dispute Reference</th>
            <td>${reportValue(parcel.dispute_reference)}</td>
        </tr>

        <tr>
            <th>Dispute Type</th>
            <td>${reportValue(parcel.dispute_type)}</td>
        </tr>

        <tr>
            <th>Authority</th>
            <td>${reportValue(parcel.dispute_authority)}</td>
        </tr>

        <tr>
            <th>Current Status</th>
            <td>${reportValue(parcel.dispute_current_status)}</td>
        </tr>

    </table>


    <h2>
        Mutation
    </h2>

    <table>

        <tr>
            <th>Mutation Application Number</th>
            <td>${reportValue(parcel.mutation_application_number)}</td>
        </tr>

        <tr>
            <th>Mutation Type</th>
            <td>${reportValue(parcel.mutation_type)}</td>
        </tr>

        <tr>
            <th>Mutation Status</th>
            <td>${reportValue(parcel.mutation_status)}</td>
        </tr>

    </table>


    <h2>
        Due Diligence & Verification
    </h2>

    <table>

        <tr>
            <th>Due Diligence Status</th>
            <td>${reportValue(parcel.due_diligence_status)}</td>
        </tr>

        <tr>
            <th>Citizen Status</th>
            <td>${reportValue(parcel.citizen_status)}</td>
        </tr>

        <tr>
            <th>Latest Verification Status</th>
            <td>${reportValue(verificationStatus)}</td>
        </tr>

        <tr>
            <th>Verification Note</th>
            <td>${reportValue(verification?.action?.note)}</td>
        </tr>

    </table>


    <div class="footer">

        Generated by LandStack on:
        ${reportValue(generatedAt)}

    </div>

</body>

</html>

        `;

    }


    // ------------------------------------------------------
    // DOWNLOAD REPORT
    // ------------------------------------------------------

    async function downloadVerificationReport() {

        if (!selectedOfficerParcel) {

            alert(
                "Please select a parcel first."
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


            const idToken =
                await user.getIdToken(true);


            const response =
                await fetch(

                    `${SERVER_URL}/officer/verification?parcelId=` +
                    encodeURIComponent(
                        selectedOfficerParcel.parcel_id
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


            const verification =
                response.ok
                    ? await response.json()
                    : null;


            const html =
                createVerificationReportHtml(
                    selectedOfficerParcel,
                    verification
                );


            const blob =
                new Blob(
                    [html],
                    {
                        type:
                            "text/html;charset=utf-8"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const reference =
                getOfficerReferenceText(
                    selectedOfficerParcel
                )
                    .replace(
                        /[^a-z0-9]+/gi,
                        "_"
                    );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                `LandStack_Verification_Report_${reference}.html`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );

        } catch (error) {

            console.error(
                "Report generation error:",
                error
            );


            alert(
                error.message
            );

        }

    }


    // ------------------------------------------------------
    // PRINT REPORT
    // ------------------------------------------------------

    async function printVerificationReport() {

        if (!selectedOfficerParcel) {

            alert(
                "Please select a parcel first."
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


            const idToken =
                await user.getIdToken(true);


            const response =
                await fetch(

                    `${SERVER_URL}/officer/verification?parcelId=` +
                    encodeURIComponent(
                        selectedOfficerParcel.parcel_id
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


            const verification =
                response.ok
                    ? await response.json()
                    : null;


            const html =
                createVerificationReportHtml(
                    selectedOfficerParcel,
                    verification
                );


            const printWindow =
                window.open(
                    "",
                    "_blank"
                );


            if (!printWindow) {

                alert(
                    "Please allow pop-ups to print the report."
                );

                return;

            }


            printWindow.document.open();

            printWindow.document.write(
                html
            );

            printWindow.document.close();


            printWindow.focus();


            setTimeout(
                function () {

                    printWindow.print();

                },
                500
            );

        } catch (error) {

            console.error(
                "Report print error:",
                error
            );


            alert(
                error.message
            );

        }

    }


    // ------------------------------------------------------
    // SATELLITE CHANGE DETECTION PROTOTYPE
    // ------------------------------------------------------

    function runSatelliteChangeDetection() {

        if (!selectedOfficerParcel) {

            return;

        }


        const recordedUse =
            String(
                selectedOfficerParcel.current_land_use ||
                selectedOfficerParcel.land_use ||
                ""
            ).trim();


        const observedUse =
            document.getElementById(
                "lsSatelliteObservedUse"
            )?.value ||
            "";


        const result =
            document.getElementById(
                "lsSatelliteChangeResult"
            );


        if (!result) {

            return;

        }


        if (!observedUse) {

            result.textContent =
                "Select an observed-use value.";

            return;

        }


        if (
            recordedUse.toLowerCase() ===
            observedUse.toLowerCase()
        ) {

            result.textContent =
                "No apparent land-use change in this prototype comparison.";

        } else {

            result.textContent =
                `Possible land-use change detected: recorded "${recordedUse || "Not available"}" versus observed "${observedUse}". Officer review recommended.`;

        }

    }


    // ------------------------------------------------------
    // ADD NEXT FEATURES TO OFFICER PARCEL INFORMATION
    // ------------------------------------------------------

    if (
        !window.landStackNextFeatureWrapperInstalled
    ) {

        window.landStackNextFeatureWrapperInstalled =
            true;


        const originalShowOfficerParcelInformation =
            showOfficerParcelInformation;


        showOfficerParcelInformation =
            function (
                parcel
            ) {

                originalShowOfficerParcelInformation(
                    parcel
                );


                const container =
                    document.getElementById(
                        "officerParcelInfo"
                    );


                if (
                    !container ||
                    !parcel
                ) {

                    return;

                }


                // ------------------------------------------
                // MUTATION WORKFLOW
                // ------------------------------------------

                const mutationPanel =
                    document.createElement(
                        "div"
                    );


                mutationPanel.className =
                    "ls-next-feature-panel";


                mutationPanel.innerHTML = `

                    <h4
                        class="ls-next-feature-title"
                    >
                        Mutation Workflow
                    </h4>

                    <p
                        class="ls-next-feature-subtitle"
                    >
                        Review and update the current
                        mutation status for this parcel.
                    </p>

                    <div
                        class="ls-next-status-box"
                    >

                        <strong>
                            Current Mutation Status:
                        </strong>

                        ${
                            escapeHtml(
                                parcel.mutation_status ||
                                "Not available"
                            )
                        }

                    </div>

                    <div
                        class="ls-next-button-row"
                    >

                        <button
                            type="button"
                            id="lsMutationPendingBtn"
                            class="ls-next-secondary"
                        >
                            Keep Pending
                        </button>

                        <button
                            type="button"
                            id="lsMutationCompletedBtn"
                        >
                            Mark Completed
                        </button>

                    </div>

                    <div
                        id="landstackMutationWorkflowMessage"
                        class="ls-next-status-box"
                        style="display:none;"
                    ></div>

                `;


                container.appendChild(
                    mutationPanel
                );


                const pendingBtn =
                    document.getElementById(
                        "lsMutationPendingBtn"
                    );


                const completedBtn =
                    document.getElementById(
                        "lsMutationCompletedBtn"
                    );


                const mutationMessage =
                    document.getElementById(
                        "landstackMutationWorkflowMessage"
                    );


                if (pendingBtn) {

                    pendingBtn.addEventListener(
                        "click",
                        async function () {

                            if (mutationMessage) {

                                mutationMessage.style.display =
                                    "block";

                                mutationMessage.textContent =
                                    "Updating mutation status...";

                            }


                            await updateMutationStatusFromWorkflow(
                                "Pending"
                            );

                        }
                    );

                }


                if (completedBtn) {

                    completedBtn.addEventListener(
                        "click",
                        async function () {

                            if (mutationMessage) {

                                mutationMessage.style.display =
                                    "block";

                                mutationMessage.textContent =
                                    "Updating mutation status...";

                            }


                            await updateMutationStatusFromWorkflow(
                                "Completed"
                            );

                        }
                    );

                }


                // ------------------------------------------
                // REPORT PANEL
                // ------------------------------------------

                const reportPanel =
                    document.createElement(
                        "div"
                    );


                reportPanel.className =
                    "ls-next-feature-panel";


                reportPanel.innerHTML = `

                    <h4
                        class="ls-next-feature-title"
                    >
                        Land Verification Report
                    </h4>

                    <p
                        class="ls-next-feature-subtitle"
                    >
                        Generate a print-ready report from
                        the current integrated parcel record.
                    </p>

                    <div
                        class="ls-next-button-row"
                    >

                        <button
                            type="button"
                            id="landstackDownloadReportBtn"
                        >
                            Download Verification Report
                        </button>

                        <button
                            type="button"
                            id="landstackPrintReportBtn"
                            class="ls-next-print"
                        >
                            Print Verification Report
                        </button>

                    </div>

                `;


                container.appendChild(
                    reportPanel
                );


                const downloadBtn =
                    document.getElementById(
                        "landstackDownloadReportBtn"
                    );


                const printBtn =
                    document.getElementById(
                        "landstackPrintReportBtn"
                    );


                if (downloadBtn) {

                    downloadBtn.addEventListener(
                        "click",
                        downloadVerificationReport
                    );

                }


                if (printBtn) {

                    printBtn.addEventListener(
                        "click",
                        printVerificationReport
                    );

                }


                // ------------------------------------------
                // SATELLITE CHANGE DETECTION DEMO
                // ------------------------------------------

                const satellitePanel =
                    document.createElement(
                        "div"
                    );


                satellitePanel.className =
                    "ls-next-feature-panel";


                const recordedUse =
                    parcel.current_land_use ||
                    parcel.land_use ||
                    "Not available";


                satellitePanel.innerHTML = `

                    <h4
                        class="ls-next-feature-title"
                    >
                        Satellite Change Detection
                        – Prototype
                    </h4>

                    <div
                        class="ls-next-demo-banner"
                    >
                        Prototype demonstration only.
                        This does not connect to live satellite
                        imagery or an ML model yet. It demonstrates
                        the type of land-use comparison LandStack
                        can perform when imagery analysis is connected.
                    </div>

                    <div
                        class="ls-next-status-box"
                    >
                        <strong>
                            Recorded Land Use:
                        </strong>
                        ${escapeHtml(
                            recordedUse
                        )}
                    </div>

                    <div
                        class="ls-next-field"
                    >

                        <label
                            for="lsSatelliteObservedUse"
                        >
                            Prototype Observed Image Use
                        </label>

                        <select
                            id="lsSatelliteObservedUse"
                        >

                            <option value="">
                                Select observed use
                            </option>

                            <option value="Residential">
                                Residential
                            </option>

                            <option value="Agricultural">
                                Agricultural
                            </option>

                            <option value="Commercial">
                                Commercial
                            </option>

                            <option value="Vacant">
                                Vacant
                            </option>

                            <option value="Water">
                                Water
                            </option>

                            <option value="Road / Infrastructure">
                                Road / Infrastructure
                            </option>

                        </select>

                    </div>

                    <div
                        class="ls-next-button-row"
                    >

                        <button
                            type="button"
                            id="lsRunSatelliteDemoBtn"
                        >
                            Analyze Change
                        </button>

                    </div>

                    <div
                        id="lsSatelliteChangeResult"
                        class="ls-next-status-box"
                        style="display:block;"
                    >
                        Select an observed-use value
                        to run the prototype comparison.
                    </div>

                `;


                container.appendChild(
                    satellitePanel
                );


                const satelliteButton =
                    document.getElementById(
                        "lsRunSatelliteDemoBtn"
                    );


                if (satelliteButton) {

                    satelliteButton.addEventListener(
                        "click",
                        runSatelliteChangeDetection
                    );

                }

            };

    }

})();}