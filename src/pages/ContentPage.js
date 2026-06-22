import './ContentPage.css';
import { useMemo, useRef, useState } from 'react';

function ContentPage () {
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

    const getResultNodeById = (nodeId) => {
        return resultNodes.find((node) => node.id === nodeId);
    };

    const getPointerPosition = (event) => {
        const rect = graphRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
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
        setMstEdges([]);
        setTotalWeight(null);
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
        setMstEdges([]);
        setTotalWeight(null);
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

    const getNodeById = (nodeId) => {
        return nodes.find((node) => node.id === nodeId);
    };

    const calculatePrim = () => {
        if (nodes.length === 0) {
            setMessage('Agrega nodos antes de calcular el arbol.');
            return;
        }

        if (nodes.length === 1) {
            setMstEdges([]);
            setTotalWeight(0);
            setMessage('El arbol de un solo nodo tiene peso total 0.');
            return;
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
                setMstEdges([]);
                setTotalWeight(null);
                setMessage('No se puede calcular: el grafo no esta conectado.');
                return;
            }

            const nextEdge = candidateEdges[0];
            selectedEdges.push(nextEdge);
            visited.add(visited.has(nextEdge.from) ? nextEdge.to : nextEdge.from);
        }

        const weightSum = selectedEdges.reduce((sum, edge) => sum + edge.weight, 0);

        setMstEdges(selectedEdges);
        setTotalWeight(weightSum);
        setMessage(`Arbol de expansion minima calculado con Prim. Peso total: ${weightSum}.`);
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

    const generateRandomGraph = () => {
        const nodeCount = Math.max(2, Math.min(Number(randomNodeCount) || 2, 20));
        const graphWidth = graphRef.current?.clientWidth || 760;
        const graphHeight = graphRef.current?.clientHeight || 420;
        const margin = 56;
        const centerX = graphWidth / 2;
        const centerY = graphHeight / 2;
        const radiusX = Math.max(Math.min((graphWidth - margin * 2) / 3, 230), 90);
        const radiusY = Math.max(Math.min((graphHeight - margin * 2) / 3, 150), 80);

        const nextNodes = Array.from({ length: nodeCount }, (_, index) => {
            const angle = (Math.PI * 2 * index) / nodeCount;
            const jitterX = Math.random() * 42 - 21;
            const jitterY = Math.random() * 42 - 21;

            return {
                id: index + 1,
                x: centerX + Math.cos(angle) * radiusX + jitterX,
                y: centerY + Math.sin(angle) * radiusY + jitterY
            };
        });

        const nextEdges = [];
        const edgeKeys = new Set();

        const addEdge = (from, to) => {
            const minNode = Math.min(from, to);
            const maxNode = Math.max(from, to);
            const key = `${minNode}-${maxNode}`;

            if (edgeKeys.has(key)) {
                return;
            }

            edgeKeys.add(key);
            nextEdges.push({
                id: nextEdges.length + 1,
                from,
                to,
                weight: Math.floor(Math.random() * 20) + 1
            });
        };

        for (let nodeId = 2; nodeId <= nodeCount; nodeId += 1) {
            const previousNodeId = Math.floor(Math.random() * (nodeId - 1)) + 1;
            addEdge(nodeId, previousNodeId);
        }

        const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
        const extraEdges = Math.min(
            maxPossibleEdges - nextEdges.length,
            Math.floor(nodeCount * 0.7)
        );

        while (nextEdges.length < nodeCount - 1 + extraEdges) {
            const from = Math.floor(Math.random() * nodeCount) + 1;
            const to = Math.floor(Math.random() * nodeCount) + 1;

            if (from !== to) {
                addEdge(from, to);
            }
        }

        setRandomNodeCount(nodeCount);
        setNodes(nextNodes);
        setEdges(nextEdges);
        setMstEdges([]);
        setDragStartNodeId(null);
        setMovingNodeId(null);
        setPreviewPosition(null);
        setTotalWeight(null);
        setMessage(`Grafo aleatorio conectado generado con ${nodeCount} nodos y ${nextEdges.length} aristas.`);
    };

    const previewStartNode = dragStartNodeId ? getNodeById(dragStartNodeId) : null;
    
    return (
        <div className='content-page'>
            <div className='toolbar'>
                <div className='model-summary'>
                    <strong>Modelo (N, A)</strong>
                    <span>N = {`{${nodes.map((node) => node.id).join(', ')}}`}</span>
                    <span>
                        A = {`{${edges.map((edge) => `(${edge.from}, ${edge.to}, ${edge.weight})`).join(', ')}}`}
                    </span>
                </div>
                <div className='actions'>
                    <div className='tool-mode' aria-label='Modo de edicion'>
                        <button
                            type='button'
                            className={toolMode === 'connect' ? 'active-tool' : ''}
                            onClick={() => {
                                setToolMode('connect');
                                setDragStartNodeId(null);
                                setMovingNodeId(null);
                                setPreviewPosition(null);
                                setMessage('Modo crear aristas: arrastra desde un nodo hasta otro.');
                            }}
                        >
                            Crear aristas
                        </button>
                        <button
                            type='button'
                            className={toolMode === 'move' ? 'active-tool' : ''}
                            onClick={() => {
                                setToolMode('move');
                                setDragStartNodeId(null);
                                setMovingNodeId(null);
                                setPreviewPosition(null);
                                setMessage('Modo mover nodos: arrastra un nodo para reubicarlo.');
                            }}
                        >
                            Mover nodos
                        </button>
                    </div>
                    <button type='button' onClick={calculatePrim}>Calcular arbol</button>
                    <button type='button' className='secondary-action' onClick={clearGraph}>Limpiar grafo</button>
                    <div className='random-controls'>
                        <label htmlFor='random-node-count'>Nodos</label>
                        <input
                            id='random-node-count'
                            type='number'
                            min='2'
                            max='20'
                            value={randomNodeCount}
                            onChange={(event) => setRandomNodeCount(event.target.value)}
                        />
                        <button type='button' onClick={generateRandomGraph}>Aleatorio</button>
                    </div>
                </div>
            </div>

            <div className='workspace'>
                <div
                    ref={graphRef}
                    onDoubleClick={handleDoubleClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className='background'
                >
                    <svg className='edge-layer'>
                        {edges.map((edge) => {
                            const fromNode = getNodeById(edge.from);
                            const toNode = getNodeById(edge.to);

                            if (!fromNode || !toNode) {
                                return null;
                            }

                            const middleX = (fromNode.x + toNode.x) / 2;
                            const middleY = (fromNode.y + toNode.y) / 2;
                            const isMstEdge = mstEdgeIds.has(edge.id);

                            return (
                                <g key={edge.id}>
                                    <line
                                        x1={fromNode.x}
                                        y1={fromNode.y}
                                        x2={toNode.x}
                                        y2={toNode.y}
                                        className={isMstEdge ? 'edge mst-edge' : 'edge'}
                                    />
                                    <text
                                        x={middleX}
                                        y={middleY}
                                        className={isMstEdge ? 'edge-weight mst-weight' : 'edge-weight'}
                                    >
                                        {edge.weight}
                                    </text>
                                </g>
                            );
                        })}
                        {previewStartNode && previewPosition && (
                            <line
                                x1={previewStartNode.x}
                                y1={previewStartNode.y}
                                x2={previewPosition.x}
                                y2={previewPosition.y}
                                className='preview-edge'
                            />
                        )}
                    </svg>

                    {nodes.map((node) => (
                        <button
                            key={node.id}
                            type='button'
                            className={
                                dragStartNodeId === node.id || movingNodeId === node.id
                                    ? 'node selected-node'
                                    : 'node'
                            }
                            style={{ left: node.x, top: node.y }}
                            onMouseDown={(event) => handleNodeMouseDown(node.id, event)}
                            onMouseUp={(event) => handleNodeMouseUp(node.id, event)}
                        >
                            {node.id}
                        </button>
                    ))}
                </div>

                <aside className='result-panel'>
                    <div className='result-header'>
                        <strong>Arbol resultado</strong>
                        {totalWeight !== null && <span>Peso: {totalWeight}</span>}
                    </div>

                    {totalWeight === null ? (
                        <div className='empty-result'>
                            Calcula el arbol para ver el resultado.
                        </div>
                    ) : (
                        <svg className='result-graph' viewBox='0 0 320 320' preserveAspectRatio='xMidYMid meet'>
                            {mstEdges.map((edge) => {
                                const fromNode = getResultNodeById(edge.from);
                                const toNode = getResultNodeById(edge.to);

                                if (!fromNode || !toNode) {
                                    return null;
                                }

                                const middleX = (fromNode.resultX + toNode.resultX) / 2;
                                const middleY = (fromNode.resultY + toNode.resultY) / 2;

                                return (
                                    <g key={edge.id}>
                                        <line
                                            x1={fromNode.resultX}
                                            y1={fromNode.resultY}
                                            x2={toNode.resultX}
                                            y2={toNode.resultY}
                                            className='result-edge'
                                        />
                                        <text x={middleX} y={middleY} className='result-weight'>
                                            {edge.weight}
                                        </text>
                                    </g>
                                );
                            })}

                            {resultNodes.map((node) => (
                                <g key={node.id}>
                                    <circle cx={node.resultX} cy={node.resultY} r='18' className='result-node' />
                                    <text x={node.resultX} y={node.resultY} className='result-node-label'>
                                        {node.id}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    )}
                </aside>
            </div>

            <div className='status-bar'>
                <span>{message}</span>
                {totalWeight !== null && <strong>Peso total: {totalWeight}</strong>}
            </div>
        </div>
    )
}

export default ContentPage;
