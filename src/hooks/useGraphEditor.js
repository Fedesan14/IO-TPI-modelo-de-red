import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateDijkstra, calculatePrim } from '../utils/graphAlgorithms';
import { generateConnectedRandomGraph } from '../utils/randomGraph';

export function useGraphEditor() {
    const trashDropZone = {
        size: 92,
        offset: 18
    };
    const graphRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [resultEdges, setResultEdges] = useState([]);
    const [resultNodeIds, setResultNodeIds] = useState([]);
    const [resultText, setResultText] = useState('');
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
    const [message, setMessage] = useState('Doble click para agregar nodos. Arrastra entre nodos para crear aristas.');
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

        const resultSize = 320;
        const padding = 46;
        const nodeXs = solutionNodes.map((node) => node.x);
        const nodeYs = solutionNodes.map((node) => node.y);
        const minX = Math.min(...nodeXs);
        const minY = Math.min(...nodeYs);
        const width = Math.max(Math.max(...nodeXs) - minX, 1);
        const height = Math.max(Math.max(...nodeYs) - minY, 1);
        const drawableSize = resultSize - padding * 2;

        return solutionNodes.map((node) => ({
            ...node,
            resultX: padding + ((node.x - minX) / width) * drawableSize,
            resultY: padding + ((node.y - minY) / height) * drawableSize
        }));
    }, [nodes, resultNodeIds]);

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

    const handleDoubleClick = (event) => {
        if (event.target !== graphRef.current) {
            return;
        }

        const position = getPointerPosition(event);
        const nextNode = {
            id: nodes.length ? Math.max(...nodes.map((node) => node.id)) + 1 : 1,
            x: position.x,
            y: position.y
        };

        setNodes((currentNodes) => [...currentNodes, nextNode]);
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

    const handleNodeMouseDown = (nodeId, event) => {
        event.stopPropagation();

        if (toolMode === 'move') {
            setSelectedNodeId(nodeId);
            setMovingNodeId(nodeId);
            setMessage(`Moviendo nodo ${nodeId}.`);
            return;
        }

        setDragStartNodeId(nodeId);
        setPreviewPosition(getPointerPosition(event));
    };

    const handleNodeMouseUp = (targetNodeId, event) => {
        event.stopPropagation();

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

        if (!dragStartNodeId || dragStartNodeId === targetNodeId) {
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const edgeAlreadyExists = edges.some((edge) => {
            return (
                (edge.from === dragStartNodeId && edge.to === targetNodeId) ||
                (edge.from === targetNodeId && edge.to === dragStartNodeId)
            );
        });

        if (edgeAlreadyExists) {
            showError('Ya existe una arista entre esos nodos.');
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const weightInput = window.prompt(`Peso de la arista ${dragStartNodeId} - ${targetNodeId}:`);
        const weight = Number(weightInput);

        if (!weightInput || Number.isNaN(weight) || weight <= 0) {
            showError('La arista no se creo porque el peso debe ser un numero positivo.');
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const nextEdge = {
            id: edges.length ? Math.max(...edges.map((edge) => edge.id)) + 1 : 1,
            from: dragStartNodeId,
            to: targetNodeId,
            weight
        };

        setEdges((currentEdges) => [...currentEdges, nextEdge]);
        clearErrorToast();
        resetResult();
        setMessage(`Arista ${dragStartNodeId} - ${targetNodeId} creada con peso ${weight}.`);
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

        if (!dragStartNodeId) {
            return;
        }

        setPreviewPosition(getPointerPosition(event));
    };

    const calculateResult = useCallback(() => {
        const result = strategy === 'prim'
            ? calculatePrim(nodes, edges)
            : calculateDijkstra(nodes, edges, Number(sourceNodeId), Number(targetNodeId));

        setResultEdges(result.mstEdges || result.pathEdges || []);
        setResultNodeIds(result.resultNodeIds || []);
        setResultText(result.resultText || '');
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
        setSelectedNodeId(null);
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
        setSelectedNodeId(null);
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setIsOverTrash(false);
        setPreviewPosition(null);
        setSourceNodeId('');
        setTargetNodeId('');
        setTotalWeight(null);
        clearErrorToast();
        setMessage('Grafo limpio. Doble click para agregar nuevos nodos.');
    };

    const selectStrategy = (nextStrategy) => {
        setStrategy(nextStrategy);
        resetResult();
        setMessage(
            nextStrategy === 'prim'
                ? 'Estrategia seleccionada: arbol de expansion minima con Prim.'
                : 'Estrategia seleccionada: ruta mas corta con Dijkstra.'
        );
    };

    const selectToolMode = (nextToolMode) => {
        setToolMode(nextToolMode);
        setSelectedNodeId(null);
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
        setSelectedNodeId(null);
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setSourceNodeId(graph.nodes[0]?.id || '');
        setTargetNodeId(graph.nodes[graph.nodes.length - 1]?.id || '');
        setTotalWeight(null);
        clearErrorToast();
        setMessage(`Grafo aleatorio conectado generado con ${nodeCount} nodos y ${graph.edges.length} aristas.`);
    };

    return {
        graphRef,
        nodes,
        edges,
        resultEdges,
        resultEdgeIds,
        resultNodes,
        resultText,
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
        message,
        errorToast,
        totalWeight,
        setRandomNodeCount,
        setSourceNodeId,
        setTargetNodeId,
        getNodeById,
        getResultNodeById,
        handleDoubleClick,
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
        generateRandomGraph
    };
}
