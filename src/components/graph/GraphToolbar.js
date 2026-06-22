function GraphToolbar({
    nodes,
    edges,
    toolMode,
    strategy,
    sourceNodeId,
    targetNodeId,
    randomNodeCount,
    onSelectToolMode,
    onSelectStrategy,
    onSourceNodeChange,
    onTargetNodeChange,
    onRandomNodeCountChange,
    onCalculateResult,
    onClearGraph,
    onGenerateRandomGraph
}) {
    return (
        <div className='toolbar'>
            <div className='model-summary'>
                <strong>Modelo (N, A)</strong>
                <span>N = {`{${nodes.map((node) => node.id).join(', ')}}`}</span>
                <span>
                    A = {`{${edges.map((edge) => `(${edge.from}, ${edge.to}, ${edge.weight})`).join(', ')}}`}
                </span>
            </div>
            <div className='actions'>
                <div className='strategy-controls'>
                    <label htmlFor='strategy-select'>Estrategia</label>
                    <select
                        id='strategy-select'
                        value={strategy}
                        onChange={(event) => onSelectStrategy(event.target.value)}
                    >
                        <option value='prim'>Arbol minimo - Prim</option>
                        <option value='dijkstra'>Ruta mas corta - Dijkstra</option>
                    </select>
                </div>
                {strategy === 'dijkstra' && (
                    <div className='path-controls'>
                        <label htmlFor='source-node'>Origen</label>
                        <select
                            id='source-node'
                            value={sourceNodeId}
                            onChange={(event) => onSourceNodeChange(event.target.value)}
                        >
                            <option value=''>-</option>
                            {nodes.map((node) => (
                                <option key={node.id} value={node.id}>{node.id}</option>
                            ))}
                        </select>
                        <label htmlFor='target-node'>Destino</label>
                        <select
                            id='target-node'
                            value={targetNodeId}
                            onChange={(event) => onTargetNodeChange(event.target.value)}
                        >
                            <option value=''>-</option>
                            {nodes.map((node) => (
                                <option key={node.id} value={node.id}>{node.id}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className='tool-mode' aria-label='Modo de edicion'>
                    <button
                        type='button'
                        className={toolMode === 'connect' ? 'active-tool' : ''}
                        onClick={() => onSelectToolMode('connect')}
                    >
                        Crear aristas
                    </button>
                    <button
                        type='button'
                        className={toolMode === 'move' ? 'active-tool' : ''}
                        onClick={() => onSelectToolMode('move')}
                    >
                        Mover nodos
                    </button>
                </div>
                <button type='button' onClick={onCalculateResult}>Calcular</button>
                <button type='button' className='secondary-action' onClick={onClearGraph}>Limpiar grafo</button>
                <div className='random-controls'>
                    <label htmlFor='random-node-count'>Nodos</label>
                    <input
                        id='random-node-count'
                        type='number'
                        min='2'
                        max='20'
                        value={randomNodeCount}
                        onChange={(event) => onRandomNodeCountChange(event.target.value)}
                    />
                    <button type='button' onClick={onGenerateRandomGraph}>Aleatorio</button>
                </div>
            </div>
        </div>
    );
}

export default GraphToolbar;
