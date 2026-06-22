import GraphCanvas from './GraphCanvas';
import ResultTreePanel from './ResultTreePanel';

function GraphWorkspace({
    graphRef,
    nodes,
    edges,
    mstEdges,
    mstEdgeIds,
    resultNodes,
    totalWeight,
    dragStartNodeId,
    movingNodeId,
    previewPosition,
    getNodeById,
    getResultNodeById,
    onDoubleClick,
    onMouseMove,
    onMouseUp,
    onNodeMouseDown,
    onNodeMouseUp
}) {
    return (
        <div className='workspace'>
            <GraphCanvas
                graphRef={graphRef}
                nodes={nodes}
                edges={edges}
                mstEdgeIds={mstEdgeIds}
                dragStartNodeId={dragStartNodeId}
                movingNodeId={movingNodeId}
                previewPosition={previewPosition}
                getNodeById={getNodeById}
                onDoubleClick={onDoubleClick}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onNodeMouseDown={onNodeMouseDown}
                onNodeMouseUp={onNodeMouseUp}
            />
            <ResultTreePanel
                resultNodes={resultNodes}
                mstEdges={mstEdges}
                totalWeight={totalWeight}
                getResultNodeById={getResultNodeById}
            />
        </div>
    );
}

export default GraphWorkspace;
