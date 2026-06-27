function HowToPanel() {
    return (
        <section className='how-to-panel' aria-labelledby='how-to-title'>
            <div className='how-to-heading'>
                <h3 id='how-to-title'>Cómo usar la aplicación</h3>
                <span>Guía rápida</span>
            </div>
            <div className='how-to-grid'>
                <article>
                    <strong>1. Construir el grafo</strong>
                    <p>Doble click en el lienzo para agregar nodos. En modo Crear aristas, arrastrá desde un nodo hacia otro y asigná el peso.</p>
                </article>
                <article>
                    <strong>2. Editar nodos y aristas</strong>
                    <p>Usá Mover nodos para reubicarlos. Soltá un nodo sobre el tacho para eliminarlo, o seleccionalo y presioná Supr. Doble click en una arista para cambiar su peso.</p>
                </article>
                <article>
                    <strong>3. Calcular resultados</strong>
                    <p>Elegí el algoritmo. Para Dijkstra, seleccioná origen y destino. Luego presioná Calcular o Enter para ver el resultado.</p>
                </article>
                <article>
                    <strong>Atajos</strong>
                    <p>Espacio alterna entre Crear aristas y Mover nodos. Enter calcula la estrategia actual.</p>
                </article>
            </div>
        </section>
    );
}

export default HowToPanel;
