import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateDijkstra, calculateKruskal, calculatePrim } from '../utils/graphAlgorithms';
import { getRandomBookGraphId, generateBookGraph } from '../utils/bookGraphs';
import { generateConnectedRandomGraph } from '../utils/randomGraph';

export function useGraphEditor() {
    const trashDropZone = {
        size: 92,
        offset: 18
    };
    const nodeMoveDelay = 260;
    const nodeMoveThreshold = 8;
    const graphRef = useRef(null);
    const backgroundPointerStartRef = useRef(null);
    const nodePointerRef = useRef(null);
    const moveTimerRef = useRef(null);
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
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [movingNodeId, setMovingNodeId] = useState(null);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [randomNodeCount, setRandomNodeCount] = useState(6);
    const [bookGraphReference, setBookGraphReference] = useState(null);
    const [message, setMessage] = useState('Doble click o toque en el fondo para agregar nodos. Toca dos nodos para crear una arista.');
    const [errorToast, setErrorToast] = useState(null);
    const [totalWeight, setTotalWeight] = useState(null);
    const [weightModal, setWeightModal] = useState(null);

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

    const clearMoveTimer = () => {
        if (moveTimerRef.current) {
            window.clearTimeout(moveTimerRef.current);
            moveTimerRef.current = null;
        }
    };

    const startMovingNode = (nodeId, position) => {
        setSelectedNodeId(null);
        setMovingNodeId(nodeId);
        setIsOverTrash(isPointerOverTrash(position));
        setNodes((currentNodes) => (
            currentNodes.map((node) => (
                node.id === nodeId
                    ? { ...node, x: position.x, y: position.y }
                    : node
            ))
        ));
    };

    const openWeightModal = (modalConfig) => {
        clearErrorToast();
        setWeightModal({
            value: modalConfig.initialWeight ? String(modalConfig.initialWeight) : '',
            error: '',
            ...modalConfig
        });
    };

    const closeWeightModal = () => {
        setWeightModal(null);
        setSelectedNodeId(null);
    };

    const updateWeightModalValue = (value) => {
        setWeightModal((currentModal) => (
            currentModal
                ? { ...currentModal, value, error: '' }
                : currentModal
        ));
    };

    const createEdgeBetweenNodes = (sourceNodeId, targetNodeId) => {
        if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) {
            return false;
        }

        const edgeAlreadyExists = edges.some((edge) => {
            return (
                (edge.from === sourceNodeId && edge.to === targetNodeId) ||
                (edge.from === targetNodeId && edge.to === sourceNodeId)
            );
        });

        if (edgeAlreadyExists) {
            showError('Ya existe una arista entre esos nodos.');
            setSelectedNodeId(null);
            return false;
        }

        openWeightModal({
            mode: 'create',
            sourceNodeId,
            targetNodeId,
            title: 'Peso de la arista',
            submitLabel: 'Crear arista'
        });
        return true;
    };

    const submitWeightModal = () => {
        if (!weightModal) {
            return;
        }

        const weight = Number(weightModal.value);

        if (!weightModal.value || Number.isNaN(weight) || weight <= 0) {
            setWeightModal((currentModal) => (
                currentModal
                    ? { ...currentModal, error: 'Ingresá un número positivo.' }
                    : currentModal
            ));
            return;
        }

        if (weightModal.mode === 'create') {
            const nextEdge = {
                id: edges.length ? Math.max(...edges.map((edge) => edge.id)) + 1 : 1,
                from: weightModal.sourceNodeId,
                to: weightModal.targetNodeId,
                weight
            };

            setEdges((currentEdges) => [...currentEdges, nextEdge]);
            setBookGraphReference(null);
            clearErrorToast();
            resetResult();
            setSelectedNodeId(null);
            setWeightModal(null);
            setMessage(`Arista ${weightModal.sourceNodeId} - ${weightModal.targetNodeId} creada con peso ${weight}.`);
            return;
        }

        setEdges((currentEdges) => (
            currentEdges.map((currentEdge) => (
                currentEdge.id === weightModal.edgeId
                    ? { ...currentEdge, weight }
                    : currentEdge
            ))
        ));
        setBookGraphReference(null);
        clearErrorToast();
        resetResult();
        setWeightModal(null);
        setMessage(`Peso de la arista ${weightModal.sourceNodeId} - ${weightModal.targetNodeId} actualizado a ${weight}.`);
    };

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
        setSelectedNodeId(null);
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

        clearMoveTimer();

        const position = getPointerPosition(event);
        nodePointerRef.current = {
            nodeId,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastPosition: position,
            hasMoved: false
        };

        moveTimerRef.current = window.setTimeout(() => {
            const pointerState = nodePointerRef.current;

            if (!pointerState || pointerState.pointerId !== event.pointerId) {
                return;
            }

            pointerState.hasMoved = true;
            pointerState.isMoving = true;
            startMovingNode(nodeId, pointerState.lastPosition);
            setMessage(`Moviendo nodo ${nodeId}.`);
        }, nodeMoveDelay);
    };

    const handleNodeMouseUp = (targetNodeId, event) => {
        event.stopPropagation();
        event.preventDefault();
        clearMoveTimer();

        const pointerState = nodePointerRef.current;
        nodePointerRef.current = null;

        const activeMovingNodeId = movingNodeId || (pointerState?.isMoving ? pointerState.nodeId : null);

        if (activeMovingNodeId) {
            const position = getPointerPosition(event);

            if (isPointerOverTrash(position)) {
                deleteNode(activeMovingNodeId);
                setIsOverTrash(false);
                return;
            }

            setMovingNodeId(null);
            setIsOverTrash(false);
            setSelectedNodeId(null);
            setMessage(`Nodo ${activeMovingNodeId} reubicado.`);
            return;
        }

        if (!pointerState || pointerState.pointerId !== event.pointerId || pointerState.hasMoved) {
            return;
        }

        if (!selectedNodeId) {
            setSelectedNodeId(targetNodeId);
            setMessage(`Nodo ${targetNodeId} seleccionado. Toca otro nodo para crear una arista.`);
            return;
        }

        if (selectedNodeId === targetNodeId) {
            setSelectedNodeId(null);
            setMessage(`Seleccion del nodo ${targetNodeId} cancelada.`);
            return;
        }

        createEdgeBetweenNodes(selectedNodeId, targetNodeId);
    };

    const handleMouseUp = (event) => {
        clearMoveTimer();
        nodePointerRef.current = null;

        if (movingNodeId) {
            const position = getPointerPosition(event);

            if (isPointerOverTrash(position)) {
                deleteNode(movingNodeId);
                setIsOverTrash(false);
                return;
            }
        }

        setMovingNodeId(null);
        setIsOverTrash(false);
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

        const pointerState = nodePointerRef.current;

        if (!pointerState || event.pointerId !== pointerState.pointerId) {
            return;
        }

        const movement = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
        const position = getPointerPosition(event);
        pointerState.lastPosition = position;

        if (!movingNodeId && movement > nodeMoveThreshold) {
            clearMoveTimer();
            pointerState.hasMoved = true;
            pointerState.isMoving = true;
            startMovingNode(pointerState.nodeId, position);
            setMessage(`Moviendo nodo ${pointerState.nodeId}.`);
            return;
        }

        if (movingNodeId) {
            setIsOverTrash(isPointerOverTrash(position));
            setNodes((currentNodes) => (
                currentNodes.map((node) => (
                    node.id === movingNodeId
                        ? { ...node, x: position.x, y: position.y }
                        : node
                ))
            ));
        }
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

        openWeightModal({
            mode: 'edit',
            edgeId,
            sourceNodeId: edge.from,
            targetNodeId: edge.to,
            initialWeight: edge.weight,
            title: 'Editar peso',
            submitLabel: 'Guardar peso'
        });
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
        setWeightModal(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
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
        return () => {
            clearMoveTimer();
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const editableTags = ['INPUT', 'SELECT', 'TEXTAREA'];

            if (editableTags.includes(event.target.tagName)) {
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                calculateResult();
                return;
            }

            if (event.key === 'Delete' && selectedNodeId) {
                event.preventDefault();
                deleteNode(selectedNodeId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteNode, selectedNodeId, calculateResult]);

    const clearGraph = () => {
        setNodes([]);
        setEdges([]);
        setResultEdges([]);
        setResultNodeIds([]);
        setResultText('');
        setAlternativeResultText('');
        setCalculationSteps([]);
        setSelectedNodeId(null);
        clearMoveTimer();
        nodePointerRef.current = null;
        setWeightModal(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
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
        setWeightModal(null);
        setMovingNodeId(null);
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
        setWeightModal(null);
        setMovingNodeId(null);
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
        selectedNodeId,
        movingNodeId,
        isOverTrash,
        randomNodeCount,
        bookGraphReference,
        message,
        errorToast,
        weightModal,
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
        updateWeightModalValue,
        submitWeightModal,
        closeWeightModal,
        calculateResult,
        clearGraph,
        clearErrorToast,
        selectStrategy,
        generateRandomGraph,
        generateBookGraphExample
    };
}
