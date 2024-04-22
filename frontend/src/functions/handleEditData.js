import axios from "axios";

// Update database with new data
export const updateDataToDatabase = (path, id, formattedData, jwtToken, handleGetData, handleFinishEditingRow, setOpenEditSpeciesDialog) => {
    axios
        .put(`${process.env.REACT_APP_API_BASE_URL}${path}/${id}`, formattedData, {
            headers: {
                'Authorization': `${jwtToken}`
            }
        })
        .then(() => {
            handleGetData();
            handleFinishEditingRow(setOpenEditSpeciesDialog);
        })
        .catch((error) => {
            console.error("Error updating data", error);
        });
}

// Updates editing states when editing a region
export const handleEditRow = (setTempEditingData, setOpenEditDialog, rowData) => {
    setTempEditingData(rowData);
    setOpenEditDialog(true);
};

// Updates states after editing a region and saving 
export const handleFinishEditingRow = (setOpenEditDialog) => {
    setOpenEditDialog(false);
};