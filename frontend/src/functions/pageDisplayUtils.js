// Gets data when Enter key is pressed
export function handleKeyPress(event, getData) {
    if (event.key === 'Enter') {
        getData();
    }
};

// Reset page states
export function resetStates(setCurrOffset, setPage, setStart, setEnd, setShouldCalculate) {
    setCurrOffset(0);
    setPage(0);
    setStart(0);
    setEnd(0);
    setShouldCalculate(true);
}

// Sets display data
export function updateData(setDataCount, setDisplayData, setData, setCurrOffset, responseData, formattedData) {
    setDataCount(responseData.count[0].count);
    setCurrOffset(responseData.nextOffset);

    setDisplayData(formattedData);
    setData(formattedData);
}

// Returns true if the next button should be disabled
export const checkNextButtonDisabled = (displayData, rowsPerPage) => {
    return displayData.length === 0 || displayData.length < rowsPerPage;
};

// Increments the page count by 1 
export const handleNextPage = (setPage, page) => {
    setPage(page + 1);
};

// Handles states when going to a previous page
export const handlePreviousPage = (displayData, rowsPerPage, setCurrOffset, regionId, searchInput, page, setPage) => {
    if (displayData.length === rowsPerPage) {
        setCurrOffset(curr => curr - rowsPerPage * 2);
    } else if (displayData.length < rowsPerPage && (regionId === "" || regionId === null) && searchInput === "") {
        setCurrOffset(curr => curr - displayData.length - rowsPerPage);
    }
    setPage(page - 1);
};

// Calculates start and end species indices of the current page of displayed data
export const calculateStartAndEnd = (page, rowsPerPage, displayData, setStart, setEnd) => {
    const newStart = page * rowsPerPage + 1;
    const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
    setStart(newStart);
    setEnd(newEnd);
};

// updates pagination start and end indices after search
export const updatePaginationAfterSearch = (type, setShouldCalculate, setDisplayData, response, setStart, setEnd, setIsLoading) => {
    setShouldCalculate(false);
    setDisplayData(response.formattedData);
    response.formattedData.length > 0 ? setStart(1) : setStart(0);
    if (type === "species") {
        setEnd(response.responseData.species.length);
    } else if (type === "region") {
        setEnd(response.responseData.regions.length);
    }
    setIsLoading(false);
}