import React, { useState, useEffect, useContext } from "react";
import { Autocomplete, Box, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";

// components
import PaginationComponent from '../../components/PaginationComponent';
import DeleteDialog from "../../components/Dialogs/ConfirmDeleteDialog";
import AddRegionDialog from "../../components/Dialogs/AddRegionDialog";
import EditRegionDialog from '../../components/Dialogs/EditRegionsDialog';
import { ActionButtons } from "../../components/Table/ActionButtons";
import { RowsPerPageDropdown } from "../../components/RowsPerPageDropdown";
import { AddDataButton } from "../../components/AddDataButton";
import { RegionsPageTableHeader } from "../../components/Table/RegionsPageTableHeader";
import { NoDataBox } from "../../components/Table/NoDataBox";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SearchButton } from "../../components/Search/SearchButton";

// icons
import LocationOnIcon from '@mui/icons-material/LocationOn';

//functions
import { removeTextInParentheses } from '../../functions/textFormattingUtils';
import { resetStates, updateData, checkNextButtonDisabled, handleNextPage, handlePreviousPage, calculateStartAndEnd } from "../../functions/pageDisplayUtils";
import { AuthContext } from "../PageContainer/PageContainer";
import { getSignedRequest } from "../../functions/getSignedRequest";
import { updateDropdownOptions } from "../../functions/searchUtils";
import { SearchBar } from "../../components/Search/SearchBar";
import { handleGetData } from "../../functions/handleGetData";
import { formatRegionFields } from "../../functions/dataFormattingUtils";
import { updateDataToDatabase, handleEditRow, handleFinishEditingRow } from "../../functions/handleEditData";
import { deleteDataFromDatabase } from "../../functions/handleDeleteData";
import { addDataToDatabase } from "../../functions/handleAddData";

// displays regions
function RegionsPage() {
    const [searchDropdownOptions, setSearchDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
    const [regionCount, setRegionCount] = useState(0); // number of regions
    const [country, setCountry] = useState(""); // current country
    const [data, setData] = useState([]); // original data
    const [displayData, setDisplayData] = useState([]); // data displayed in the table
    const [tempData, setTempEditingData] = useState({}); // temp data of the region being edited
    const [openEditRegionDialog, setOpenEditRegionDialog] = useState(false); // state of the editing an region dialog
    const [openAddRegionDialog, setOpenAddRegionDialog] = useState(false); // state of the adding a new region dialog
    const [searchInput, setSearchInput] = useState(""); // input of the region search bar
    const [deleteId, setDeleteId] = useState(null); // region_id of the row being deleted
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog

    // Pagination states
    const [currOffset, setCurrOffset] = useState(0); // current index of the first region on a page
    const rowsPerPageOptions = [10, 20, 50]; // user selects number of regions to display
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
    const [page, setPage] = useState(0); // Start with page 0
    const [disableNextButton, setDisableNextButton] = useState(false); // disabled next button or not
    const [start, setStart] = useState(0); // starting index of regions
    const [end, setEnd] = useState(0); // end index of regions
    const [shouldReset, setShouldReset] = useState(false); // state of should reset 
    const [shouldSave, setShouldSave] = useState(false); // state of should save 
    const [shouldCalculate, setShouldCalculate] = useState(true); // whether calculation of start and end should be made

    const [isLoading, setIsLoading] = useState(false); // loading data or not
    const { user, credentials } = useContext(AuthContext);

    useEffect(() => {
        if (credentials) {
            handleGetRegions();
        }
    }, [credentials]);


    const handleGetRegions = async () => {
        handleGetData({
            credentials, setIsLoading, path: "region", shouldReset, currOffset, rowsPerPage,
            updateData, setCount: setRegionCount, setDisplayData, setData, setCurrOffset
        });
    };

    // Maintains history of last region_id and currLastRegionId so that on GET, 
    // the current page is maintained instead of starting from page 1
    const handleGetRegionsAfterSave = () => {
        setCurrOffset(curr => curr - rowsPerPage);
        setShouldSave(true) // useEffect listens for this state to change and will GET regions when True
    };

    // Request to GET region (same page) after editing a row to see the updated data when shouldSave state changes
    useEffect(() => {
        if (shouldSave) {
            handleGetRegions();
            setShouldSave(false);
        }
    }, [shouldSave]);

    // Fetches the regions that matches user search
    const handleGetRegionsAfterSearch = async () => {
        const formattedSearchInput = removeTextInParentheses(searchInput);

        setIsLoading(true);

        try {
            const response = await getSignedRequest(
                "region",
                {
                    region_fullname: formattedSearchInput
                },
                credentials
            )

            // updates pagination start and end indices
            setShouldCalculate(false);
            setDisplayData(response.formattedData);
            response.formattedData.length > 0 ? setStart(1) : setStart(0);
            setEnd(response.responseData.regions.length);
            setIsLoading(false);
        } catch (error) {
            console.error('Unexpected error searching region:', error);
        }
    };

    // Updates changes to the database on save
    const handleSave = (confirmed) => {
        const jwtToken = user.signInUserSession.accessToken.jwtToken

        if (confirmed) {
            const formattedData = formatRegionFields(tempData);
            updateDataToDatabase({
                path: "region",
                id: formattedData.region_id,
                formattedData: formattedData,
                jwtToken: jwtToken,
                handleGetData: handleGetRegionsAfterSave,
                handleFinishEditingRow: () => handleFinishEditingRow({ setOpenEditDialog: setOpenEditRegionDialog })
            });
        }
    };


    // Opens confirmation dialog before deletion
    const handleDeleteRow = (region_id) => {
        setDeleteId(region_id);
        setOpenDeleteConfirmation(true);
    };

    // Adds a new region
    const handleAddRegion = (newRegionData) => {
        setIsLoading(true);
        const jwtToken = user.signInUserSession.accessToken.jwtToken
        const formattedData = formatRegionFields(newRegionData);

        addDataToDatabase("region", formattedData, jwtToken, setCurrOffset, setShouldReset, setOpenAddRegionDialog);
    };

    // Call to handleGetRegions if shouldReset state is True
    useEffect(() => {
        if (shouldReset) {
            setIsLoading(true);
            resetStates(setCurrOffset, setPage, setStart, setEnd, setShouldCalculate);
            handleGetRegions();
            setShouldReset(false);
        }
    }, [shouldReset]);

    // Updates temporary row data when field inputs change
    const handleInputChange = (field, value) => {

        // Regex for checking if input is a number, number with decimals, or empty 
        const isValidInput = /^[+-]?\d*(\.\d*)?$/.test(value);

        if ((field === 'geographic_latitude' && !isValidInput) || (field === 'geographic_longitude' && !isValidInput)) {
            alert('Invalid input. Please enter a numerical value.');
        } else if (field === 'geographic_latitude') {
            setTempEditingData((prev) => ({ ...prev, geographic_coordinate: `${value},${prev.geographic_coordinate.split(',')[1]}` }));
        } else if (field === 'geographic_longitude') {
            setTempEditingData((prev) => ({ ...prev, geographic_coordinate: `${prev.geographic_coordinate.split(',')[0]},${value}` }));
        } else {
            setTempEditingData((prev) => ({ ...prev, [field]: value }));
        }

    };

    // Displays original data when search input is empty, updates dropdown
    const handleSearch = async (searchInput) => {
        if (searchInput === "") {
            setDisplayData(data);
            setShouldCalculate(true);
            setSearchDropdownOptions([]);
        } else if (!searchInput.includes('(')) {
            await updateDropdownOptions(credentials, "region", { region_fullname: searchInput }, setSearchDropdownOptions);
        }
    };

    // Filters display data based on country
    const handleCountrySearch = (countryInput) => {
        if (countryInput === "") {
            setDisplayData(data);
        } else {
            const results = data.filter(
                (item) => item.country_fullname.toLowerCase() === countryInput
            );
            setDisplayData(results);
        }
    };

    // Call to calculate indices
    useEffect(() => {
        if (shouldCalculate) {
            calculateStartAndEnd(page, rowsPerPage, displayData, setStart, setEnd);
        }
    }, [rowsPerPage, page, displayData]);


    // Resets if rowsPerPage changes 
    useEffect(() => {
        setShouldReset(true);
    }, [rowsPerPage]);

    // Call to get next/previous rowsPerPage number of regions on page change
    useEffect(() => {
        handleGetRegions();
    }, [page]);

    useEffect(() => {
        setDisableNextButton(checkNextButtonDisabled(displayData, rowsPerPage));
    }, [displayData, rowsPerPage]);

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
                {/* Country dropdown, can use SearchBar in the future if this is Countries is a Table in database */}
                <Box style={{ flex: 1, marginRight: "10px" }}>
                    <Autocomplete
                        options={Array.from(new Set(displayData.map((region) => region.country_fullname)))}
                        onInputChange={(e, newInputValue) => handleCountrySearch(newInputValue.toLowerCase())}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <LocationOnIcon sx={{ marginRight: '0.5rem' }} />
                                        {"Search by country"}
                                    </div>
                                }
                                value={country}
                                onChange={(e) => {
                                    setCountry(e.target.value.toLowerCase());
                                }}
                                style={{ marginTop: "2rem", marginBottom: "1rem" }}
                            />
                        )}
                    />
                </Box>

                <SearchBar
                    size={3}
                    type={"region"}
                    options={searchDropdownOptions}
                    setSearchInput={setSearchInput}
                    handleSearch={handleSearch}
                    getDataAfterSearch={handleGetRegionsAfterSearch}
                    text={"Search region"}
                />

                <SearchButton getDataAfterSearch={handleGetRegionsAfterSearch} />
            </div>

            <AddDataButton setOpenDialog={setOpenAddRegionDialog} text={"Add Region"} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginLeft: "70%" }}>
                <RowsPerPageDropdown
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={rowsPerPageOptions}
                    setRowsPerPage={setRowsPerPage}
                    dataCount={regionCount}
                />

                <PaginationComponent
                    start={start}
                    end={end}
                    count={regionCount}
                    page={page}
                    handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, null, searchInput, page, setPage)}
                    handleNextPage={() => handleNextPage(setPage, page)}
                    disabled={disableNextButton}
                />
            </div>

            {/* Table */}
            <div style={{ width: "90%", display: "flex", justifyContent: "center" }}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    (displayData && displayData.length > 0 ? (
                        <Table style={{ width: "100%", tableLayout: "fixed" }}>
                            <RegionsPageTableHeader />

                            <TableBody>
                                {(displayData && displayData.length > 0 ? displayData : [])
                                    .map((row) => (
                                        <TableRow key={row.region_id}>
                                            <>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.region_fullname}</TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}> {row.region_code_name} </TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.country_fullname}</TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.geographic_coordinate}</TableCell>
                                                <ActionButtons
                                                    editRow={() => handleEditRow({ setTempEditingData, setOpenEditDialog: setOpenEditRegionDialog, rowData: row })}
                                                    deleteRow={handleDeleteRow}
                                                    row={row} />
                                            </>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <NoDataBox data={"regions"} />
                    )))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginLeft: "80%" }}>
                <PaginationComponent
                    start={start}
                    end={end}
                    count={regionCount}
                    page={page}
                    handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, null, searchInput, page, setPage)}
                    handleNextPage={() => handleNextPage(setPage, page)}
                    disabled={disableNextButton}
                />
            </div>

            <AddRegionDialog
                open={openAddRegionDialog}
                handleClose={() => setOpenAddRegionDialog(false)}
                handleAdd={handleAddRegion}
                data={displayData}
            />

            <EditRegionDialog
                open={openEditRegionDialog}
                tempData={tempData}
                handleInputChange={handleInputChange}
                handleFinishEditingRow={() => handleFinishEditingRow({ setOpenEditDialog: setOpenEditRegionDialog })}
                handleSave={handleSave}
            />

            <DeleteDialog
                open={openDeleteConfirmation}
                handleClose={() => setOpenDeleteConfirmation(false)}
                handleDelete={() => deleteDataFromDatabase("region", deleteId, user, setRegionCount, setShouldReset, setOpenDeleteConfirmation)}
            />
        </div >
    );
}

export default RegionsPage;