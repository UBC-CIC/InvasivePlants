import React, { useState, useEffect, useContext } from "react";
import { Autocomplete, Box, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from './Theme';
import axios from "axios";

// components
import PaginationComponent from '../../components/PaginationComponent';
import DeleteDialog from "../../components/Dialogs/ConfirmDeleteDialog";
import AddRegionDialog from "../../components/Dialogs/AddRegionDialog";
import EditRegionDialog from '../../components/Dialogs/EditRegionsDialog';

// icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

//functions
import { capitalizeEachWord } from '../../functions/textFormattingUtils';
import { handleKeyPress, resetStates, updateData } from "../../functions/pageDisplayUtils";
import { AuthContext } from "../PageContainer/PageContainer";
import { getSignedRequest } from "../../functions/getSignedRequest";

// displays regions
function RegionsPage() {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [searchDropdownOptions, setSearchDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
    const [regionCount, setRegionCount] = useState(0); // number of regions
    const [country, setCountry] = useState(""); // current country
    const [data, setData] = useState([]); // original data
    const [displayData, setDisplayData] = useState([]); // data displayed in the table
    const [tempData, setTempData] = useState({}); // temp data of the region being edited
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


    // Fetches rowsPerPage number of regions (pagination)
    const handleGetRegions = async () => {
        if (!credentials) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await getSignedRequest(
                "region",
                {
                    curr_offset: shouldReset ? 0 : Math.max(0, currOffset),
                    rows_per_page: rowsPerPage
                },
                credentials
            )

            if (response.ok) {
                const responseData = await response.json();
                const formattedData = responseData.regions.map(item => {
                    return {
                        ...item,
                        region_fullname: capitalizeEachWord(item.region_fullname),
                        region_code_name: item.region_code_name.toUpperCase(),
                        country_fullname: capitalizeEachWord(item.country_fullname)
                    };
                });

                updateData(setRegionCount, setDisplayData, setData, setCurrOffset, responseData, formattedData);
                setIsLoading(false);
            } else {
                console.error('Failed to retrieve regions:', response.statusText);
            }
        } catch (error) {
            console.error('Unexpected error retrieving regions:', error);
        }
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
        const formattedSearchInput = searchInput.replace(/\s*\([^)]*\)\s*/, '') // Remove the region code within parentheses
            .trim() // Trim trailing spaces
            .toLowerCase() // Convert to lowercase
            .replace(/\s+/g, '_'); // Replace spaces with underscores 

        setIsLoading(true);

        try {
            const response = await getSignedRequest(
                "region",
                {
                    region_fullname: formattedSearchInput
                },
                credentials
            )

            if (response.ok) {
                const responseData = await response.json();

                const formattedData = responseData.regions.map(item => {
                    return {
                        ...item,
                        region_fullname: capitalizeEachWord(item.region_fullname),
                        region_code_name: item.region_code_name.toUpperCase(),
                        country_fullname: capitalizeEachWord(item.country_fullname)
                    };
                });

                // updates pagination start and end indices
                setShouldCalculate(false);
                setDisplayData(formattedData);
                formattedData.length > 0 ? setStart(1) : setStart(0);
                setEnd(responseData.regions.length);
            } else {
                console.error('Failed to search region: ', response.statusText);
            }
        } catch (error) {
            console.error('Unexpected error searching region:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Updates editing states when editing a region
    const startEdit = (rowData) => {
        setTempData(rowData);
        setOpenEditRegionDialog(true);
    };

    // Updates states after editing a region and saving 
    const handleFinishEditingRow = () => {
        setOpenEditRegionDialog(false);
    };

    // Updates changes to the database on save
    const handleSave = (confirmed) => {
        const jwtToken = user.signInUserSession.accessToken.jwtToken

        const formattedData = {
            ...tempData,
            region_fullname: capitalizeEachWord(tempData.region_fullname),
            region_code_name: tempData.region_code_name.toUpperCase(),
            country_fullname: capitalizeEachWord(tempData.country_fullname)
        }

        if (confirmed) {
            axios
                .put(`${API_BASE_URL}region/${formattedData.region_id}`,
                    formattedData,
                    {
                        headers: {
                            'Authorization': `${jwtToken}`
                        }
                    })
                .then(() => {
                    handleGetRegionsAfterSave();
                    handleFinishEditingRow();
                })
                .catch((error) => {
                    console.error("Error updating region", error);
                });
        };
    };

    // Opens confirmation dialog before deletion
    const handleDeleteRow = (region_id) => {
        setDeleteId(region_id);
        setOpenDeleteConfirmation(true);
    };

    // Deletes region from the table
    const handleConfirmDelete = () => {
        const jwtToken = user.signInUserSession.accessToken.jwtToken

        if (deleteId) {
            axios
                .delete(`${API_BASE_URL}region/${deleteId}`, {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
                .then(() => {
                    setRegionCount(prevCount => prevCount - 1)
                    setIsLoading(true);
                    setShouldReset(true);
                    setOpenDeleteConfirmation(false);
                })
                .catch((error) => {
                    console.error("Error deleting region", error);
                })
        } else {
            setOpenDeleteConfirmation(false);
        }
    };

    // Adds a new region
    const handleAddRegion = (newRegionData) => {
        setIsLoading(true);
        const jwtToken = user.signInUserSession.accessToken.jwtToken

        const formattedData = {
            ...newRegionData,
            region_fullname: capitalizeEachWord(newRegionData.region_fullname),
            region_code_name: newRegionData.region_code_name.toUpperCase(),
            country_fullname: capitalizeEachWord(newRegionData.country_fullname)
        }

        // Request to POST new regions to the database
        axios
            .post(API_BASE_URL + "region",
                formattedData,
                {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
            .then(() => {
                setShouldReset(true);
                setOpenAddRegionDialog(false);
            })
            .catch((error) => {
                console.error("error adding region", error);
            })
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
            setTempData((prev) => ({ ...prev, geographic_coordinate: `${value},${prev.geographic_coordinate.split(',')[1]}` }));
        } else if (field === 'geographic_longitude') {
            setTempData((prev) => ({ ...prev, geographic_coordinate: `${prev.geographic_coordinate.split(',')[0]},${value}` }));
        } else {
            setTempData((prev) => ({ ...prev, [field]: value }));
        }

    };

    // Displays original data when search input is empty, updates dropdown
    const handleSearch = async (searchInput) => {
        if (searchInput === "") {
            setDisplayData(data);
            setShouldCalculate(true);
            setSearchDropdownOptions([]);
        } else if (searchInput.includes('(')) {
            // no need to search
        } else {
            try {
                const response = await getSignedRequest(
                    "region",
                    {
                        region_fullname: searchInput
                    },
                    credentials
                )

                if (response.ok) {
                    const responseData = await response.json();
                    const formattedData = responseData.regions.map(item => {
                        return {
                            ...item,
                            region_fullname: capitalizeEachWord(item.region_fullname),
                            region_code_name: item.region_code_name.toUpperCase(),
                            country_fullname: capitalizeEachWord(item.country_fullname)
                        };
                    });

                    if (formattedData.length > 0) {
                        const regionNames = formattedData.map((region) => `${region.region_fullname} (${region.region_code_name})`);
                        setSearchDropdownOptions(regionNames);
                    }
                } else {
                    console.error('Failed to search region:', response.statusText);
                }
            } catch (error) {
                console.error('Unexpected error searching region:', error);
            }
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

    // Calculates start and end regions indices of the current page of displayed data
    const calculateStartAndEnd = () => {
        const newStart = page * rowsPerPage + 1;
        const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
        setStart(newStart);
        setEnd(newEnd);
    };

    // Call to calculate indices
    useEffect(() => {
        if (shouldCalculate) {
            calculateStartAndEnd();
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

    // Increments the page count by 1 
    const handleNextPage = () => {
        setPage(page + 1);
    };

    // Decrements page count by 1 and removes last id in seen regions history 
    const handlePreviousPage = () => {
        setCurrOffset(curr => curr - rowsPerPage * 2);
        setPage(page - 1);
    };

    // Disables the next button if there are no regions left to query
    useEffect(() => {
        if (displayData.length === 0 || displayData.length < rowsPerPage) {
            setDisableNextButton(true);
        } else {
            setDisableNextButton(false);
        }
    }, [displayData, rowsPerPage]);

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

            {/* location and search bars*/}
            <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>

                {/* country search and dropdown */}
                <Box style={{ flex: 1, marginRight: "10px" }}>
                    <Autocomplete
                        options={Array.from(new Set(displayData.map((region) => region.country_fullname)))}
                        getOptionLabel={(option) => option}
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

                {/* regions search and dropdown */}
                <Box style={{ flex: 3, marginLeft: "10px" }}>
                    <Autocomplete
                        options={searchDropdownOptions}
                        onInputChange={(e, newInputValue) => {
                            setSearchInput(newInputValue);
                            handleSearch(newInputValue);
                        }}
                        clearOnBlur={false}
                        onKeyDown={(event) => handleKeyPress(event, handleGetRegionsAfterSearch)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                        {"Search region"}
                                    </div>
                                }
                                style={{ marginTop: "2rem", marginBottom: "1rem" }}
                            />
                        )}
                    />
                </Box>

                <ThemeProvider theme={Theme}>
                    <Button variant="contained" onClick={() => handleGetRegionsAfterSearch()} style={{ marginLeft: "20px", marginTop: "27px", width: "10%", height: "53px", alignItems: "center" }}>
                        <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
                    </Button>
                </ThemeProvider>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <ThemeProvider theme={Theme}>
                    <Button variant="contained" onClick={() => setOpenAddRegionDialog(true)} startIcon={<AddCircleOutlineIcon />}>
                        Add Region
                    </Button>
                </ThemeProvider>
            </div >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginLeft: "70%" }}>
                {/* dropdown for selecting rows per page */}
                <span style={{ marginRight: '10px' }}>Rows per page:</span>
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                    {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <PaginationComponent
                    start={start}
                    end={end}
                    count={regionCount}
                    page={page}
                    handlePreviousPage={handlePreviousPage}
                    handleNextPage={handleNextPage}
                    disabled={disableNextButton}
                />
            </div>


            <div style={{ width: "90%", display: "flex", justifyContent: "center" }}>
                {isLoading ? (
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                ) : (
                    (displayData && displayData.length > 0 ? (
                        <Table style={{ width: "100%", tableLayout: "fixed" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ width: "10%" }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Region
                                        </Typography>
                                    </TableCell>
                                    <TableCell style={{ width: "10%" }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Region Code
                                        </Typography>
                                    </TableCell>
                                    <TableCell style={{ width: "10%" }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Country
                                        </Typography>
                                    </TableCell>
                                    <TableCell style={{ width: "15%" }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Geographic Coordinates (latitude, longitude)
                                        </Typography>
                                    </TableCell>
                                    <TableCell style={{ width: "5%" }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Actions
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(displayData && displayData.length > 0 ? displayData : [])
                                    .map((row) => (
                                        <TableRow key={row.region_id}>
                                            <>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.region_fullname}</TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}> {row.region_code_name} </TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.country_fullname}</TableCell>
                                                <TableCell sx={{ textAlign: 'left', verticalAlign: 'top' }}>{row.geographic_coordinate}</TableCell>
                                                <TableCell >
                                                    <Tooltip title="Edit"
                                                        onClick={() => startEdit(row)}>
                                                        <IconButton>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip
                                                        title="Delete"
                                                        onClick={() => handleDeleteRow(row.region_id, row)}>
                                                        <IconButton>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    ) : (
                        // no display data
                        <Box style={{ margin: 'auto', textAlign: 'center' }}>No regions found</Box>
                    )))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginLeft: "79%" }}>
                <PaginationComponent
                    start={start}
                    end={end}
                    count={regionCount}
                    page={page}
                    handlePreviousPage={handlePreviousPage}
                    handleNextPage={handleNextPage}
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
                handleFinishEditingRow={handleFinishEditingRow}
                handleSave={handleSave}
            />

            <DeleteDialog
                open={openDeleteConfirmation}
                handleClose={() => setOpenDeleteConfirmation(false)}
                handleDelete={handleConfirmDelete}
            />
        </div >
    );
}

export default RegionsPage;