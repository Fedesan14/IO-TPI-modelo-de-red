export const bookGraphOptions = [
    {
        id: 'lauderdaleConstruction',
        label: 'Lauderdale Construction'
    },
    {
        id: 'resolvedProblem11-1',
        label: 'Problema resuelto 11-1'
    },
    {
        id: 'dijkstraSlidesExercise',
        label: 'Dijkstra - Catedra IO'
    }
];

export function getRandomBookGraphId() {
    const randomIndex = Math.floor(Math.random() * bookGraphOptions.length);
    return bookGraphOptions[randomIndex].id;
}

const bookGraphDefinitions = {
    lauderdaleConstruction: {
        name: 'Red para Lauderdale Construction',
        reference: {
            book: 'Metodos cuantitativos para los negocios',
            author: 'Barry Render',
            page: 431,
            exercise: 'Red para Lauderdale Construction'
        },
        nodes: [
            { id: 1, x: 0.12, y: 0.32 },
            { id: 2, x: 0.34, y: 0.16 },
            { id: 3, x: 0.34, y: 0.38 },
            { id: 4, x: 0.34, y: 0.62 },
            { id: 5, x: 0.58, y: 0.22 },
            { id: 6, x: 0.58, y: 0.62 },
            { id: 7, x: 0.78, y: 0.34 },
            { id: 8, x: 0.88, y: 0.56 }
        ],
        edges: [
            [1, 2, 3],
            [2, 3, 3],
            [1, 3, 2],
            [1, 4, 5],
            [3, 4, 2],
            [2, 5, 3],
            [5, 3, 5],
            [3, 6, 3],
            [4, 6, 6],
            [3, 7, 7],
            [5, 7, 4],
            [7, 8, 2],
            [6, 8, 1]
        ]
    },
    'resolvedProblem11-1': {
        name: 'Problema resuelto 11-1',
        reference: {
            book: 'Metodos cuantitativos para los negocios',
            author: 'Barry Render',
            page: 445,
            exercise: 'Problema resuelto 11-1'
        },
        nodes: [
            { id: 1, x: 0.10, y: 0.42 },
            { id: 2, x: 0.30, y: 0.20 },
            { id: 3, x: 0.30, y: 0.42 },
            { id: 4, x: 0.30, y: 0.66 },
            { id: 5, x: 0.58, y: 0.16 },
            { id: 6, x: 0.56, y: 0.42 },
            { id: 7, x: 0.70, y: 0.66 },
            { id: 8, x: 0.88, y: 0.42 }
        ],
        edges: [
            [1, 2, 10],
            [1, 3, 8],
            [1, 4, 12],
            [2, 5, 12],
            [2, 6, 18],
            [3, 6, 15],
            [4, 6, 12],
            [4, 7, 8],
            [6, 7, 10],
            [6, 5, 10],
            [5, 8, 13],
            [6, 8, 9],
            [8, 7, 14]
        ]
    },
    dijkstraSlidesExercise: {
        name: 'Ejercicio del algoritmo de Dijkstra',
        reference: {
            book: 'Diapositiva Modelo de Red',
            author: 'Catedra Investigacion Operativa UTN FRVM',
            page: 11,
            exercise: 'Ejercicio del algoritmo de Dijkstra'
        },
        nodes: [
            { id: 1, x: 0.12, y: 0.42 },
            { id: 2, x: 0.34, y: 0.22 },
            { id: 3, x: 0.34, y: 0.62 },
            { id: 4, x: 0.58, y: 0.18 },
            { id: 5, x: 0.58, y: 0.46 },
            { id: 6, x: 0.84, y: 0.34 }
        ],
        edges: [
            [1, 2, 4],
            [1, 3, 3],
            [2, 5, 2],
            [3, 5, 3],
            [2, 4, 3],
            [4, 6, 2],
            [5, 6, 2]
        ]
    }
};

export function generateBookGraph({ graphId = bookGraphOptions[0].id, width, height }) {
    const graphWidth = width || 760;
    const graphHeight = height || 420;
    const margin = 60;
    const definition = bookGraphDefinitions[graphId] || bookGraphDefinitions[bookGraphOptions[0].id];

    return {
        name: definition.name,
        reference: definition.reference,
        nodes: definition.nodes.map((node) => ({
            id: node.id,
            x: margin + node.x * (graphWidth - margin * 2),
            y: margin + node.y * (graphHeight - margin * 2)
        })),
        edges: definition.edges.map(([from, to, weight], index) => ({
            id: index + 1,
            from,
            to,
            weight
        }))
    };
}
