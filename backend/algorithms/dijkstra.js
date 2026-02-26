function dijkstra(cities, routes, sourceId, destinationId) {
    const distances = {};
    const visited = {};
    const parent = {};
    const adjacencyList = {};

    // Initialize
    cities.forEach(city => {
        distances[city.id] = Infinity;
        visited[city.id] = false;
        parent[city.id] = null;
        adjacencyList[city.id] = [];
    });

    // Build graph
    routes.forEach(route => {
        adjacencyList[route.source_id].push({
            node: route.destination_id,
            distance: route.distance
        });

        adjacencyList[route.destination_id].push({
            node: route.source_id,
            distance: route.distance
        });
    });

    distances[sourceId] = 0;

    for (let i = 0; i < cities.length - 1; i++) {
        let minNode = null;
        let minDistance = Infinity;

        for (let cityId in distances) {
            if (!visited[cityId] && distances[cityId] < minDistance) {
                minDistance = distances[cityId];
                minNode = cityId;
            }
        }

        if (minNode === null) break;

        visited[minNode] = true;

        adjacencyList[minNode].forEach(neighbor => {
            if (!visited[neighbor.node] &&
                distances[minNode] + neighbor.distance < distances[neighbor.node]) {

                distances[neighbor.node] =
                    distances[minNode] + neighbor.distance;

                parent[neighbor.node] = parseInt(minNode);
            }
        });
    }

    if (distances[destinationId] === Infinity) {
        return null;
    }

    // Reconstruct path
    const path = [];
    let current = destinationId;

    while (current !== null) {
        path.unshift(current);
        current = parent[current];
    }

    return {
        distance: distances[destinationId],
        path: path
    };
}

module.exports = dijkstra;