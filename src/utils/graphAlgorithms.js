export function calculatePrim(nodes, edges) {
    if (nodes.length === 0) {
        return {
            mstEdges: [],
            totalWeight: null,
            error: 'Agrega nodos antes de calcular el arbol.'
        };
    }

    if (nodes.length === 1) {
        return {
            mstEdges: [],
            totalWeight: 0,
            message: 'El arbol de un solo nodo tiene peso total 0.'
        };
    }

    const visited = new Set([nodes[0].id]);
    const selectedEdges = [];

    while (visited.size < nodes.length) {
        const candidateEdges = edges
            .filter((edge) => {
                const fromVisited = visited.has(edge.from);
                const toVisited = visited.has(edge.to);
                return fromVisited !== toVisited;
            })
            .sort((firstEdge, secondEdge) => firstEdge.weight - secondEdge.weight);

        if (candidateEdges.length === 0) {
            return {
                mstEdges: [],
                totalWeight: null,
                error: 'No se puede calcular: el grafo no esta conectado.'
            };
        }

        const nextEdge = candidateEdges[0];
        selectedEdges.push(nextEdge);
        visited.add(visited.has(nextEdge.from) ? nextEdge.to : nextEdge.from);
    }

    const totalWeight = selectedEdges.reduce((sum, edge) => sum + edge.weight, 0);

    return {
        mstEdges: selectedEdges,
        totalWeight,
        message: `Arbol de expansion minima calculado con Prim. Peso total: ${totalWeight}.`
    };
}

export function calculateDijkstra(nodes, edges, sourceNodeId, targetNodeId) {
    if (nodes.length === 0) {
        return {
            pathEdges: [],
            totalWeight: null,
            error: 'Agrega nodos antes de calcular la ruta mas corta.'
        };
    }

    if (!sourceNodeId || !targetNodeId) {
        return {
            pathEdges: [],
            totalWeight: null,
            error: 'Selecciona un nodo origen y un nodo destino.'
        };
    }

    if (sourceNodeId === targetNodeId) {
        return {
            pathEdges: [],
            totalWeight: 0,
            message: 'El origen y destino son el mismo nodo. Distancia total: 0.'
        };
    }

    const distances = new Map(nodes.map((node) => [node.id, Infinity]));
    const previousNode = new Map();
    const previousEdge = new Map();
    const unvisited = new Set(nodes.map((node) => node.id));

    distances.set(sourceNodeId, 0);

    while (unvisited.size > 0) {
        const currentNodeId = [...unvisited].sort((firstNodeId, secondNodeId) => (
            distances.get(firstNodeId) - distances.get(secondNodeId)
        ))[0];

        if (distances.get(currentNodeId) === Infinity) {
            break;
        }

        if (currentNodeId === targetNodeId) {
            break;
        }

        unvisited.delete(currentNodeId);

        const connectedEdges = edges.filter((edge) => (
            edge.from === currentNodeId || edge.to === currentNodeId
        ));

        connectedEdges.forEach((edge) => {
            const neighborNodeId = edge.from === currentNodeId ? edge.to : edge.from;

            if (!unvisited.has(neighborNodeId)) {
                return;
            }

            const nextDistance = distances.get(currentNodeId) + edge.weight;

            if (nextDistance < distances.get(neighborNodeId)) {
                distances.set(neighborNodeId, nextDistance);
                previousNode.set(neighborNodeId, currentNodeId);
                previousEdge.set(neighborNodeId, edge);
            }
        });
    }

    if (distances.get(targetNodeId) === Infinity) {
        return {
            pathEdges: [],
            totalWeight: null,
            error: 'No existe una ruta entre el nodo origen y el nodo destino.'
        };
    }

    const pathEdges = [];
    let currentNodeId = targetNodeId;

    while (currentNodeId !== sourceNodeId) {
        const edge = previousEdge.get(currentNodeId);

        if (!edge) {
            return {
                pathEdges: [],
                totalWeight: null,
                error: 'No existe una ruta entre el nodo origen y el nodo destino.'
            };
        }

        pathEdges.unshift(edge);
        currentNodeId = previousNode.get(currentNodeId);
    }

    const totalWeight = distances.get(targetNodeId);

    return {
        pathEdges,
        totalWeight,
        message: `Ruta mas corta calculada con Dijkstra. Distancia total: ${totalWeight}.`
    };
}
