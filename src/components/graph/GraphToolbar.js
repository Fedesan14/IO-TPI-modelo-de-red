function GraphToolbar({
    nodes,
    edges,
    toolMode,
    randomNodeCount,
    onSelectToolMode,
    onRandomNodeCountChange,
    onCalculateTree,
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
                <button type='button' onClick={onCalculateTree}>Calcular arbol</button>
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
