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



// Get Routes
app.get('/routes', (req, res) => {
    const sql = `
        SELECT r.id, c1.name AS source, c2.name AS destination, r.distance
        FROM routes r
        JOIN cities c1 ON r.source_id = c1.id
        JOIN cities c2 ON r.destination_id = c2.id
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
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
    path: pathNames.join(" → ")
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
    const { name, source_id, destination_id } = req.body;

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

            const distance = dijkstra(
                cities,
                routes,
                parseInt(source_id),
                parseInt(destination_id)
            );

            if (distance === null) {
                return res.json({ message: "No route found ❌" });
            }

            const trackingNumber = generateTrackingNumber();

            const sql = `
                INSERT INTO parcels
                (name, tracking_number, status, source_id, destination_id, distance)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [name, trackingNumber, "pending", source_id, destination_id, distance],
                (err) => {
                    if (err) return res.status(500).json({ message: "Insert failed" });

                    res.json({
                        message: "Parcel created successfully ✅",
                        tracking_number: trackingNumber,
                        distance: distance + " km"
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
    const { level } = req.body;

    if (level < 1 || level > 3) {
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

        const speed = 60; // you can later connect traffic level
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