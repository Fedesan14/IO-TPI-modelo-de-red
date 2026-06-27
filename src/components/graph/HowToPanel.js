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
                    <p>Doble click o toque en el lienzo para agregar nodos. Toca un nodo y luego otro para crear una arista y asignar el peso.</p>
                </article>
                <article>
                    <strong>2. Editar nodos y aristas</strong>
                    <p>Mantené apretado un nodo para reubicarlo. Soltalo sobre el tacho para eliminarlo, o seleccionalo y presioná Supr. Doble click o toque en una arista para cambiar su peso.</p>
                </article>
                <article>
                    <strong>3. Calcular resultados</strong>
                    <p>Elegí el algoritmo. Para Dijkstra, seleccioná origen y destino. Luego presioná Calcular o Enter para ver el resultado.</p>
                </article>
                <article>
                    <strong>Atajos</strong>
                    <p>Enter calcula la estrategia actual. Supr elimina el nodo seleccionado.</p>
                </article>
            </div>
        </section>
    );
}

export default HowToPanel;
