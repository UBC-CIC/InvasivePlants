import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

// previous and next buttons for pagination, displays current species (number) slice, and number of species
const PaginationComponent = ({ start, end, count, page, handlePreviousPage, handleNextPage, disabled }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px', marginLeft: "30px" }}>{`${start}-${end} of ${count}`}</span>
            <IconButton onClick={handlePreviousPage} disabled={page === 0}>
                <NavigateBeforeIcon />
            </IconButton>
            <IconButton onClick={handleNextPage} disabled={disabled}>
                <NavigateNextIcon />
            </IconButton>
        </div>
    );
};

export default PaginationComponent;
