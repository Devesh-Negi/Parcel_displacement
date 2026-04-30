const express = require('express');
const cors = require('cors');
const db = require('./db');
const dijkstra = require('./algorithms/dijkstra');

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   TRAFFIC SYSTEM
================================ */

let trafficLevel = 1;
const MAX_SPEED = 80; // km/h

function getCurrentSpeed() {
    if (trafficLevel === 1) return MAX_SPEED;
    if (trafficLevel === 2) return MAX_SPEED * 0.7;
    if (trafficLevel === 3) return MAX_SPEED * 0.4;
}

function calculatePriorityScore(type = "normal", weight = 1) {
    const typeScores = {
        normal: 1,
        fragile: 2,
        express: 3
    };

    const parcelWeight = Number(weight) || 1;
    return (typeScores[type] || typeScores.normal) * 10 + parcelWeight;
}

function calculateDeliveryCharge(distance, type = "normal", weight = 1) {
    const breakdown = calculateDeliveryChargeBreakdown(distance, type, weight);
    return breakdown.total;
}

function calculateDeliveryChargeBreakdown(distance, type = "normal", weight = 1) {
    const typeCharges = {
        normal: 0,
        fragile: 40,
        express: 80
    };

    const baseCharge = 50;
    const distanceCharge = Number(distance) * 2;
    const weightCharge = (Number(weight) || 1) * 10;
    const typeCharge = typeCharges[type] || 0;

    return {
        base_charge: baseCharge,
        distance_charge: distanceCharge,
        weight_charge: weightCharge,
        type_charge: typeCharge,
        total: baseCharge + distanceCharge + weightCharge + typeCharge
    };
}
// ==========================
// ADMIN AUTH SYSTEM
// ==========================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "12345";

let adminLoggedIn = false;

/* ===============================
   BASIC TEST
================================ */

app.get('/', (req, res) => {
    res.send("Parcel Delivery Backend Running 🚀");
});

/* ===============================
   CITY APIs
================================ */

// Add City
app.post('/add-city', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "City name required" });
    }

    db.query("INSERT INTO cities (name) VALUES (?)",
        [name],
        (err) => {
            if (err) return res.status(500).json({ message: "City exists or DB error" });
            res.json({ message: "City added successfully ✅" });
        }
    );
});

// Get Cities
app.get('/cities', (req, res) => {
    db.query("SELECT * FROM cities", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

/* ===============================
   ROUTE APIs
================================ */

// Add Route
app.post('/add-route', (req, res) => {
    const { source_id, destination_id, distance } = req.body;
    const routeDistance = Number(distance);

    if (!source_id || !destination_id || !routeDistance || routeDistance <= 0) {
        return res.status(400).json({ message: "Source, destination, and distance are required" });
    }

    if (source_id === destination_id) {
        return res.status(400).json({ message: "Source and destination cannot be same" });
    }

    db.query(
        `SELECT id FROM routes
         WHERE (source_id = ? AND destination_id = ?)
            OR (source_id = ? AND destination_id = ?)
         LIMIT 1`,
        [source_id, destination_id, destination_id, source_id],
        (err, existingRoutes) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (existingRoutes.length > 0) {
                return res.json({ message: "Route already exists" });
            }

            db.query(
                "INSERT INTO routes (source_id, destination_id, distance) VALUES (?, ?, ?)",
                [source_id, destination_id, routeDistance],
                (err) => {
                    if (err) return res.status(500).json({ message: "Route exists or DB error" });
                    res.json({ message: "Route added successfully" });
                }
            );
        }
    );
});



// Get Routes
app.get('/routes', (req, res) => {
    const sql = `
        SELECT MIN(r.id) AS id, c1.name AS source, c2.name AS destination, r.distance
        FROM routes r
        JOIN cities c1 ON r.source_id = c1.id
        JOIN cities c2 ON r.destination_id = c2.id
        GROUP BY r.source_id, r.destination_id, r.distance, c1.name, c2.name
        ORDER BY source, destination
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// Add sample cities and routes for quick demo
app.post('/seed-demo', (req, res) => {
    const cityNames = ["Delhi", "Dehradun", "Haridwar", "Rishikesh", "Chandigarh"];
    const routeData = [
        ["Delhi", "Dehradun", 248],
        ["Delhi", "Chandigarh", 243],
        ["Dehradun", "Haridwar", 53],
        ["Haridwar", "Rishikesh", 21],
        ["Dehradun", "Rishikesh", 45],
        ["Chandigarh", "Dehradun", 175]
    ];

    db.query(
        "INSERT IGNORE INTO cities (name) VALUES ?",
        [cityNames.map(name => [name])],
        (err) => {
            if (err) return res.status(500).json({ message: "Could not add sample cities" });

            db.query("SELECT id, name FROM cities WHERE name IN (?)", [cityNames], (err, cities) => {
                if (err) return res.status(500).json({ message: "Could not read sample cities" });

                const cityMap = {};
                cities.forEach(city => {
                    cityMap[city.name] = city.id;
                });

                let completed = 0;

                routeData.forEach(route => {
                    const sourceId = cityMap[route[0]];
                    const destinationId = cityMap[route[1]];
                    const distance = route[2];

                    db.query(
                        `INSERT INTO routes (source_id, destination_id, distance)
                         SELECT ?, ?, ?
                         WHERE NOT EXISTS (
                            SELECT 1 FROM routes
                            WHERE (source_id = ? AND destination_id = ?)
                               OR (source_id = ? AND destination_id = ?)
                         )`,
                        [sourceId, destinationId, distance, sourceId, destinationId, destinationId, sourceId],
                        (err) => {
                            if (err) return res.status(500).json({ message: "Could not add sample routes" });

                            completed++;
                            if (completed === routeData.length) {
                                res.json({ message: "Sample cities and routes are ready" });
                            }
                        }
                    );
                });
            });
        }
    );
});

// Remove duplicate route rows and keep the first route
app.post('/cleanup-routes', (req, res) => {
    const sql = `
        DELETE r1 FROM routes r1
        JOIN routes r2
          ON r1.id > r2.id
         AND r1.distance = r2.distance
         AND (
              (r1.source_id = r2.source_id AND r1.destination_id = r2.destination_id)
           OR (r1.source_id = r2.destination_id AND r1.destination_id = r2.source_id)
         )
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: "Could not clean duplicate routes" });
        res.json({ message: `Duplicate route cleanup complete. Removed ${result.affectedRows} duplicate route(s).` });
    });
});

/* ===============================
   SHORTEST PATH
================================ */

app.get('/shortest-path', (req, res) => {
    const { source, destination } = req.query;

    if (!source || !destination) {
        return res.status(400).json({ message: "Source and destination required" });
    }

    db.query("SELECT * FROM cities", (err, cities) => {
        if (err) return res.status(500).json({ message: "Database error" });

        db.query("SELECT * FROM routes", (err, routes) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const result = dijkstra(
    cities,
    routes,
    parseInt(source),
    parseInt(destination)
);

if (result === null) {
    return res.json({ message: "No route found ❌" });
}

// Convert IDs to city names
const cityMap = {};
cities.forEach(city => {
    cityMap[city.id] = city.name;
});

const pathNames = result.path.map(id => cityMap[id]);

res.json({
    shortest_distance: result.distance + " km",
    path: pathNames.join(" -> "),
    current_speed: getCurrentSpeed()
});
        });
    });
});

/* ===============================
   PARCEL APIs
================================ */

function generateTrackingNumber() {
    return "TRK" + Math.floor(1000 + Math.random() * 9000);
}

// Add Parcel
app.post('/add-parcel', (req, res) => {
    const { name, source_id, destination_id, weight, type } = req.body;

    if (!name || !source_id || !destination_id) {
        return res.status(400).json({ message: "All fields required" });
    }

    db.query("SELECT * FROM cities", (err, cities) => {
    if (err) return res.status(500).json({ message: "Cities error" });

    db.query("SELECT * FROM routes", (err, routes) => {
        if (err) return res.status(500).json({ message: "Routes error" });

        if (!cities || !routes) {
            return res.status(500).json({ message: "Data missing" });
        }

        const result = dijkstra(cities, routes, source_id, destination_id);

        if (!result) {
            return res.json({ message: "No route found ❌" });
        }

        // continue insert logic here...

            const resultForInsert = dijkstra(
                cities,
                routes,
                parseInt(source_id),
                parseInt(destination_id)
            );

            if (resultForInsert === null) {
                return res.json({ message: "No route found ❌" });
            }

            const distance = resultForInsert.distance;
            const trackingNumber = generateTrackingNumber();
            const priorityScore = calculatePriorityScore(type, weight);
            const chargeBreakdown = calculateDeliveryChargeBreakdown(distance, type, weight);

            const sql = `
                INSERT INTO parcels
                (name, tracking_number, status, source_id, destination_id, distance, priority_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [name, trackingNumber, "pending", source_id, destination_id, distance, priorityScore],
                (err) => {
                    if (err) return res.status(500).json({ message: "Insert failed" });

                    res.json({
                        message: "Parcel created successfully ✅",
                        tracking_number: trackingNumber,
                        distance: distance + " km",
                        priority_score: priorityScore,
                        delivery_charge: chargeBreakdown.total,
                        charge_breakdown: chargeBreakdown
                    });
                }
            );
        });
    });
});

// Track Parcel
app.get('/track-parcel/:trackingNumber', (req, res) => {
    const trackingNumber = req.params.trackingNumber;

    const sql = `
        SELECT p.*, 
               c1.name AS source_name,
               c2.name AS destination_name
        FROM parcels p
        JOIN cities c1 ON p.source_id = c1.id
        JOIN cities c2 ON p.destination_id = c2.id
        WHERE p.tracking_number = ?
    `;

    db.query(sql, [trackingNumber], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.json({ message: "Tracking number not found ❌" });
        }

        res.json(results[0]);
    });
});

/* ===============================
   TRAFFIC API
================================ */

app.post('/set-traffic', (req, res) => {
    const level = parseInt(req.body.level);

    if (!Number.isInteger(level) || level < 1 || level > 3) {
        return res.json({ message: "Traffic level must be 1, 2, or 3" });
    }

    trafficLevel = level;

    res.json({
        message: "Traffic level updated 🚦",
        current_speed: getCurrentSpeed() + " km/h"
    });
});

/* ===============================
   DISPATCH API
================================ */

app.post('/dispatch/:trackingNumber', (req, res) => {
    const trackingNumber = req.params.trackingNumber;

    db.query(
        "SELECT * FROM parcels WHERE tracking_number = ?",
        [trackingNumber],
        (err, results) => {

            if (results.length === 0) {
                return res.json({ message: "Tracking number not found ❌" });
            }

            const parcel = results[0];
            const speed = getCurrentSpeed();
            const deliveryTime = parcel.distance / speed;
            const dispatchTime = new Date();

            db.query(
                `UPDATE parcels 
                 SET status=?, dispatch_time=?, delivery_time=? 
                 WHERE tracking_number=?`,
                ["dispatched", dispatchTime, deliveryTime, trackingNumber],
                (err) => {
                    if (err) return res.status(500).json({ message: "Database error" });

                    res.json({
                        message: "Parcel dispatched 🚚",
                        traffic_level: trafficLevel,
                        speed: speed + " km/h",
                        estimated_delivery_time: deliveryTime.toFixed(2) + " hours"
                    });
                }
            );
        }
    );
});


// =====================================
// AUTO DISPATCH HIGHEST PRIORITY PARCEL
// =====================================

app.post("/auto-dispatch", (req, res) => {

    const sql = `
        SELECT * FROM parcels
        WHERE status = 'pending'
        ORDER BY priority_score DESC
        LIMIT 1
    `;

    db.query(sql, (err, results) => {

        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.json({ message: "No pending parcels available" });
        }

        const parcel = results[0];

        const speed = getCurrentSpeed();
        const delivery_time = parcel.distance / speed;

        const updateSql = `
            UPDATE parcels
            SET status = 'dispatched',
                dispatch_time = NOW(),
                delivery_time = ?
            WHERE id = ?
        `;

        db.query(updateSql, [delivery_time, parcel.id], (err) => {
            if (err) return res.status(500).json({ message: "Update failed" });

            res.json({
                message: "🚚 Parcel Auto Dispatched!",
                tracking_number: parcel.tracking_number,
                estimated_delivery_hours: delivery_time.toFixed(2)
            });
        });
    });
});
// ==========================
// GET ALL PARCELS
// ==========================

app.get("/parcels", (req, res) => {

    const sql = "SELECT * FROM parcels";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        res.json(results);
    });

});

// =====================================
// AUTO UPDATE DELIVERY STATUS
// =====================================

app.get("/update-deliveries", (req, res) => {

    const sql = `
        SELECT * FROM parcels
        WHERE status = 'dispatched'
    `;

    db.query(sql, (err, parcels) => {

        if (err) return res.status(500).json({ message: "Database error" });

        let updated = 0;

        parcels.forEach(parcel => {

            const dispatchTime = new Date(parcel.dispatch_time);
            const now = new Date();

            const hoursPassed = (now - dispatchTime) / (1000 * 60 * 60);

            if (hoursPassed >= parcel.delivery_time) {

                db.query(
                    "UPDATE parcels SET status = 'delivered' WHERE id = ?",
                    [parcel.id]
                );

                updated++;
            }

        });

        res.json({
            message: "Delivery status checked",
            parcels_updated: updated
        });

    });

});
// =====================================
// ADMIN ANALYTICS DASHBOARD
// =====================================

app.get("/analytics", (req, res) => {

    const sql = `
        SELECT 
            COUNT(*) AS total_parcels,
            SUM(status = 'pending') AS pending,
            SUM(status = 'dispatched') AS dispatched,
            SUM(status = 'delivered') AS delivered,
            AVG(delivery_time) AS avg_delivery_time,
            MAX(priority_score) AS highest_priority
        FROM parcels
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json(results[0]);
    });

});
// ==========================
// ADMIN LOGIN
// ==========================

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        return res.json({ message: "Login successful ✅" });
    }

    res.status(401).json({ message: "Invalid credentials ❌" });
});

/* ===============================
   ADMIN AUTH SYSTEM
================================ */

const DMIN_USERNAME = "admin";
const DMIN_PASSWORD = "12345";

let dminLoggedIn = false;

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing credentials" });
    }

    if (username === DMIN_USERNAME && password === DMIN_PASSWORD) {
        dminLoggedIn = true;
        return res.json({ message: "Login successful ✅" });
    }

    res.status(401).json({ message: "Invalid credentials ❌" });
});





/* ===============================
   START SERVER
================================ */

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

// Update parcel status manually
app.post('/update-status/:trackingNumber', (req, res) => {
    const trackingNumber = req.params.trackingNumber;
    const { status } = req.body;
    const allowedStatuses = ["pending", "dispatched", "delivered"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid parcel status" });
    }

    db.query(
        "SELECT * FROM parcels WHERE tracking_number = ?",
        [trackingNumber],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (results.length === 0) {
                return res.json({ message: "Tracking number not found" });
            }

            const parcel = results[0];
            const speed = getCurrentSpeed();
            const deliveryTime = parcel.distance / speed;

            let sql = "UPDATE parcels SET status = ? WHERE tracking_number = ?";
            let values = [status, trackingNumber];

            if (status === "dispatched") {
                sql = "UPDATE parcels SET status = ?, dispatch_time = NOW(), delivery_time = ? WHERE tracking_number = ?";
                values = [status, deliveryTime, trackingNumber];
            }

            if (status === "delivered") {
                sql = "UPDATE parcels SET status = ?, delivery_time = COALESCE(delivery_time, ?) WHERE tracking_number = ?";
                values = [status, deliveryTime, trackingNumber];
            }

            db.query(sql, values, (err) => {
                if (err) return res.status(500).json({ message: "Could not update parcel status" });
                res.json({ message: `Parcel status updated to ${status}` });
            });
        }
    );
});
