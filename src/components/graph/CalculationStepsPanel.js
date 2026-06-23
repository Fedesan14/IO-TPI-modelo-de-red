function CalculationStepsPanel({ steps, strategy }) {
    const title = strategy === 'prim'
        ? 'Paso a paso - Prim'
        : strategy === 'kruskal'
            ? 'Paso a paso - Kruskal'
            : 'Paso a paso - Dijkstra';

    return (
        <section className='calculation-steps-panel' aria-label='Paso a paso del calculo'>
            <div className='calculation-steps-header'>
                <h3>{title}</h3>
                <span>{steps.length ? `${steps.length} pasos` : 'Sin calculo'}</span>
            </div>

            {steps.length === 0 ? (
                <p className='empty-steps'>Calcula una estrategia para ver el desarrollo del algoritmo.</p>
            ) : (
                <ol className='calculation-steps-list'>
                    {steps.map((step, index) => (
                        <li key={`${step.title}-${index}`}>
                            <strong>{step.title}</strong>
                            <ul>
                                {step.details.map((detail, detailIndex) => (
                                    <li key={`${step.title}-${detailIndex}`}>{detail}</li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

export default CalculationStepsPanel;
