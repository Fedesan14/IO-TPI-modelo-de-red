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

function formatEdge(edge) {
    return `(${edge.from}, ${edge.to}, peso ${edge.weight})`;
}

function getEdgeKey(edge) {
    const from = Math.min(edge.from, edge.to);
    const to = Math.max(edge.from, edge.to);
    return `${from}-${to}`;
}

function findPathEdgesInTree(treeEdges, fromNodeId, toNodeId) {
    const adjacency = new Map();

    treeEdges.forEach((edge) => {
        const fromEdges = adjacency.get(edge.from) || [];
        const toEdges = adjacency.get(edge.to) || [];

        fromEdges.push({ nodeId: edge.to, edge });
        toEdges.push({ nodeId: edge.from, edge });
        adjacency.set(edge.from, fromEdges);
        adjacency.set(edge.to, toEdges);
    });

    const stack = [{ nodeId: fromNodeId, parentNodeId: null, pathEdges: [] }];

    while (stack.length > 0) {
        const current = stack.pop();

        if (current.nodeId === toNodeId) {
            return current.pathEdges;
        }

        (adjacency.get(current.nodeId) || []).forEach((next) => {
            if (next.nodeId !== current.parentNodeId) {
                stack.push({
                    nodeId: next.nodeId,
                    parentNodeId: current.nodeId,
                    pathEdges: [...current.pathEdges, next.edge]
                });
            }
        });
    }

    return [];
}

function findAlternativeMstSwaps(edges, selectedEdges) {
    const selectedEdgeKeys = new Set(selectedEdges.map(getEdgeKey));

    return edges
        .filter((edge) => !selectedEdgeKeys.has(getEdgeKey(edge)))
        .flatMap((edge) => {
            const pathEdges = findPathEdgesInTree(selectedEdges, edge.from, edge.to);
            const removableEdges = pathEdges.filter((pathEdge) => pathEdge.weight === edge.weight);

            return removableEdges.map((removableEdge) => ({
                add: edge,
                remove: removableEdge
            }));
        });
}

function appendAlternativeMstStep(calculationSteps, edges, selectedEdges, totalWeight) {
    const alternativeSwaps = findAlternativeMstSwaps(edges, selectedEdges);

    if (alternativeSwaps.length === 0) {
        calculationSteps.push({
            title: 'Soluciones alternativas',
            details: ['No se detectaron intercambios de igual peso. El arbol minimo obtenido es unico con estas aristas.']
        });
        return;
    }

    calculationSteps.push({
        title: 'Soluciones alternativas',
        details: [
            `Existen otros arboles de expansion minima con el mismo peso total: ${totalWeight}.`,
            ...alternativeSwaps.slice(0, 5).map((swap) => (
                `Se puede agregar ${formatEdge(swap.add)} y quitar ${formatEdge(swap.remove)} para obtener otro arbol minimo.`
            ))
        ]
    });
}

function getAlternativeMstText(edges, selectedEdges, totalWeight) {
    const alternativeSwaps = findAlternativeMstSwaps(edges, selectedEdges);

    if (alternativeSwaps.length === 0) {
        return '';
    }

    const swapText = alternativeSwaps
        .slice(0, 3)
        .map((swap) => `agregar ${formatEdge(swap.add)} y quitar ${formatEdge(swap.remove)}`)
        .join(' ; ');

    return `Tambien existen otros arboles minimos con peso ${totalWeight}: ${swapText}.`;
}

function findShortestPaths(edges, distances, sourceNodeId, targetNodeId, totalWeight) {
    const adjacency = new Map();

    edges.forEach((edge) => {
        const fromEdges = adjacency.get(edge.from) || [];
        const toEdges = adjacency.get(edge.to) || [];

        fromEdges.push({ nodeId: edge.to, edge });
        toEdges.push({ nodeId: edge.from, edge });
        adjacency.set(edge.from, fromEdges);
        adjacency.set(edge.to, toEdges);
    });

    const paths = [];
    const visit = (nodeId, pathNodeIds, pathEdges) => {
        if (paths.length >= 10) {
            return;
        }

        if (nodeId === targetNodeId) {
            const pathWeight = pathEdges.reduce((sum, edge) => sum + edge.weight, 0);

            if (pathWeight === totalWeight) {
                paths.push({
                    nodeIds: pathNodeIds,
                    edges: pathEdges
                });
            }
            return;
        }

        (adjacency.get(nodeId) || []).forEach((next) => {
            if (pathNodeIds.includes(next.nodeId)) {
                return;
            }

            if (distances.get(nodeId) + next.edge.weight !== distances.get(next.nodeId)) {
                return;
            }

            visit(next.nodeId, [...pathNodeIds, next.nodeId], [...pathEdges, next.edge]);
        });
    };

    visit(sourceNodeId, [sourceNodeId], []);
    return paths;
}

function getAlternativePathTexts(edges, distances, sourceNodeId, targetNodeId, totalWeight, selectedPathText) {
    return findShortestPaths(edges, distances, sourceNodeId, targetNodeId, totalWeight)
        .map((path) => path.nodeIds.join(' -> '))
        .filter((pathText) => pathText !== selectedPathText);
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
    const alternativeResultText = getAlternativeMstText(edges, selectedEdges, totalWeight);
    appendAlternativeMstStep(calculationSteps, edges, selectedEdges, totalWeight);

    return {
        mstEdges: selectedEdges,
        resultNodeIds,
        resultText,
        alternativeResultText,
        calculationSteps,
        totalWeight,
        message: `Arbol de expansion minima calculado con Prim. Peso total: ${totalWeight}.`
    };
}

export function calculateKruskal(nodes, edges) {
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

    const parent = new Map(nodes.map((node) => [node.id, node.id]));
    const rank = new Map(nodes.map((node) => [node.id, 0]));
    const selectedEdges = [];
    const sortedEdges = [...edges].sort((firstEdge, secondEdge) => firstEdge.weight - secondEdge.weight);
    const calculationSteps = [{
        title: 'Inicio',
        details: [
            'Se ordenan las aristas de menor a mayor peso.',
            `Orden: ${sortedEdges.length ? sortedEdges.map((edge) => `(${edge.from}, ${edge.to}, peso ${edge.weight})`).join(' ; ') : 'sin aristas'}.`,
            'Cada nodo comienza como un componente separado.'
        ]
    }];

    const findRoot = (nodeId) => {
        if (parent.get(nodeId) !== nodeId) {
            parent.set(nodeId, findRoot(parent.get(nodeId)));
        }

        return parent.get(nodeId);
    };

    const union = (firstNodeId, secondNodeId) => {
        const firstRoot = findRoot(firstNodeId);
        const secondRoot = findRoot(secondNodeId);

        if (firstRoot === secondRoot) {
            return false;
        }

        if (rank.get(firstRoot) < rank.get(secondRoot)) {
            parent.set(firstRoot, secondRoot);
        } else if (rank.get(firstRoot) > rank.get(secondRoot)) {
            parent.set(secondRoot, firstRoot);
        } else {
            parent.set(secondRoot, firstRoot);
            rank.set(firstRoot, rank.get(firstRoot) + 1);
        }

        return true;
    };

    const formatComponents = () => {
        const components = new Map();

        nodes.forEach((node) => {
            const root = findRoot(node.id);
            const component = components.get(root) || [];
            component.push(node.id);
            components.set(root, component);
        });

        return [...components.values()]
            .map((component) => formatSet(component.sort((firstNodeId, secondNodeId) => firstNodeId - secondNodeId)))
            .join(' ; ');
    };

    sortedEdges.forEach((edge) => {
        if (selectedEdges.length === nodes.length - 1) {
            return;
        }

        const fromRoot = findRoot(edge.from);
        const toRoot = findRoot(edge.to);

        if (fromRoot === toRoot) {
            calculationSteps.push({
                title: `Paso ${calculationSteps.length}`,
                details: [
                    `Se evalua la arista (${edge.from}, ${edge.to}) con peso ${edge.weight}.`,
                    `Se descarta porque ${edge.from} y ${edge.to} ya pertenecen al mismo componente.`,
                    `Componentes actuales: ${formatComponents()}.`
                ]
            });
            return;
        }

        selectedEdges.push(edge);
        union(edge.from, edge.to);

        calculationSteps.push({
            title: `Paso ${calculationSteps.length}`,
            details: [
                `Se evalua la arista (${edge.from}, ${edge.to}) con peso ${edge.weight}.`,
                'Se acepta porque une dos componentes distintos y no forma ciclo.',
                `Aristas seleccionadas: ${selectedEdges.map((selectedEdge) => `(${selectedEdge.from}, ${selectedEdge.to})`).join(' - ')}.`,
                `Componentes actuales: ${formatComponents()}.`
            ]
        });
    });

    if (selectedEdges.length !== nodes.length - 1) {
        return {
            mstEdges: [],
            resultNodeIds: [],
            resultText: '',
            totalWeight: null,
            error: 'No se puede calcular: el grafo no esta conectado.'
        };
    }

    const totalWeight = selectedEdges.reduce((sum, edge) => sum + edge.weight, 0);
    const resultNodeIds = [...new Set(selectedEdges.flatMap((edge) => [edge.from, edge.to]))];
    const resultText = `Aristas: ${selectedEdges
        .map((edge) => `(${edge.from}, ${edge.to})`)
        .join(' - ')}`;
    const alternativeResultText = getAlternativeMstText(edges, selectedEdges, totalWeight);

    appendAlternativeMstStep(calculationSteps, edges, selectedEdges, totalWeight);

    return {
        mstEdges: selectedEdges,
        resultNodeIds,
        resultText,
        alternativeResultText,
        calculationSteps,
        totalWeight,
        message: `Arbol de expansion minima calculado con Kruskal. Peso total: ${totalWeight}.`
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

    const selectedPathText = resultNodeIds.join(' -> ');
    const alternativePathTexts = getAlternativePathTexts(
        edges,
        distances,
        sourceNodeId,
        targetNodeId,
        totalWeight,
        selectedPathText
    );
    const alternativeResultText = alternativePathTexts.length
        ? `Tambien existen otros caminos minimos con distancia ${totalWeight}: ${alternativePathTexts.slice(0, 3).join(' ; ')}.`
        : '';

    calculationSteps.push({
        title: 'Soluciones alternativas',
        details: alternativePathTexts.length
            ? [
                `Existen otros caminos minimos con distancia total ${distances.get(targetNodeId)}.`,
                ...alternativePathTexts.slice(0, 5).map((pathText) => `Camino alternativo: ${pathText}.`)
            ]
            : ['No se detectaron otros caminos con la misma distancia total.']
    });

    return {
        pathEdges,
        resultNodeIds,
        resultText: `Ruta: ${resultNodeIds.join(' -> ')}`,
        alternativeResultText,
        calculationSteps,
        totalWeight,
        message: `Ruta mas corta calculada con Dijkstra. Distancia total: ${totalWeight}.`
    };
}
