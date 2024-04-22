// Dropdown for rows per page selection
export const RowsPerPageDropdown = ({ rowsPerPage, rowsPerPageOptions, setRowsPerPage, dataCount }) => {
    // Smallest rowsPerPageOptions may be greater than number of rows available
    if (rowsPerPageOptions[0] > dataCount) {
        rowsPerPageOptions = [dataCount]
    }

    return (
        <div>
            <span style={{ marginRight: '10px' }}>Rows per page:</span>
            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}