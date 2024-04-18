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