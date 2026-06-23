function BookGraphLegend({ reference }) {
    if (!reference) {
        return null;
    }

    return (
        <section className='book-graph-legend' aria-label='Referencia del grafo de libro'>
            <strong>Referencia del grafo</strong>
            <span>
                {reference.book}, {reference.author}. Página {reference.page}, ejercicio "{reference.exercise}".
            </span>
        </section>
    );
}

export default BookGraphLegend;
