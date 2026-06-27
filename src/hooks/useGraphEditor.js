import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateDijkstra, calculateKruskal, calculatePrim } from '../utils/graphAlgorithms';
import { getRandomBookGraphId, generateBookGraph } from '../utils/bookGraphs';
import { generateConnectedRandomGraph } from '../utils/randomGraph';

export function useGraphEditor() {
    const trashDropZone = {
        size: 92,
        offset: 18
    };
    const nodeHitRadius = 30;
    const graphRef = useRef(null);
    const backgroundPointerStartRef = useRef(null);
    const dragStartNodeIdRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [resultEdges, setResultEdges] = useState([]);
    const [resultNodeIds, setResultNodeIds] = useState([]);
    const [resultText, setResultText] = useState('');
    const [alternativeResultText, setAlternativeResultText] = useState('');
    const [calculationSteps, setCalculationSteps] = useState([]);
    const [strategy, setStrategy] = useState('prim');
    const [sourceNodeId, setSourceNodeId] = useState('');
    const [targetNodeId, setTargetNodeId] = useState('');
    const [toolMode, setToolMode] = useState('connect');
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [dragStartNodeId, setDragStartNodeId] = useState(null);
    const [movingNodeId, setMovingNodeId] = useState(null);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [previewPosition, setPreviewPosition] = useState(null);
    const [randomNodeCount, setRandomNodeCount] = useState(6);
    const [bookGraphReference, setBookGraphReference] = useState(null);
    const [message, setMessage] = useState('Doble click o toque en el fondo para agregar nodos. Arrastra entre nodos para crear aristas.');
    const [errorToast, setErrorToast] = useState(null);
    const [totalWeight, setTotalWeight] = useState(null);

    const resultEdgeIds = useMemo(() => new Set(resultEdges.map((edge) => edge.id)), [resultEdges]);

    const resultNodes = useMemo(() => {
        const solutionNodes = nodes.filter((node) => resultNodeIds.includes(node.id));

        if (solutionNodes.length === 0) {
            return [];
        }

        if (solutionNodes.length === 1) {
            return [{
                ...solutionNodes[0],
                resultX: 160,
                resultY: 160
            }];
        }

        const padding = 48;
        const nodeById = new Map(solutionNodes.map((node) => [node.id, node]));

        if (strategy === 'dijkstra') {
            const horizontalGap = 82;
            const canvasWidth = Math.max(320, padding * 2 + horizontalGap * (resultNodeIds.length - 1));

            return resultNodeIds.map((nodeId, index) => ({
                ...nodeById.get(nodeId),
                resultX: resultNodeIds.length === 1
                    ? canvasWidth / 2
                    : padding + index * horizontalGap,
                resultY: 160
            }));
        }

        const adjacency = new Map(solutionNodes.map((node) => [node.id, []]));

        resultEdges.forEach((edge) => {
            adjacency.get(edge.from)?.push(edge.to);
            adjacency.get(edge.to)?.push(edge.from);
        });

        adjacency.forEach((neighbors) => neighbors.sort((firstNodeId, secondNodeId) => firstNodeId - secondNodeId));

        const horizontalGap = 54;
        const verticalGap = 78;
        const rootNodeId = resultNodeIds[0];
        const positionedNodes = new Map();
        let leafIndex = 0;
        let maxDepth = 0;

        const placeNode = (nodeId, parentNodeId, depth) => {
            maxDepth = Math.max(maxDepth, depth);

            const childNodeIds = (adjacency.get(nodeId) || []).filter((nextNodeId) => nextNodeId !== parentNodeId);

            if (childNodeIds.length === 0) {
                const x = padding + leafIndex * horizontalGap;
                leafIndex += 1;
                positionedNodes.set(nodeId, { x, depth });
                return x;
            }

            const childXs = childNodeIds.map((childNodeId) => placeNode(childNodeId, nodeId, depth + 1));
            const x = childXs.reduce((sum, childX) => sum + childX, 0) / childXs.length;
            positionedNodes.set(nodeId, { x, depth });
            return x;
        };

        placeNode(rootNodeId, null, 0);

        const canvasWidth = Math.max(320, padding * 2 + Math.max(leafIndex - 1, 1) * horizontalGap);
        const canvasHeight = Math.max(320, padding * 2 + maxDepth * verticalGap);

        return solutionNodes.map((node) => {
            const position = positionedNodes.get(node.id);

            return {
                ...node,
                resultX: position?.x || canvasWidth / 2,
                resultY: position
                    ? padding + position.depth * verticalGap
                    : canvasHeight / 2
            };
        });
    }, [nodes, resultEdges, resultNodeIds, strategy]);

    const getPointerPosition = (event) => {
        const rect = graphRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const isPointerOverTrash = (position) => {
        if (!graphRef.current) {
            return false;
        }

        const { clientWidth, clientHeight } = graphRef.current;
        const left = clientWidth - trashDropZone.offset - trashDropZone.size;
        const top = clientHeight - trashDropZone.offset - trashDropZone.size;

        return (
            position.x >= left &&
            position.x <= left + trashDropZone.size &&
            position.y >= top &&
            position.y <= top + trashDropZone.size
        );
    };

    const getNodeById = (nodeId) => {
        return nodes.find((node) => node.id === nodeId);
    };

    const getResultNodeById = (nodeId) => {
        return resultNodes.find((node) => node.id === nodeId);
    };

    const getNodeAtPosition = (position, excludedNodeId = null) => {
        return nodes.find((node) => {
            if (node.id === excludedNodeId) {
                return false;
            }

            return Math.hypot(node.x - position.x, node.y - position.y) <= nodeHitRadius;
        });
    };

    const resetResult = () => {
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setTotalWeight(null);
    };

    const showError = useCallback((errorMessage) => {
        setErrorToast({
            id: Date.now(),
            message: errorMessage
        });
    }, []);

    const clearErrorToast = useCallback(() => {
        setErrorToast(null);
    }, []);

    const addNodeAtPosition = (position) => {
        const nextNode = {
            id: nodes.length ? Math.max(...nodes.map((node) => node.id)) + 1 : 1,
            x: position.x,
            y: position.y
        };

        setNodes((currentNodes) => [...currentNodes, nextNode]);
        setBookGraphReference(null);
        clearErrorToast();
        if (nodes.length === 0) {
            setSourceNodeId(nextNode.id);
        }
        if (nodes.length === 1) {
            setTargetNodeId(nextNode.id);
        }
        resetResult();
        setMessage(`Nodo ${nextNode.id} agregado.`);
    };

    const handleDoubleClick = (event) => {
        if (event.target !== graphRef.current) {
            return;
        }

        addNodeAtPosition(getPointerPosition(event));
    };

    const handleBackgroundPointerDown = (event) => {
        if (event.target !== graphRef.current || event.pointerType === 'mouse') {
            backgroundPointerStartRef.current = null;
            return;
        }

        backgroundPointerStartRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY
        };
    };

    const handleBackgroundPointerUp = (event) => {
        const activeSourceNodeId = dragStartNodeIdRef.current;
        const targetNode = activeSourceNodeId
            ? getNodeAtPosition(getPointerPosition(event), activeSourceNodeId)
            : null;

        if (targetNode) {
            handleNodeMouseUp(targetNode.id, event);
            return;
        }

        const pointerStart = backgroundPointerStartRef.current;
        backgroundPointerStartRef.current = null;

        if (!pointerStart || event.pointerId !== pointerStart.pointerId || event.target !== graphRef.current) {
            handleMouseUp(event);
            return;
        }

        const movement = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);

        if (movement <= 8) {
            addNodeAtPosition(getPointerPosition(event));
            return;
        }

        handleMouseUp(event);
    };

    const handleNodeMouseDown = (nodeId, event) => {
        event.stopPropagation();
        event.preventDefault();

        if (toolMode === 'move') {
            setSelectedNodeId(nodeId);
            setMovingNodeId(nodeId);
            setMessage(`Moviendo nodo ${nodeId}.`);
            return;
        }

        dragStartNodeIdRef.current = nodeId;
        setDragStartNodeId(nodeId);
        setPreviewPosition(getPointerPosition(event));
    };

    const handleNodeMouseUp = (targetNodeId, event) => {
        event.stopPropagation();
        event.preventDefault();

        if (toolMode === 'move') {
            const position = getPointerPosition(event);

            if (isPointerOverTrash(position)) {
                deleteNode(targetNodeId);
                setIsOverTrash(false);
                return;
            }

            setMovingNodeId(null);
            setIsOverTrash(false);
            setMessage(`Nodo ${targetNodeId} seleccionado. Presiona Supr para eliminarlo.`);
            return;
        }

        const sourceNodeId = dragStartNodeIdRef.current || dragStartNodeId;
        const position = getPointerPosition(event);
        const targetNode = sourceNodeId === targetNodeId
            ? getNodeAtPosition(position, sourceNodeId)
            : getNodeById(targetNodeId);
        const resolvedTargetNodeId = targetNode?.id || targetNodeId;

        if (!sourceNodeId || sourceNodeId === resolvedTargetNodeId) {
            dragStartNodeIdRef.current = null;
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const edgeAlreadyExists = edges.some((edge) => {
            return (
                (edge.from === sourceNodeId && edge.to === resolvedTargetNodeId) ||
                (edge.from === resolvedTargetNodeId && edge.to === sourceNodeId)
            );
        });

        if (edgeAlreadyExists) {
            showError('Ya existe una arista entre esos nodos.');
            dragStartNodeIdRef.current = null;
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const weightInput = window.prompt(`Peso de la arista ${sourceNodeId} - ${resolvedTargetNodeId}:`);
        const weight = Number(weightInput);

        if (!weightInput || Number.isNaN(weight) || weight <= 0) {
            showError('La arista no se creo porque el peso debe ser un numero positivo.');
            dragStartNodeIdRef.current = null;
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const nextEdge = {
            id: edges.length ? Math.max(...edges.map((edge) => edge.id)) + 1 : 1,
            from: sourceNodeId,
            to: resolvedTargetNodeId,
            weight
        };

        setEdges((currentEdges) => [...currentEdges, nextEdge]);
        setBookGraphReference(null);
        clearErrorToast();
        resetResult();
        setMessage(`Arista ${sourceNodeId} - ${resolvedTargetNodeId} creada con peso ${weight}.`);
        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setPreviewPosition(null);
    };

    const handleMouseUp = (event) => {
        if (movingNodeId) {
            const position = getPointerPosition(event);

            if (isPointerOverTrash(position)) {
                deleteNode(movingNodeId);
                setIsOverTrash(false);
                return;
            }
        }

        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
        setPreviewPosition(null);
    };

    const handleMouseMove = (event) => {
        if (movingNodeId) {
            const position = getPointerPosition(event);
            setIsOverTrash(isPointerOverTrash(position));
            setNodes((currentNodes) => (
                currentNodes.map((node) => (
                    node.id === movingNodeId
                        ? { ...node, x: position.x, y: position.y }
                        : node
                ))
            ));
            return;
        }

        if (!dragStartNodeIdRef.current && !dragStartNodeId) {
            return;
        }

        setPreviewPosition(getPointerPosition(event));
    };

    const calculateResult = useCallback(() => {
        const result = strategy === 'prim'
            ? calculatePrim(nodes, edges)
            : strategy === 'kruskal'
                ? calculateKruskal(nodes, edges)
                : calculateDijkstra(nodes, edges, Number(sourceNodeId), Number(targetNodeId));

        setResultEdges(result.mstEdges || result.pathEdges || []);
        setResultNodeIds(result.resultNodeIds || []);
        setResultText(result.resultText || '');
        setAlternativeResultText(result.alternativeResultText || '');
        setCalculationSteps(result.calculationSteps || []);
        setTotalWeight(result.totalWeight);
        setMessage(result.message || '');

        if (result.error) {
            showError(result.error);
        } else {
            clearErrorToast();
        }
    }, [clearErrorToast, edges, nodes, showError, sourceNodeId, strategy, targetNodeId]);

    const updateEdgeWeight = (edgeId) => {
        const edge = edges.find((currentEdge) => currentEdge.id === edgeId);

        if (!edge) {
            return;
        }

        const weightInput = window.prompt(
            `Nuevo peso de la arista ${edge.from} - ${edge.to}:`,
            edge.weight
        );
        const weight = Number(weightInput);

        if (!weightInput || Number.isNaN(weight) || weight <= 0) {
            showError('El peso no se modifico porque debe ser un numero positivo.');
            return;
        }

        setEdges((currentEdges) => (
            currentEdges.map((currentEdge) => (
                currentEdge.id === edgeId
                    ? { ...currentEdge, weight }
                    : currentEdge
            ))
        ));
        setBookGraphReference(null);
        clearErrorToast();
        resetResult();
        setMessage(`Peso de la arista ${edge.from} - ${edge.to} actualizado a ${weight}.`);
    };

    const deleteNode = useCallback((nodeId) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
        setEdges((currentEdges) => (
            currentEdges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId)
        ));
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setSelectedNodeId(null);
        dragStartNodeIdRef.current = null;
        setMovingNodeId(null);
        setDragStartNodeId(null);
        setIsOverTrash(false);
        setPreviewPosition(null);
        setSourceNodeId((currentSourceNodeId) => (
            Number(currentSourceNodeId) === nodeId ? '' : currentSourceNodeId
        ));
        setTargetNodeId((currentTargetNodeId) => (
            Number(currentTargetNodeId) === nodeId ? '' : currentTargetNodeId
        ));
        setBookGraphReference(null);
        setTotalWeight(null);
        setMessage(`Nodo ${nodeId} eliminado junto con sus aristas conectadas.`);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const editableTags = ['INPUT', 'SELECT', 'TEXTAREA'];

            if (editableTags.includes(event.target.tagName)) {
                return;
            }

            if (event.code === 'Space') {
                event.preventDefault();

                const nextToolMode = toolMode === 'connect' ? 'move' : 'connect';
                setToolMode(nextToolMode);
                setSelectedNodeId(null);
                dragStartNodeIdRef.current = null;
                setDragStartNodeId(null);
                setMovingNodeId(null);
                setIsOverTrash(false);
                setPreviewPosition(null);
                setMessage(
                    nextToolMode === 'connect'
                        ? 'Modo crear aristas: arrastra desde un nodo hasta otro.'
                        : 'Modo mover nodos: arrastra un nodo para reubicarlo.'
                );
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                calculateResult();
                return;
            }

            if (event.key === 'Delete' && toolMode === 'move' && selectedNodeId) {
                event.preventDefault();
                deleteNode(selectedNodeId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteNode, selectedNodeId, toolMode, calculateResult]);

    const clearGraph = () => {
        setNodes([]);
        setEdges([]);
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setSelectedNodeId(null);
        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
        setPreviewPosition(null);
        setSourceNodeId('');
        setTargetNodeId('');
        setBookGraphReference(null);
        setTotalWeight(null);
        clearErrorToast();
        setMessage('Grafo limpio. Doble click o toque en el fondo para agregar nuevos nodos.');
    };

    const selectStrategy = (nextStrategy) => {
        setStrategy(nextStrategy);
        resetResult();
        setMessage(
            nextStrategy === 'prim'
                ? 'Estrategia seleccionada: arbol de expansion minima con Prim.'
                : nextStrategy === 'kruskal'
                    ? 'Estrategia seleccionada: arbol de expansion minima con Kruskal.'
                    : 'Estrategia seleccionada: ruta mas corta con Dijkstra.'
        );
    };

    const selectToolMode = (nextToolMode) => {
        setToolMode(nextToolMode);
        setSelectedNodeId(null);
        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
        setPreviewPosition(null);
        setMessage(
            nextToolMode === 'connect'
                ? 'Modo crear aristas: arrastra desde un nodo hasta otro.'
                : 'Modo mover nodos: arrastra un nodo para reubicarlo.'
        );
    };

    const generateRandomGraph = () => {
        const nodeCount = Math.max(2, Math.min(Number(randomNodeCount) || 2, 20));
        const graph = generateConnectedRandomGraph({
            nodeCount,
            width: graphRef.current?.clientWidth,
            height: graphRef.current?.clientHeight
        });

        setRandomNodeCount(nodeCount);
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setSelectedNodeId(null);
        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setSourceNodeId(graph.nodes[0]?.id || '');
        setTargetNodeId(graph.nodes[graph.nodes.length - 1]?.id || '');
        setBookGraphReference(null);
        setTotalWeight(null);
        clearErrorToast();
        setMessage(`Grafo aleatorio conectado generado con ${nodeCount} nodos y ${graph.edges.length} aristas.`);
    };

    const generateBookGraphExample = () => {
        const graphId = getRandomBookGraphId();
        const graph = generateBookGraph({
            graphId,
            width: graphRef.current?.clientWidth,
            height: graphRef.current?.clientHeight
        });

        setNodes(graph.nodes);
        setEdges(graph.edges);
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setSelectedNodeId(null);
        dragStartNodeIdRef.current = null;
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setSourceNodeId(graph.nodes[0]?.id || '');
        setTargetNodeId(graph.nodes[graph.nodes.length - 1]?.id || '');
        setBookGraphReference(graph.reference);
        setTotalWeight(null);
        clearErrorToast();
        setMessage(`${graph.name} cargado con ${graph.nodes.length} nodos y ${graph.edges.length} aristas.`);
    };

    return {
        graphRef,
        nodes,
        edges,
        resultEdges,
        resultEdgeIds,
        resultNodes,
        resultText,
        alternativeResultText,
        calculationSteps,
        strategy,
        sourceNodeId,
        targetNodeId,
        toolMode,
        selectedNodeId,
        dragStartNodeId,
        movingNodeId,
        isOverTrash,
        previewPosition,
        randomNodeCount,
        bookGraphReference,
        message,
        errorToast,
        totalWeight,
        setRandomNodeCount,
        setSourceNodeId,
        setTargetNodeId,
        getNodeById,
        getResultNodeById,
        handleDoubleClick,
        handleBackgroundPointerDown,
        handleBackgroundPointerUp,
        handleNodeMouseDown,
        handleNodeMouseUp,
        handleMouseUp,
        handleMouseMove,
        updateEdgeWeight,
        calculateResult,
        clearGraph,
        clearErrorToast,
        selectStrategy,
        selectToolMode,
        generateRandomGraph,
        generateBookGraphExample
    };
}
