import { getSignedRequest } from "./getSignedRequest";

// Fetches rowsPerPage number of data
export const handleGetData = async (props) => {
  if (props.credentials) {
    props.setIsLoading(true);

    try {
      const response = await getSignedRequest(
        props.path,
        {
          curr_offset: props.shouldReset ? 0 : Math.max(0, props.currOffset),
          rows_per_page: props.rowsPerPage
        },
        props.credentials
      )

      props.updateData(props.setCount, props.setDisplayData, props.setData, props.setCurrOffset, response.responseData, response.formattedData);
      props.setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error retrieving data:', error);
    }
  }
};