import axios from "axios";

// Adds data from database 
export const addDataToDatabase = (path, data, jwtToken, setCurrOffset, setShouldReset, setOpenAddDialog) => {
    axios
        .post(`${process.env.REACT_APP_API_BASE_URL}${path}`, data, {
            headers: {
                'Authorization': `${jwtToken}`
            }
        })
        .then(() => {
            setCurrOffset(0)
            setShouldReset(true);
            setOpenAddDialog(false);
        })
        .catch((error) => {
            console.error("Error adding data", error);
        });
}