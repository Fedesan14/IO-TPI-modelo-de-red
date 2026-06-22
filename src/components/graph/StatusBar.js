function StatusBar({ message, totalWeight }) {
    return (
        <div className='status-bar'>
            <span>{message}</span>
            {totalWeight !== null && <strong>Peso total: {totalWeight}</strong>}
        </div>
    );
}

export default StatusBar;
