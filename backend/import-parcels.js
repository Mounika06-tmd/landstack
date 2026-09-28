const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

// ============================================
// CONNECT TO NEON POSTGRESQL
// ============================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});


// ============================================
// IMPORT PARCELS
// ============================================

async function importParcels() {
    const client = await pool.connect();

    try {

        // GeoJSON file is inside the backend folder
        const filePath = path.join(
            __dirname,
            "land_parcels_229.geojson"
        );

        console.log("======================================");
        console.log("LANDSTACK PARCEL IMPORT");
        console.log("======================================");

        console.log("Reading GeoJSON file...");

        // Check whether file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `GeoJSON file not found: ${filePath}`
            );
        }

        const geojson = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        if (
            !geojson.features ||
            !Array.isArray(geojson.features)
        ) {
            throw new Error(
                "Invalid GeoJSON file: features array not found."
            );
        }

        console.log(
            `Found ${geojson.features.length} parcel features.`
        );

        // ============================================
        // START TRANSACTION
        // ============================================

        await client.query("BEGIN");

        for (
            let i = 0;
            i < geojson.features.length;
            i++
        ) {

            const feature = geojson.features[i];

            const properties =
                feature.properties || {};

            const geometry =
                feature.geometry;

            // ============================================
            // CHECK GEOMETRY
            // ============================================

            if (!geometry) {

                console.log(
                    `Skipping feature ${i + 1}: geometry is missing`
                );

                continue;
            }

            // ============================================
            // CREATE UNIQUE LANDSTACK PARCEL ID
            // ============================================

            const featureNumber = i + 1;

            const parcelId =
                `GIS-${String(featureNumber).padStart(4, "0")}`;

            // ============================================
            // ORIGINAL GIS ID
            // ============================================

            const gisId =
                properties.Id !== undefined
                    ? properties.Id
                    : null;

            // ============================================
            // ORIGINAL LP NUMBER
            // ============================================

            const lpNumber =
                properties.Lp_number !== undefined
                    ? properties.Lp_number
                    : null;

            // ============================================
            // SURVEY NUMBER
            // ============================================

            const surveyNumber =
                lpNumber !== null &&
                lpNumber !== 0
                    ? String(lpNumber)
                    : parcelId;

            // ============================================
            // INSERT LAND PARCEL
            // ============================================

            const parcelResult =
                await client.query(
                    `
                    INSERT INTO land_parcels
                    (
                        parcel_id,
                        survey_number,
                        village,
                        district,
                        gis_id,
                        lp_number
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
                    RETURNING id
                    `,
                    [
                        parcelId,
                        surveyNumber,
                        "Demo Village",
                        "Demo District",
                        gisId,
                        lpNumber
                    ]
                );

            const databaseParcelId =
                parcelResult.rows[0].id;

            // ============================================
            // INSERT GEOMETRY
            // ============================================

            await client.query(
                `
                INSERT INTO parcel_geometry
                (
                    parcel_id,
                    geom
                )
                VALUES
                (
                    $1,
                    ST_Multi(
                        ST_SetSRID(
                            ST_GeomFromGeoJSON($2),
                            4326
                        )
                    )
                )
                `,
                [
                    databaseParcelId,
                    JSON.stringify(geometry)
                ]
            );

            // ============================================
            // PROGRESS
            // ============================================

            console.log(
                `Imported ${featureNumber}/${geojson.features.length} | ` +
                `Parcel: ${parcelId} | ` +
                `Source Id: ${gisId} | ` +
                `LP: ${lpNumber}`
            );
        }

        // ============================================
        // COMMIT
        // ============================================

        await client.query("COMMIT");

        console.log("");
        console.log("======================================");
        console.log("SUCCESS");
        console.log(
            `Imported ${geojson.features.length} parcel features.`
        );
        console.log("======================================");

    } catch (error) {

        console.error("");
        console.error("======================================");
        console.error("IMPORT ERROR");
        console.error("======================================");

        console.error(error.message);

        // ============================================
        // ROLLBACK
        // ============================================

        try {

            await client.query("ROLLBACK");

            console.log(
                "Transaction rolled back."
            );

        } catch (rollbackError) {

            console.error(
                "Rollback error:",
                rollbackError.message
            );
        }

    } finally {

        client.release();

        await pool.end();
    }
}


// ============================================
// RUN IMPORT
// ============================================

importParcels();