function ModelPanel({ nodes, edges }) {
    const nodeSet = nodes.length
        ? `{${nodes.map((node) => node.id).join(', ')}}`
        : '{}';
    const edgeSet = edges.length
        ? `{${edges.map((edge) => `(${edge.from}, ${edge.to}, ${edge.weight})`).join(', ')}}`
        : '{}';

    return (
        <section className='model-panel' aria-label='Modelo del grafo'>
            <div>
                <h3>Modelo (N, A)</h3>
                <span>{nodes.length} nodos · {edges.length} aristas</span>
            </div>
            <div className='model-sets'>
                <p>
                    <strong>N</strong>
                    <span>{nodeSet}</span>
                </p>
                <p>
                    <strong>A</strong>
                    <span>{edgeSet}</span>
                </p>
            </div>
        </section>
    );
}

export default ModelPanel;
