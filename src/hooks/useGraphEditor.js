import { useMemo, useRef, useState } from 'react';
import { calculatePrim as runPrim } from '../utils/graphAlgorithms';
import { generateConnectedRandomGraph } from '../utils/randomGraph';

export function useGraphEditor() {
    const graphRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [mstEdges, setMstEdges] = useState([]);
    const [toolMode, setToolMode] = useState('connect');
    const [dragStartNodeId, setDragStartNodeId] = useState(null);
    const [movingNodeId, setMovingNodeId] = useState(null);
    const [previewPosition, setPreviewPosition] = useState(null);
    const [randomNodeCount, setRandomNodeCount] = useState(6);
    const [message, setMessage] = useState('Doble click para agregar nodos. Arrastra entre nodos para crear aristas.');
    const [totalWeight, setTotalWeight] = useState(null);

    const mstEdgeIds = useMemo(() => new Set(mstEdges.map((edge) => edge.id)), [mstEdges]);

    const resultNodes = useMemo(() => {
        if (nodes.length === 0) {
            return [];
        }

        const resultSize = 320;
        const padding = 46;
        const nodeXs = nodes.map((node) => node.x);
        const nodeYs = nodes.map((node) => node.y);
        const minX = Math.min(...nodeXs);
        const minY = Math.min(...nodeYs);
        const width = Math.max(Math.max(...nodeXs) - minX, 1);
        const height = Math.max(Math.max(...nodeYs) - minY, 1);
        const drawableSize = resultSize - padding * 2;

        return nodes.map((node) => ({
            ...node,
            resultX: padding + ((node.x - minX) / width) * drawableSize,
            resultY: padding + ((node.y - minY) / height) * drawableSize
        }));
    }, [nodes]);

    const getPointerPosition = (event) => {
        const rect = graphRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const getNodeById = (nodeId) => {
        return nodes.find((node) => node.id === nodeId);
    };

    const getResultNodeById = (nodeId) => {
        return resultNodes.find((node) => node.id === nodeId);
    };

    const resetResult = () => {
        setMstEdges([]);
        setTotalWeight(null);
    };

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
        resetResult();
        setMessage(`Nodo ${nextNode.id} agregado.`);
    };

    const handleNodeMouseDown = (nodeId, event) => {
        event.stopPropagation();

        if (toolMode === 'move') {
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
            setMovingNodeId(null);
            setMessage(`Nodo ${targetNodeId} reubicado.`);
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
            setMessage('Ya existe una arista entre esos nodos.');
            setDragStartNodeId(null);
            setPreviewPosition(null);
            return;
        }

        const weightInput = window.prompt(`Peso de la arista ${dragStartNodeId} - ${targetNodeId}:`);
        const weight = Number(weightInput);

        if (!weightInput || Number.isNaN(weight) || weight <= 0) {
            setMessage('La arista no se creo porque el peso debe ser un numero positivo.');
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
        resetResult();
        setMessage(`Arista ${dragStartNodeId} - ${targetNodeId} creada con peso ${weight}.`);
        setDragStartNodeId(null);
        setPreviewPosition(null);
    };

    const handleMouseUp = () => {
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
    };

    const handleMouseMove = (event) => {
        if (movingNodeId) {
            const position = getPointerPosition(event);
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

    const calculateTree = () => {
        const result = runPrim(nodes, edges);

        setMstEdges(result.mstEdges);
        setTotalWeight(result.totalWeight);
        setMessage(result.error || result.message);
    };

    const clearGraph = () => {
        setNodes([]);
        setEdges([]);
        setMstEdges([]);
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setTotalWeight(null);
        setMessage('Grafo limpio. Doble click para agregar nuevos nodos.');
    };

    const selectToolMode = (nextToolMode) => {
        setToolMode(nextToolMode);
        setDragStartNodeId(null);
        setMovingNodeId(null);
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
        setMstEdges([]);
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setTotalWeight(null);
        setMessage(`Grafo aleatorio conectado generado con ${nodeCount} nodos y ${graph.edges.length} aristas.`);
    };

    return {
        graphRef,
        nodes,
        edges,
        mstEdges,
        mstEdgeIds,
        resultNodes,
        toolMode,
        dragStartNodeId,
        movingNodeId,
        previewPosition,
        randomNodeCount,
        message,
        totalWeight,
        setRandomNodeCount,
        getNodeById,
        getResultNodeById,
        handleDoubleClick,
        handleNodeMouseDown,
        handleNodeMouseUp,
        handleMouseUp,
        handleMouseMove,
        calculateTree,
        clearGraph,
        selectToolMode,
        generateRandomGraph
    };
}
