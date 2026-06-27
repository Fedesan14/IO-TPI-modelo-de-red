function GraphCanvas({
    graphRef,
    nodes,
    edges,
    resultEdgeIds,
    selectedNodeId,
    dragStartNodeId,
    movingNodeId,
    isOverTrash,
    previewPosition,
    getNodeById,
    onDoubleClick,
    onBackgroundPointerDown,
    onBackgroundPointerUp,
    onMouseMove,
    onNodeMouseDown,
    onNodeMouseUp,
    onEdgeDoubleClick
}) {
    const previewStartNode = dragStartNodeId ? getNodeById(dragStartNodeId) : null;
    const showTrashDropZone = Boolean(movingNodeId);
    const handleEdgePointerUp = (edgeId, event) => {
        event.stopPropagation();

        if (event.pointerType === 'mouse' || dragStartNodeId || movingNodeId) {
            return;
        }

        onEdgeDoubleClick(edgeId);
    };

    return (
        <div
            ref={graphRef}
            onDoubleClick={onDoubleClick}
            onPointerDown={onBackgroundPointerDown}
            onPointerMove={onMouseMove}
            onPointerUp={onBackgroundPointerUp}
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
                    const isResultEdge = resultEdgeIds.has(edge.id);

                    return (
                        <g key={edge.id}>
                            <line
                                x1={fromNode.x}
                                y1={fromNode.y}
                                x2={toNode.x}
                                y2={toNode.y}
                                className='edge-hitbox'
                                onPointerUp={(event) => handleEdgePointerUp(edge.id, event)}
                                onDoubleClick={(event) => {
                                    event.stopPropagation();
                                    onEdgeDoubleClick(edge.id);
                                }}
                            />
                            <line
                                x1={fromNode.x}
                                y1={fromNode.y}
                                x2={toNode.x}
                                y2={toNode.y}
                                className={isResultEdge ? 'edge mst-edge' : 'edge'}
                            />
                            <text
                                x={middleX}
                                y={middleY}
                                className={isResultEdge ? 'edge-weight mst-weight' : 'edge-weight'}
                                onPointerUp={(event) => handleEdgePointerUp(edge.id, event)}
                                onDoubleClick={(event) => {
                                    event.stopPropagation();
                                    onEdgeDoubleClick(edge.id);
                                }}
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

            {showTrashDropZone && (
                <div className={isOverTrash ? 'trash-drop-zone trash-drop-zone-active' : 'trash-drop-zone'}>
                    <span className='trash-can' aria-hidden='true'>
                        <span className='trash-can-lid' />
                        <span className='trash-can-body'>
                            <span />
                            <span />
                            <span />
                        </span>
                    </span>
                    <span>Soltar para eliminar</span>
                </div>
            )}

            {nodes.map((node) => (
                <button
                    key={node.id}
                    type='button'
                    className={
                        dragStartNodeId === node.id || movingNodeId === node.id
                            || selectedNodeId === node.id
                            ? 'node selected-node'
                            : 'node'
                    }
                    style={{ left: node.x, top: node.y }}
                    onPointerDown={(event) => onNodeMouseDown(node.id, event)}
                    onPointerUp={(event) => onNodeMouseUp(node.id, event)}
                >
                    {node.id}
                </button>
            ))}
        </div>
    );
}

export default GraphCanvas;
