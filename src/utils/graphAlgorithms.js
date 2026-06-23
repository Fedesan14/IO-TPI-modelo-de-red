function formatSet(values) {
    return `{${values.join(', ')}}`;
}

function formatDistance(value) {
    return value === Infinity ? 'infinito' : value;
}

function formatDijkstraLabel(nodeId, distances, previousNode, sourceNodeId) {
    if (nodeId === sourceNodeId) {
        return `[${sourceNodeId}, -]`;
    }

    const previous = previousNode.get(nodeId);

    if (!previous) {
        return `[-, ${formatDistance(distances.get(nodeId))}]`;
    }

    return `[${previous}, ${formatDistance(distances.get(nodeId))}]`;
}

function formatLabels(nodeIds, distances, previousNode, sourceNodeId) {
    const labeledNodeIds = nodeIds.filter((nodeId) => (
        nodeId === sourceNodeId ||
        distances.get(nodeId) !== Infinity ||
        previousNode.has(nodeId)
    ));

    if (labeledNodeIds.length === 0) {
        return '{}';
    }

    return labeledNodeIds
        .map((nodeId) => {
            return `Nodo ${nodeId}: ${formatDijkstraLabel(nodeId, distances, previousNode, sourceNodeId)}`;
        })
        .join(' | ');
}

export function calculatePrim(nodes, edges) {
    if (nodes.length === 0) {
        return {
            mstEdges: [],
            resultNodeIds: [],
            resultText: '',
            totalWeight: null,
            error: 'Agrega nodos antes de calcular el arbol.'
        };
    }

    if (nodes.length === 1) {
        return {
            mstEdges: [],
            resultNodeIds: [nodes[0].id],
            resultText: `Nodo: ${nodes[0].id}`,
            calculationSteps: [{
                title: 'Inicio',
                details: [
                    `El grafo tiene un solo nodo: ${nodes[0].id}.`,
                    'No es necesario elegir aristas. Peso total: 0.'
                ]
            }],
            totalWeight: 0,
            message: 'El arbol de un solo nodo tiene peso total 0.'
        };
    }

    const visited = new Set([nodes[0].id]);
    const selectedEdges = [];
    const calculationSteps = [{
        title: 'Inicio',
        details: [
            `Se elige el nodo ${nodes[0].id} como nodo inicial.`,
            `Nodos conectados: ${formatSet([...visited])}.`,
            `Nodos no conectados: ${formatSet(nodes.filter((node) => !visited.has(node.id)).map((node) => node.id))}.`
        ]
    }];

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
                resultNodeIds: [],
                resultText: '',
                totalWeight: null,
                error: 'No se puede calcular: el grafo no esta conectado.'
            };
        }

        const nextEdge = candidateEdges[0];
        const nextNodeId = visited.has(nextEdge.from) ? nextEdge.to : nextEdge.from;
        const connectedBefore = [...visited];
        const disconnectedBefore = nodes
            .filter((node) => !visited.has(node.id))
            .map((node) => node.id);

        selectedEdges.push(nextEdge);
        visited.add(nextNodeId);

        calculationSteps.push({
            title: `Paso ${selectedEdges.length}`,
            details: [
                `Nodos conectados antes de elegir: ${formatSet(connectedBefore)}.`,
                `Nodos no conectados antes de elegir: ${formatSet(disconnectedBefore)}.`,
                `Aristas candidatas: ${candidateEdges.map((edge) => `(${edge.from}, ${edge.to}, peso ${edge.weight})`).join(' ; ')}.`,
                `Se elige la arista (${nextEdge.from}, ${nextEdge.to}) porque tiene el menor peso disponible: ${nextEdge.weight}.`,
                `Se incorpora el nodo ${nextNodeId}. Nodos conectados ahora: ${formatSet([...visited])}.`
            ]
        });
    }

    const totalWeight = selectedEdges.reduce((sum, edge) => sum + edge.weight, 0);
    const resultNodeIds = [...new Set(selectedEdges.flatMap((edge) => [edge.from, edge.to]))];
    const resultText = `Aristas: ${selectedEdges
        .map((edge) => `(${edge.from}, ${edge.to})`)
        .join(' - ')}`;

    return {
        mstEdges: selectedEdges,
        resultNodeIds,
        resultText,
        calculationSteps,
        totalWeight,
        message: `Arbol de expansion minima calculado con Prim. Peso total: ${totalWeight}.`
    };
}

export function calculateDijkstra(nodes, edges, sourceNodeId, targetNodeId) {
    if (nodes.length === 0) {
        return {
            pathEdges: [],
            resultNodeIds: [],
            resultText: '',
            totalWeight: null,
            error: 'Agrega nodos antes de calcular la ruta mas corta.'
        };
    }

    if (!sourceNodeId || !targetNodeId) {
        return {
            pathEdges: [],
            resultNodeIds: [],
            resultText: '',
            totalWeight: null,
            error: 'Selecciona un nodo origen y un nodo destino.'
        };
    }

    if (sourceNodeId === targetNodeId) {
        return {
            pathEdges: [],
            resultNodeIds: [sourceNodeId],
            resultText: `Ruta: ${sourceNodeId}`,
            calculationSteps: [{
                title: 'Inicio',
                details: [
                    `El origen y el destino son el mismo nodo: ${sourceNodeId}.`,
                    `La etiqueta permanente del origen es Nodo ${sourceNodeId}: [${sourceNodeId}, -]. Distancia total: 0.`
                ]
            }],
            totalWeight: 0,
            message: 'El origen y destino son el mismo nodo. Distancia total: 0.'
        };
    }

    const distances = new Map(nodes.map((node) => [node.id, Infinity]));
    const previousNode = new Map();
    const previousEdge = new Map();
    const unvisited = new Set(nodes.map((node) => node.id));
    const permanentLabels = new Set();
    const calculationSteps = [];

    distances.set(sourceNodeId, 0);

    while (unvisited.size > 0) {
        const currentNodeId = [...unvisited].sort((firstNodeId, secondNodeId) => (
            distances.get(firstNodeId) - distances.get(secondNodeId)
        ))[0];

        if (distances.get(currentNodeId) === Infinity) {
            break;
        }

        if (currentNodeId === targetNodeId) {
            permanentLabels.add(currentNodeId);
            unvisited.delete(currentNodeId);
            calculationSteps.push({
                title: `Paso ${calculationSteps.length + 1}`,
                details: [
                    `Se fija como permanente el nodo ${currentNodeId} con etiqueta ${formatDijkstraLabel(currentNodeId, distances, previousNode, sourceNodeId)}.`,
                    `Como ${currentNodeId} es el destino, el algoritmo termina.`,
                    `Etiquetas permanentes: ${formatLabels([...permanentLabels], distances, previousNode, sourceNodeId)}.`,
                    `Etiquetas temporales: ${formatLabels([...unvisited], distances, previousNode, sourceNodeId)}.`
                ]
            });
            break;
        }

        unvisited.delete(currentNodeId);
        permanentLabels.add(currentNodeId);

        const connectedEdges = edges.filter((edge) => (
            edge.from === currentNodeId || edge.to === currentNodeId
        ));
        const updates = [];

        connectedEdges.forEach((edge) => {
            const neighborNodeId = edge.from === currentNodeId ? edge.to : edge.from;

            if (!unvisited.has(neighborNodeId)) {
                return;
            }

            const nextDistance = distances.get(currentNodeId) + edge.weight;

            if (nextDistance < distances.get(neighborNodeId)) {
                const previousDistance = distances.get(neighborNodeId);
                distances.set(neighborNodeId, nextDistance);
                previousNode.set(neighborNodeId, currentNodeId);
                previousEdge.set(neighborNodeId, edge);
                updates.push(
                    `Nodo ${neighborNodeId}: ${formatDistance(previousDistance)} -> [${currentNodeId}, ${nextDistance}] porque ${formatDistance(distances.get(currentNodeId))} + ${edge.weight} = ${nextDistance}.`
                );
            }
        });

        calculationSteps.push({
            title: `Paso ${calculationSteps.length + 1}`,
            details: [
                `Se fija como permanente el nodo ${currentNodeId} con etiqueta ${formatDijkstraLabel(currentNodeId, distances, previousNode, sourceNodeId)}.`,
                `Aristas revisadas: ${connectedEdges.length ? connectedEdges.map((edge) => `(${edge.from}, ${edge.to}, peso ${edge.weight})`).join(' ; ') : 'ninguna'}.`,
                updates.length ? `Etiquetas actualizadas: ${updates.join(' ')}` : 'No se actualiza ninguna etiqueta tentativa.',
                `Etiquetas permanentes: ${formatLabels([...permanentLabels], distances, previousNode, sourceNodeId)}.`,
                `Etiquetas temporales: ${formatLabels([...unvisited], distances, previousNode, sourceNodeId)}.`
            ]
        });
    }

    if (distances.get(targetNodeId) === Infinity) {
        return {
            pathEdges: [],
            resultNodeIds: [],
            resultText: '',
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
                resultNodeIds: [],
                resultText: '',
                totalWeight: null,
                error: 'No existe una ruta entre el nodo origen y el nodo destino.'
            };
        }

        pathEdges.unshift(edge);
        currentNodeId = previousNode.get(currentNodeId);
    }

    const totalWeight = distances.get(targetNodeId);
    const resultNodeIds = [sourceNodeId];

    pathEdges.forEach((edge) => {
        const previousPathNodeId = resultNodeIds[resultNodeIds.length - 1];
        resultNodeIds.push(edge.from === previousPathNodeId ? edge.to : edge.from);
    });

    return {
        pathEdges,
        resultNodeIds,
        resultText: `Ruta: ${resultNodeIds.join(' -> ')}`,
        calculationSteps,
        totalWeight,
        message: `Ruta mas corta calculada con Dijkstra. Distancia total: ${totalWeight}.`
    };
}
