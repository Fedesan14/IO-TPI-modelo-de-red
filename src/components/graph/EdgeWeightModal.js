function EdgeWeightModal({
    modal,
    onValueChange,
    onSubmit,
    onClose
}) {
    if (!modal) {
        return null;
    }

    return (
        <div className='modal-backdrop' role='presentation'>
            <form
                className='edge-weight-modal'
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <div className='modal-header'>
                    <div>
                        <h3>{modal.title}</h3>
                        <span>Arista {modal.sourceNodeId} - {modal.targetNodeId}</span>
                    </div>
                    <button type='button' className='modal-close' onClick={onClose} aria-label='Cerrar'>
                        x
                    </button>
                </div>

                <label htmlFor='edge-weight-input'>Peso</label>
                <input
                    id='edge-weight-input'
                    type='number'
                    min='1'
                    step='any'
                    inputMode='decimal'
                    value={modal.value}
                    onChange={(event) => onValueChange(event.target.value)}
                    autoFocus
                />
                {modal.error && <p className='modal-error'>{modal.error}</p>}

                <div className='modal-actions'>
                    <button type='button' className='secondary-action' onClick={onClose}>Cancelar</button>
                    <button type='submit'>{modal.submitLabel}</button>
                </div>
            </form>
        </div>
    );
}

export default EdgeWeightModal;
