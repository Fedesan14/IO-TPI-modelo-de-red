import './ContentPage.css';
import { useMemo, useRef, useState } from 'react';

function ContentPage () {
    const graphRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [mstEdges, setMstEdges] = useState([]);
    const [dragStartNodeId, setDragStartNodeId] = useState(null);
    const [message, setMessage] = useState('Doble click para agregar nodos. Arrastra entre nodos para crear aristas.');
    const [totalWeight, setTotalWeight] = useState(null);

    const mstEdgeIds = useMemo(() => new Set(mstEdges.map((edge) => edge.id)), [mstEdges]);

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
        setDragStartNodeId(nodeId);
    };

    const handleNodeMouseUp = (targetNodeId, event) => {
        event.stopPropagation();

        if (!dragStartNodeId || dragStartNodeId === targetNodeId) {
            setDragStartNodeId(null);
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
            return;
        }

        const weightInput = window.prompt(`Peso de la arista ${dragStartNodeId} - ${targetNodeId}:`);
        const weight = Number(weightInput);

        if (!weightInput || Number.isNaN(weight) || weight <= 0) {
            setMessage('La arista no se creo porque el peso debe ser un numero positivo.');
            setDragStartNodeId(null);
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
    };

    const handleMouseUp = () => {
        setDragStartNodeId(null);
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
        setTotalWeight(null);
        setMessage('Grafo limpio. Doble click para agregar nuevos nodos.');
    };
    
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
                    <button type='button' onClick={calculatePrim}>Calcular arbol</button>
                    <button type='button' onClick={clearGraph}>Limpiar grafo</button>
                </div>
            </div>

            <div
                ref={graphRef}
                onDoubleClick={handleDoubleClick}
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
                </svg>

                {nodes.map((node) => (
                    <button
                        key={node.id}
                        type='button'
                        className={dragStartNodeId === node.id ? 'node selected-node' : 'node'}
                        style={{ left: node.x, top: node.y }}
                        onMouseDown={(event) => handleNodeMouseDown(node.id, event)}
                        onMouseUp={(event) => handleNodeMouseUp(node.id, event)}
                    >
                        {node.id}
                    </button>
                ))}
            </div>

            <div className='status-bar'>
                <span>{message}</span>
                {totalWeight !== null && <strong>Peso total: {totalWeight}</strong>}
            </div>
        </div>
    )
}

export default ContentPage;
