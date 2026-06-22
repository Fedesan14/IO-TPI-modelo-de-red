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
