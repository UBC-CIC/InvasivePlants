import axios from "axios";

// Delete data from database 
export const deleteDataFromDatabase = (path, deleteId, user, setCount, setShouldReset, setOpenDeleteConfirmation) => {
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (deleteId) {
        axios
            .delete(`${process.env.REACT_APP_API_BASE_URL}${path}/${deleteId}`,
                {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
            .then(() => {
                setCount(prevCount => prevCount - 1)
                setShouldReset(true);
                setOpenDeleteConfirmation(false);
            })
            .catch((error) => {
                console.error("Error deleting row", error);
            })
    } else {
        setOpenDeleteConfirmation(false);
    }
}
