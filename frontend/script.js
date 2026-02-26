const BASE_URL = "http://localhost:5000";

/* ============================
   ADMIN FUNCTIONS
============================ */

// Add City
function addCity() {
    const name = document.getElementById("cityName").value;

    fetch(`${BASE_URL}/add-city`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("adminResult").innerText = data.message;
    });
}

// Add Route
function addRoute() {
    const source_id = document.getElementById("routeSource").value;
    const destination_id = document.getElementById("routeDestination").value;
    const distance = document.getElementById("routeDistance").value;

    fetch(`${BASE_URL}/add-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id, destination_id, distance })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("adminResult").innerText = data.message;
    });
}

// Set Traffic
function setTraffic() {
    const level = document.getElementById("trafficLevel").value;

    fetch(`${BASE_URL}/set-traffic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("adminResult").innerText =
            data.message + "\nSpeed: " + data.current_speed;
    });
}

// Manual Dispatch
function dispatchParcel() {
    const tracking = document.getElementById("dispatchId").value;

    fetch(`${BASE_URL}/dispatch/${tracking}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("adminResult").innerText = data.message;
    });
}

// Auto Dispatch
function autoDispatch() {
    fetch(`${BASE_URL}/auto-dispatch`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("dispatchResult").innerText =
            data.message +
            (data.tracking_number ?
                "\nTracking: " + data.tracking_number +
                "\nETA (hrs): " + data.estimated_delivery_hours
                : "");
    });
}

// Load Analytics
function loadAnalytics() {
    fetch(`${BASE_URL}/analytics`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("analyticsBox").innerHTML = `
            <p><strong>Total Parcels:</strong> ${data.total_parcels}</p>
            <p><strong>Pending:</strong> ${data.pending}</p>
            <p><strong>Dispatched:</strong> ${data.dispatched}</p>
            <p><strong>Delivered:</strong> ${data.delivered}</p>
            <p><strong>Average Delivery Time:</strong> ${Number(data.avg_delivery_time || 0).toFixed(2)} hrs</p>
            <p><strong>Highest Priority Score:</strong> ${data.highest_priority}</p>
        `;
    });
}

/* ============================
   USER FUNCTIONS
============================ */

// Load Cities into Dropdown
function loadCities() {
    fetch(`${BASE_URL}/cities`)
    .then(res => res.json())
    .then(data => {
        const source = document.getElementById("sourceSelect");
        const dest = document.getElementById("destSelect");

        if (!source || !dest) return;

        source.innerHTML = "";
        dest.innerHTML = "";

        data.forEach(city => {
            source.innerHTML += `<option value="${city.id}">${city.name}</option>`;
            dest.innerHTML += `<option value="${city.id}">${city.name}</option>`;
        });
    });
}

// Calculate ETA
function calculateETA() {

    const source = document.getElementById("sourceSelect").value;
    const dest = document.getElementById("destSelect").value;

    if (source === dest) {
        alert("Source and Destination cannot be same");
        return;
    }

    fetch(`${BASE_URL}/shortest-path?source=${source}&destination=${dest}`)
    .then(res => res.json())
    .then(data => {

        if (data.shortest_distance) {

            const distance = parseFloat(data.shortest_distance);
            const speed = 80;
            const hours = (distance / speed).toFixed(2);

            document.getElementById("etaResult").innerText =
                "Route: " + data.path +
                "\nDistance: " + data.shortest_distance +
                "\nEstimated Arrival: " + hours + " hours";
        }
        else {
            document.getElementById("etaResult").innerText = data.message;
        }
    });
}

// Create Parcel
function createParcel() {

    const name = document.getElementById("parcelName").value;
    const source_id = document.getElementById("sourceSelect").value;
    const destination_id = document.getElementById("destSelect").value;
    const weight = document.getElementById("weight").value;
    const type = document.getElementById("type").value;

    if (!name || !source_id || !destination_id) {
        alert("Please fill all required fields");
        return;
    }

    if (source_id === destination_id) {
        alert("Source and Destination cannot be same");
        return;
    }

    fetch(`${BASE_URL}/add-parcel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            source_id,
            destination_id,
            weight: weight || 1,
            type: type || "normal"
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.tracking_number) {
            document.getElementById("userResult").innerText =
                "✅ Parcel Created!\n" +
                "Tracking ID: " + data.tracking_number +
                "\nDistance: " + data.distance +
                "\nPriority Score: " + data.priority_score;
        } else {
            document.getElementById("userResult").innerText = data.message;
        }

    });
}

// Track Parcel
function trackParcel() {
    const tracking = document.getElementById("trackId").value;

    fetch(`${BASE_URL}/track-parcel/${tracking}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("userResult").innerText =
            JSON.stringify(data, null, 2);
    });
}

/* ============================
   AUTO LOAD
============================ */

window.onload = function () {
    loadCities();
};