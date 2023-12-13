import React, { useState, useEffect } from "react";
import {
    Autocomplete, Box, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button,
    TextField, Typography, ThemeProvider
} from "@mui/material";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddRegionDialog from "../../dialogs/AddRegionDialog";
import Theme from './Theme';
import { Auth } from "aws-amplify";

// components
import EditRegionDialog from "../../dialogs/EditRegionsDialog";
import PaginationComponent from '../../components/PaginationComponent';
import SearchComponent from '../../components/SearchComponent';

// icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

import {  capitalizeEachWord } from '../../functions/helperFunctions';
import axios from "axios";

// displays regions
function RegionsPage() {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [allRegions, setAllRegions] = useState([]); // array of all regions
    const [allRegionNames, setAllRegionNames] = useState([]); // array of all region names
    const [regionCount, setRegionCount] = useState(0); // number of regions
    const [country, setCountry] = useState(""); // current country
    const [data, setData] = useState([]); // original data
    const [displayData, setDisplayData] = useState([]); // data displayed in the table
    const [editingRegionId, setEditingRegionId] = useState(null);// region_id of the row being edited
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

    const [isLoading, setIsLoading] = useState(false); // loading data or not
    const [user, setUser] = useState("");

    // Retrieves user and regions on load
    useEffect(() => {
        retrieveUser()
        fetchAllRegions();
    }, [])


    // Gets current authorized user
    const retrieveUser = async () => {
        try {
            const returnedUser = await Auth.currentAuthenticatedUser();
            setUser(returnedUser);
        } catch (e) {
            console.log("error getting user: ", e);
        }
    }

    // Fetches all regions (recursively) in the database
    const fetchAllRegions = async (currOffset = null) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_BASE_URL}region`, {
                params: {
                    curr_offset: currOffset,
                    rows_per_page: rowsPerPage
                },
                headers: {
                    'x-api-key': process.env.REACT_APP_X_API_KEY
                }
            });

            setAllRegions(prevRegions => [...prevRegions, ...response.data.regions]);
            setRegionCount(prevCount => prevCount + response.data.regions.length)

            // Recursively gets regions
            if (response.data.regions.length === rowsPerPage) {
                const nextOffset = response.data.nextOffset;
                await fetchAllRegions(nextOffset);
            }
        } catch (error) {
            console.error("Error retrieving regions", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Updates search bar dropdown when regions are added or deleted
    useEffect(() => {
        const updatedRegionFullNames = allRegions.map(region => ({
            label: capitalizeEachWord(region.region_fullname),
            value: capitalizeEachWord(region.region_fullname)
        }));

        setAllRegionNames(updatedRegionFullNames);
    }, [allRegions]);


    // Fetches rowsPerPage number of regions (pagination)
    const handleGetRegions = () => {
        setIsLoading(true);
        axios
            .get(`${API_BASE_URL}region`, {
                params: {
                    curr_offset: shouldReset ? null : currOffset,
                    rows_per_page: rowsPerPage  // default 20
                },
                headers: {
                    'x-api-key': process.env.REACT_APP_X_API_KEY
                }
            })
            .then((response) => {
                // Resets pagination details
                // This will clear the last region id history and display the first page
                if (shouldReset) {
                    setCurrOffset(0);
                    setPage(0);
                    setStart(0);
                    setEnd(0);
                    setShouldReset(false);
                }

                const formattedData = response.data.regions.map(item => {
                    return {
                        ...item,
                        region_fullname: capitalizeEachWord(item.region_fullname),
                        region_code_name: item.region_code_name.toUpperCase(),
                        country_fullname: capitalizeEachWord(item.country_fullname)
                    };
                });

                setDisplayData(formattedData);
                setData(formattedData);
                setCurrOffset(response.data.nextOffset);
            })
            .catch((error) => {
                console.error("Error retrieving region", error);
            })
            .finally(() => {
                setIsLoading(false);
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
            axios
                .get(`${API_BASE_URL}region`, {
                    params: {
                        curr_offset: currOffset ? currOffset : null, // default first page
                        rows_per_page: rowsPerPage  // default 20
                    },
                    headers: {
                        'x-api-key': process.env.REACT_APP_X_API_KEY
                    }
                })
                .then((response) => {
                    const formattedData = response.data.regions.map(item => {
                        return {
                            ...item,
                            region_fullname: capitalizeEachWord(item.region_fullname),
                            region_code_name: item.region_code_name.toUpperCase(),
                            country_fullname: capitalizeEachWord(item.country_fullname)
                        };
                    });

                    setDisplayData(formattedData);
                    setCurrOffset(response.data.nextOffset);
                })
                .catch((error) => {
                    console.error("Error getting regions", error);
                })
                .finally(() => {
                    setShouldSave(false);
                });
        }
    }, [shouldSave]);

    // Fetches the regions that matches user search
    const handleGetRegionsAfterSearch = () => {
        const formattedSearchInput = searchInput.toLowerCase().replace(/\s+/g, '_');;
        setIsLoading(true);

        axios
            .get(`${API_BASE_URL}region`, {
                params: {
                    region_fullname: formattedSearchInput,
                },
                headers: {
                    'x-api-key': process.env.REACT_APP_X_API_KEY
                }
            })
            .then((response) => {
                const formattedData = response.data.regions.map(item => {
                    return {
                        ...item,
                        region_fullname: capitalizeEachWord(item.region_fullname),
                        region_code_name: item.region_code_name.toUpperCase(),
                        country_fullname: capitalizeEachWord(item.country_fullname)
                    };
                });
                setDisplayData(formattedData);
            })
            .catch((error) => {
                console.error("Error searching up region", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Updates editing states when editing a region
    const startEdit = (region_id, rowData) => {
        setEditingRegionId(region_id);
        setTempData(rowData);
        setOpenEditRegionDialog(true);
    };

    // Updates states after editing a region and saving 
    const handleFinishEditingRow = () => {
        setOpenEditRegionDialog(false);
        setEditingRegionId(null);
    };

    // Updates changes to the database on save
    const handleSave = (confirmed) => {
        retrieveUser();
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
                .then((response) => {
                    if (start > rowsPerPage) {
                        handleGetRegionsAfterSave();
                    } else {
                        setShouldReset(true);
                    }
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
        retrieveUser();
        const jwtToken = user.signInUserSession.accessToken.jwtToken

        if (deleteId) {
            axios
                .delete(`${API_BASE_URL}region/${deleteId}`, {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
                .then((response) => {
                    setRegionCount(prevCount => prevCount - 1)
                    setAllRegions(prevRegions => prevRegions.filter(region => region.region_id !== deleteId));
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
        retrieveUser();
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
            .then((response) => {
                const updatedData = response.data.map(item => {
                    return {
                        ...item,
                        scientific_name: item.scientific_name
                    };
                });

                setAllRegions(prevRegions => [...prevRegions, ...updatedData]);
                setRegionCount(prevCount => prevCount + 1);
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
            handleGetRegions();
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

    // Displays original data when search input is empty
    const handleSearch = (searchInput) => {
        if (searchInput === "") {
            setDisplayData(data);
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
        calculateStartAndEnd();
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
                <SearchComponent
                    text={"Search regions"}
                    handleSearch={handleSearch}
                    searchResults={allRegionNames}
                    searchTerm={searchInput}
                    setSearchTerm={setSearchInput}
                />

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
                                        <TableCell>{row.region_fullname}</TableCell>
                                        <TableCell> {row.region_code_name} </TableCell>
                                        <TableCell>{row.country_fullname}</TableCell>
                                        <TableCell>{row.geographic_coordinate}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit"
                                                onClick={() => startEdit(row.region_id, row)}>
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
                )}
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