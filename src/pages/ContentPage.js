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
                randomNodeCount={graphEditor.randomNodeCount}
                onSelectToolMode={graphEditor.selectToolMode}
                onRandomNodeCountChange={graphEditor.setRandomNodeCount}
                onCalculateTree={graphEditor.calculateTree}
                onClearGraph={graphEditor.clearGraph}
                onGenerateRandomGraph={graphEditor.generateRandomGraph}
            />

            <GraphWorkspace
                graphRef={graphEditor.graphRef}
                nodes={graphEditor.nodes}
                edges={graphEditor.edges}
                mstEdges={graphEditor.mstEdges}
                mstEdgeIds={graphEditor.mstEdgeIds}
                resultNodes={graphEditor.resultNodes}
                totalWeight={graphEditor.totalWeight}
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
            />

            <StatusBar
                message={graphEditor.message}
                totalWeight={graphEditor.totalWeight}
            />
        </div>
    )
}

export default ContentPage;
