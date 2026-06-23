import GraphCanvas from './GraphCanvas';
import ResultTreePanel from './ResultTreePanel';

function GraphWorkspace({
    graphRef,
    nodes,
    edges,
    resultEdges,
    resultEdgeIds,
    resultNodes,
    resultText,
    alternativeResultText,
    strategy,
    totalWeight,
    selectedNodeId,
    dragStartNodeId,
    movingNodeId,
    isOverTrash,
    previewPosition,
    getNodeById,
    getResultNodeById,
    onDoubleClick,
    onMouseMove,
    onMouseUp,
    onNodeMouseDown,
    onNodeMouseUp,
    onEdgeDoubleClick
}) {
    return (
        <div className='workspace'>
            <GraphCanvas
                graphRef={graphRef}
                nodes={nodes}
                edges={edges}
                resultEdgeIds={resultEdgeIds}
                selectedNodeId={selectedNodeId}
                dragStartNodeId={dragStartNodeId}
                movingNodeId={movingNodeId}
                isOverTrash={isOverTrash}
                previewPosition={previewPosition}
                getNodeById={getNodeById}
                onDoubleClick={onDoubleClick}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onNodeMouseDown={onNodeMouseDown}
                onNodeMouseUp={onNodeMouseUp}
                onEdgeDoubleClick={onEdgeDoubleClick}
            />
            <ResultTreePanel
                resultNodes={resultNodes}
                resultEdges={resultEdges}
                resultText={resultText}
                alternativeResultText={alternativeResultText}
                strategy={strategy}
                totalWeight={totalWeight}
                getResultNodeById={getResultNodeById}
            />
        </div>
    );
}

export default GraphWorkspace;
