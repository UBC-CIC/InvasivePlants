import { getSignedRequest } from "./getSignedRequest";

// Fetches rowsPerPage number of data
export const handleGetData = async (credentials, setIsLoading, path, shouldReset, currOffset, rowsPerPage, updateData, setCount, setDisplayData, setData, setCurrOffset) => {
  if (credentials) {
    setIsLoading(true);

    try {
      const response = await getSignedRequest(
        path,
        {
          curr_offset: shouldReset ? 0 : Math.max(0, currOffset),
          rows_per_page: rowsPerPage
        },
        credentials
      );

      updateData(setCount, setDisplayData, setData, setCurrOffset, response.responseData, response.formattedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error retrieving data:', error);
    }
  }
};
