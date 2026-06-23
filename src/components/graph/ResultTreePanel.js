function ResultTreePanel({
    resultNodes,
    resultEdges,
    resultText,
    alternativeResultText,
    strategy,
    totalWeight,
    getResultNodeById
}) {
    const isTreeStrategy = strategy === 'prim' || strategy === 'kruskal';
    const title = isTreeStrategy ? 'Arbol resultado' : 'Ruta resultado';
    const emptyMessage = isTreeStrategy
        ? 'Calcula el arbol para ver el resultado.'
        : 'Calcula la ruta para ver el resultado.';
    const graphPadding = 48;
    const graphWidth = Math.max(
        320,
        ...resultNodes.map((node) => node.resultX + graphPadding)
    );
    const graphHeight = Math.max(
        320,
        ...resultNodes.map((node) => node.resultY + graphPadding)
    );

    return (
        <aside className='result-panel'>
            <div className='result-header'>
                <strong>{title}</strong>
                {totalWeight !== null && <span>Peso: {totalWeight}</span>}
            </div>
            {totalWeight !== null && resultText && (
                <div className='result-summary'>
                    <span>{resultText}</span>
                    {alternativeResultText && <span className='alternative-result'>{alternativeResultText}</span>}
                </div>
            )}

            {totalWeight === null ? (
                <div className='empty-result'>
                    {emptyMessage}
                </div>
            ) : (
                <svg className='result-graph' viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio='xMidYMid meet'>
                    {resultEdges.map((edge) => {
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
    );
}

export default ResultTreePanel;
