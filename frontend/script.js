const BASE_URL = "http://localhost:5000";

function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = message;
    }
}

function showHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    }
}

function apiRequest(url, options = {}) {
    return fetch(url, options).then(async (res) => {
        const data = await res.json().catch(() => ({
            message: "Invalid server response"
        }));

        if (!res.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    });
}

/* ============================
   ADMIN FUNCTIONS
============================ */

function addCity() {
    const name = document.getElementById("cityName").value.trim();

    apiRequest(`${BASE_URL}/add-city`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    })
    .then(data => {
        showMessage("adminResult", data.message);
        loadRouteCities();
    })
    .catch(err => showMessage("adminResult", err.message));
}

function addRoute() {
    const source_id = document.getElementById("routeSourceSelect").value;
    const destination_id = document.getElementById("routeDestinationSelect").value;
    const distance = document.getElementById("routeDistance").value;

    apiRequest(`${BASE_URL}/add-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id, destination_id, distance })
    })
    .then(data => showMessage("adminResult", data.message))
    .catch(err => showMessage("adminResult", err.message));
}

function setTraffic() {
    const level = document.getElementById("trafficLevel").value;

    apiRequest(`${BASE_URL}/set-traffic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level })
    })
    .then(data => {
        showMessage("adminResult", data.message + "\nSpeed: " + data.current_speed);
    })
    .catch(err => showMessage("adminResult", err.message));
}

function dispatchParcel() {
    const tracking = document.getElementById("dispatchId").value.trim();

    apiRequest(`${BASE_URL}/dispatch/${tracking}`, {
        method: "POST"
    })
    .then(data => showMessage("adminResult", data.message))
    .catch(err => showMessage("adminResult", err.message));
}

function updateParcelStatus() {
    const tracking = document.getElementById("statusTrackingId").value.trim();
    const status = document.getElementById("parcelStatus").value;

    if (!tracking) {
        showMessage("adminResult", "Please enter a tracking number");
        return;
    }

    apiRequest(`${BASE_URL}/update-status/${tracking}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    })
    .then(data => {
        showMessage("adminResult", data.message);
        loadAdminParcels();
        updateAdminSummary();
    })
    .catch(err => showMessage("adminResult", err.message));
}

function autoDispatch() {
    apiRequest(`${BASE_URL}/auto-dispatch`, {
        method: "POST"
    })
    .then(data => {
        showMessage(
            "dispatchResult",
            data.message +
                (data.tracking_number
                    ? "\nTracking: " + data.tracking_number +
                      "\nETA (hrs): " + data.estimated_delivery_hours
                    : "")
        );
    })
    .catch(err => showMessage("dispatchResult", err.message));
}

function seedDemoData() {
    apiRequest(`${BASE_URL}/seed-demo`, {
        method: "POST"
    })
    .then(data => {
        showMessage("adminResult", data.message);
        loadRouteCities();
        loadAdminRoutes();
        updateAdminSummary();
    })
    .catch(err => showMessage("adminResult", err.message));
}

function cleanupRoutes() {
    apiRequest(`${BASE_URL}/cleanup-routes`, {
        method: "POST"
    })
    .then(data => {
        showMessage("adminResult", data.message);
        loadAdminRoutes();
        updateAdminSummary();
    })
    .catch(err => showMessage("adminResult", err.message));
}

function loadAnalytics() {
    apiRequest(`${BASE_URL}/analytics`)
    .then(data => {
        document.getElementById("analyticsBox").innerHTML = `
            <p><strong>Total Parcels:</strong> ${data.total_parcels || 0}</p>
            <p><strong>Pending:</strong> ${data.pending || 0}</p>
            <p><strong>Dispatched:</strong> ${data.dispatched || 0}</p>
            <p><strong>Delivered:</strong> ${data.delivered || 0}</p>
            <p><strong>Average Delivery Time:</strong> ${Number(data.avg_delivery_time || 0).toFixed(2)} hrs</p>
            <p><strong>Highest Priority Score:</strong> ${data.highest_priority || 0}</p>
        `;
    })
    .catch(err => showMessage("analyticsBox", err.message));
}

function renderTable(elementId, columns, rows) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!rows.length) {
        element.innerHTML = "<p>No records found.</p>";
        return;
    }

    const headers = columns.map(column => `<th>${column.label}</th>`).join("");
    const body = rows.map(row => {
        const cells = columns.map(column => {
            const value = row[column.key] ?? "";
            return `<td>${column.render ? column.render(value, row) : value}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
    }).join("");

    element.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    `;
}

function updateAdminSummary() {
    const cityCount = document.getElementById("cityCount");
    const routeCount = document.getElementById("routeCount");
    const parcelCount = document.getElementById("parcelCount");

    if (!cityCount || !routeCount || !parcelCount) return;

    apiRequest(`${BASE_URL}/cities`)
    .then(data => {
        cityCount.innerText = data.length;
    })
    .catch(() => {
        cityCount.innerText = "0";
    });

    apiRequest(`${BASE_URL}/routes`)
    .then(data => {
        routeCount.innerText = data.length;
    })
    .catch(() => {
        routeCount.innerText = "0";
    });

    apiRequest(`${BASE_URL}/parcels`)
    .then(data => {
        parcelCount.innerText = data.length;
    })
    .catch(() => {
        parcelCount.innerText = "0";
    });
}

function loadAdminCities() {
    apiRequest(`${BASE_URL}/cities`)
    .then(data => {
        renderTable("adminTableBox", [
            { key: "id", label: "ID" },
            { key: "name", label: "City Name" }
        ], data);
    })
    .catch(err => showMessage("adminTableBox", err.message));
}

function loadAdminRoutes() {
    apiRequest(`${BASE_URL}/routes`)
    .then(data => {
        renderTable("adminTableBox", [
            { key: "id", label: "ID" },
            { key: "source", label: "Source" },
            { key: "destination", label: "Destination" },
            { key: "distance", label: "Distance (km)" }
        ], data);
    })
    .catch(err => showMessage("adminTableBox", err.message));
}

function loadAdminParcels() {
    apiRequest(`${BASE_URL}/parcels`)
    .then(data => {
        renderTable("adminTableBox", [
            { key: "tracking_number", label: "Tracking ID" },
            { key: "name", label: "Parcel" },
            { key: "status", label: "Status", render: value => `<span class="status-badge status-${value}">${value}</span>` },
            { key: "distance", label: "Distance" },
            { key: "priority_score", label: "Priority" }
        ], data);
    })
    .catch(err => showMessage("adminTableBox", err.message));
}

/* ============================
   USER FUNCTIONS
============================ */

function loadCities() {
    apiRequest(`${BASE_URL}/cities`)
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
    })
    .catch(err => showMessage("userResult", err.message));
}

function calculateETA() {
    const source = document.getElementById("sourceSelect").value;
    const dest = document.getElementById("destSelect").value;

    if (source === dest) {
        alert("Source and Destination cannot be same");
        return;
    }

    apiRequest(`${BASE_URL}/shortest-path?source=${source}&destination=${dest}`)
    .then(data => {
        if (data.shortest_distance) {
            const distance = parseFloat(data.shortest_distance);
            const speed = Number(data.current_speed || 80);
            const hours = (distance / speed).toFixed(2);
            const weight = Number(document.getElementById("weight").value || 1);
            const type = document.getElementById("type").value;
            const chargeBreakdown = calculateDeliveryChargeBreakdown(distance, type, weight);

            showMessage(
                "etaResult",
                "Route: " + data.path +
                    "\nDistance: " + data.shortest_distance +
                    "\nEstimated Arrival: " + hours + " hours" +
                    "\n\n" + formatChargeBreakdown(chargeBreakdown)
            );
        } else {
            showMessage("etaResult", data.message);
        }
    })
    .catch(err => showMessage("etaResult", err.message));
}

function calculateDeliveryCharge(distance, type = "normal", weight = 1) {
    return calculateDeliveryChargeBreakdown(distance, type, weight).total;
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

function formatChargeBreakdown(breakdown) {
    return "Charge Breakdown:" +
        "\nBase Charge: Rs. " + breakdown.base_charge +
        "\nDistance Charge: Rs. " + breakdown.distance_charge +
        "\nWeight Charge: Rs. " + breakdown.weight_charge +
        "\nType Charge: Rs. " + breakdown.type_charge +
        "\nTotal Charge: Rs. " + breakdown.total;
}

function createParcel() {
    const name = document.getElementById("parcelName").value.trim();
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

    apiRequest(`${BASE_URL}/add-parcel`, {
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
    .then(data => {
        if (data.tracking_number) {
            showMessage(
                "userResult",
                "Parcel Created!\n" +
                    "Tracking ID: " + data.tracking_number +
                    "\nDistance: " + data.distance +
                    "\nPriority Score: " + data.priority_score +
                    "\n\n" + formatChargeBreakdown(data.charge_breakdown || {
                        base_charge: 0,
                        distance_charge: 0,
                        weight_charge: 0,
                        type_charge: 0,
                        total: data.delivery_charge || 0
                    })
            );
        } else {
            showMessage("userResult", data.message);
        }
    })
    .catch(err => showMessage("userResult", err.message));
}

function trackParcel() {
    const tracking = document.getElementById("trackId").value.trim();

    apiRequest(`${BASE_URL}/track-parcel/${tracking}`)
    .then(data => {
        const steps = ["pending", "dispatched", "delivered"];
        const currentStep = steps.indexOf(data.status);
        const timeline = steps.map((step, index) => `
            <div class="timeline-step ${index <= currentStep ? "active" : ""}">
                <span>${index + 1}</span>
                <p>${step}</p>
            </div>
        `).join("");

        showHTML(
            "userResult",
            `
                <strong>Tracking ID:</strong> ${data.tracking_number}<br>
                <strong>Parcel:</strong> ${data.name}<br>
                <strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status}</span><br>
                <strong>From:</strong> ${data.source_name}<br>
                <strong>To:</strong> ${data.destination_name}<br>
                <strong>Distance:</strong> ${data.distance} km<br>
                <strong>Priority Score:</strong> ${data.priority_score || 0}
                <div class="timeline">${timeline}</div>
            `
        );
    })
    .catch(err => showMessage("userResult", err.message));
}

function loadUserRoutes() {
    apiRequest(`${BASE_URL}/routes`)
    .then(data => {
        renderTable("routeListBox", [
            { key: "source", label: "Source" },
            { key: "destination", label: "Destination" },
            { key: "distance", label: "Distance (km)" }
        ], data);
    })
    .catch(err => showMessage("routeListBox", err.message));
}

function loadRouteGraph() {
    apiRequest(`${BASE_URL}/routes`)
    .then(routes => {
        renderRouteGraph(routes);
    })
    .catch(err => showMessage("routeGraphBox", err.message));
}

function renderRouteGraph(routes) {
    const element = document.getElementById("routeGraphBox");
    if (!element) return;

    if (!routes.length) {
        element.innerHTML = "<p>No routes available for graph.</p>";
        return;
    }

    const cityNames = [...new Set(routes.flatMap(route => [route.source, route.destination]))];
    const width = 760;
    const height = 380;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 145;
    const positions = {};

    cityNames.forEach((city, index) => {
        const angle = (Math.PI * 2 * index) / cityNames.length - Math.PI / 2;
        positions[city] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    const lines = routes.map(route => {
        const source = positions[route.source];
        const destination = positions[route.destination];
        const labelX = (source.x + destination.x) / 2;
        const labelY = (source.y + destination.y) / 2;

        return `
            <line x1="${source.x}" y1="${source.y}" x2="${destination.x}" y2="${destination.y}" />
            <text class="edge-label" x="${labelX}" y="${labelY}">${route.distance} km</text>
        `;
    }).join("");

    const nodes = cityNames.map(city => {
        const position = positions[city];
        return `
            <g class="graph-node">
                <circle cx="${position.x}" cy="${position.y}" r="24"></circle>
                <text x="${position.x}" y="${position.y + 44}">${city}</text>
            </g>
        `;
    }).join("");

    element.innerHTML = `
        <div class="route-graph">
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Route graph">
                ${lines}
                ${nodes}
            </svg>
        </div>
    `;
}

function loadRouteCities() {
    apiRequest(`${BASE_URL}/cities`)
    .then(data => {
        const source = document.getElementById("routeSourceSelect");
        const dest = document.getElementById("routeDestinationSelect");

        if (!source || !dest) return;

        source.innerHTML = "";
        dest.innerHTML = "";

        data.forEach(city => {
            source.innerHTML += `<option value="${city.id}">${city.name}</option>`;
            dest.innerHTML += `<option value="${city.id}">${city.name}</option>`;
        });
    })
    .catch(err => showMessage("adminResult", err.message));
}

window.addEventListener("load", loadCities);
window.addEventListener("load", loadRouteCities);
window.addEventListener("load", updateAdminSummary);

function logout() {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "admin-login.html";
}
