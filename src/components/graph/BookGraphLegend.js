function BookGraphLegend({ reference }) {
    if (!reference) {
        return null;
    }

    const pageText = reference.page ? ` Pagina ${reference.page},` : '';

    return (
        <section className='book-graph-legend' aria-label='Referencia del grafo de libro'>
            <strong>Referencia del grafo</strong>
            <span>
                {reference.book}, {reference.author}.{pageText} ejercicio "{reference.exercise}".
            </span>
        </section>
    );
}

export default BookGraphLegend;
