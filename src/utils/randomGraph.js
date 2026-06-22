export function generateConnectedRandomGraph({ nodeCount, width, height }) {
    const graphWidth = width || 760;
    const graphHeight = height || 420;
    const margin = 56;
    const centerX = graphWidth / 2;
    const centerY = graphHeight / 2;
    const radiusX = Math.max(Math.min((graphWidth - margin * 2) / 3, 230), 90);
    const radiusY = Math.max(Math.min((graphHeight - margin * 2) / 3, 150), 80);

    const nodes = Array.from({ length: nodeCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / nodeCount;
        const jitterX = Math.random() * 42 - 21;
        const jitterY = Math.random() * 42 - 21;

        return {
            id: index + 1,
            x: centerX + Math.cos(angle) * radiusX + jitterX,
            y: centerY + Math.sin(angle) * radiusY + jitterY
        };
    });

    const edges = [];
    const edgeKeys = new Set();

    const addEdge = (from, to) => {
        const minNode = Math.min(from, to);
        const maxNode = Math.max(from, to);
        const key = `${minNode}-${maxNode}`;

        if (edgeKeys.has(key)) {
            return;
        }

        edgeKeys.add(key);
        edges.push({
            id: edges.length + 1,
            from,
            to,
            weight: Math.floor(Math.random() * 20) + 1
        });
    };

    for (let nodeId = 2; nodeId <= nodeCount; nodeId += 1) {
        const previousNodeId = Math.floor(Math.random() * (nodeId - 1)) + 1;
        addEdge(nodeId, previousNodeId);
    }

    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    const extraEdges = Math.min(
        maxPossibleEdges - edges.length,
        Math.floor(nodeCount * 0.7)
    );

    while (edges.length < nodeCount - 1 + extraEdges) {
        const from = Math.floor(Math.random() * nodeCount) + 1;
        const to = Math.floor(Math.random() * nodeCount) + 1;

        if (from !== to) {
            addEdge(from, to);
        }
    }

    return { nodes, edges };
}
