import GraphToolbar from '../components/graph/GraphToolbar';
import GraphWorkspace from '../components/graph/GraphWorkspace';
import StatusBar from '../components/graph/StatusBar';
import { useGraphEditor } from '../hooks/useGraphEditor';
import './ContentPage.css';

function ContentPage () {
    const graphEditor = useGraphEditor();

    return (
        <div className='content-page'>
            <GraphToolbar
                nodes={graphEditor.nodes}
                edges={graphEditor.edges}
                toolMode={graphEditor.toolMode}
                strategy={graphEditor.strategy}
                sourceNodeId={graphEditor.sourceNodeId}
                targetNodeId={graphEditor.targetNodeId}
                randomNodeCount={graphEditor.randomNodeCount}
                onSelectToolMode={graphEditor.selectToolMode}
                onSelectStrategy={graphEditor.selectStrategy}
                onSourceNodeChange={graphEditor.setSourceNodeId}
                onTargetNodeChange={graphEditor.setTargetNodeId}
                onRandomNodeCountChange={graphEditor.setRandomNodeCount}
                onCalculateResult={graphEditor.calculateResult}
                onClearGraph={graphEditor.clearGraph}
                onGenerateRandomGraph={graphEditor.generateRandomGraph}
            />

            <GraphWorkspace
                graphRef={graphEditor.graphRef}
                nodes={graphEditor.nodes}
                edges={graphEditor.edges}
                resultEdges={graphEditor.resultEdges}
                resultEdgeIds={graphEditor.resultEdgeIds}
                resultNodes={graphEditor.resultNodes}
                strategy={graphEditor.strategy}
                totalWeight={graphEditor.totalWeight}
                selectedNodeId={graphEditor.selectedNodeId}
                dragStartNodeId={graphEditor.dragStartNodeId}
                movingNodeId={graphEditor.movingNodeId}
                previewPosition={graphEditor.previewPosition}
                getNodeById={graphEditor.getNodeById}
                getResultNodeById={graphEditor.getResultNodeById}
                onDoubleClick={graphEditor.handleDoubleClick}
                onMouseMove={graphEditor.handleMouseMove}
                onMouseUp={graphEditor.handleMouseUp}
                onNodeMouseDown={graphEditor.handleNodeMouseDown}
                onNodeMouseUp={graphEditor.handleNodeMouseUp}
                onEdgeDoubleClick={graphEditor.updateEdgeWeight}
            />

            <StatusBar
                message={graphEditor.message}
                totalWeight={graphEditor.totalWeight}
            />
        </div>
    )
}

export default ContentPage;
