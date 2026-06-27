import CalculationStepsPanel from '../components/graph/CalculationStepsPanel';
import BookGraphLegend from '../components/graph/BookGraphLegend';
import GraphToolbar from '../components/graph/GraphToolbar';
import GraphWorkspace from '../components/graph/GraphWorkspace';
import ErrorToast from '../components/graph/ErrorToast';
import HowToPanel from '../components/graph/HowToPanel';
import ModelPanel from '../components/graph/ModelPanel';
import { useGraphEditor } from '../hooks/useGraphEditor';
import './ContentPage.css';

function ContentPage () {
    const graphEditor = useGraphEditor();

    return (
        <div className='content-page'>
            <HowToPanel />

            <GraphToolbar
                nodes={graphEditor.nodes}
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
                onGenerateBookGraph={graphEditor.generateBookGraphExample}
            />

            <BookGraphLegend reference={graphEditor.bookGraphReference} />

            <GraphWorkspace
                graphRef={graphEditor.graphRef}
                nodes={graphEditor.nodes}
                edges={graphEditor.edges}
                resultEdges={graphEditor.resultEdges}
                resultEdgeIds={graphEditor.resultEdgeIds}
                resultNodes={graphEditor.resultNodes}
                resultText={graphEditor.resultText}
                alternativeResultText={graphEditor.alternativeResultText}
                strategy={graphEditor.strategy}
                totalWeight={graphEditor.totalWeight}
                selectedNodeId={graphEditor.selectedNodeId}
                dragStartNodeId={graphEditor.dragStartNodeId}
                movingNodeId={graphEditor.movingNodeId}
                isOverTrash={graphEditor.isOverTrash}
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

            <ModelPanel
                nodes={graphEditor.nodes}
                edges={graphEditor.edges}
            />

            <CalculationStepsPanel
                steps={graphEditor.calculationSteps}
                strategy={graphEditor.strategy}
            />

            <ErrorToast
                toast={graphEditor.errorToast}
                onClose={graphEditor.clearErrorToast}
            />
        </div>
    )
}

export default ContentPage;
