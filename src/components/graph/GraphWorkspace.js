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
    movingNodeId,
    isOverTrash,
    getNodeById,
    getResultNodeById,
    onDoubleClick,
    onBackgroundPointerDown,
    onBackgroundPointerUp,
    onMouseMove,
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
                movingNodeId={movingNodeId}
                isOverTrash={isOverTrash}
                getNodeById={getNodeById}
                onDoubleClick={onDoubleClick}
                onBackgroundPointerDown={onBackgroundPointerDown}
                onBackgroundPointerUp={onBackgroundPointerUp}
                onMouseMove={onMouseMove}
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
