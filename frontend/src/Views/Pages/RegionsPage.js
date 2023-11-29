import React, { useState, useEffect } from "react";
import { Autocomplete, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddRegionDialog from "../../dialogs/AddRegionDialog";
import Theme from './Theme';

// icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import EditRegionDialog from "../../dialogs/EditRegionsDialog";
// import LocationFilterComponent from '../../components/LocationFilterComponent';

import axios from "axios";

function RegionsPage() {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    const [data, setData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [tempData, setTempData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [openEditRegionDialog, setOpenEditRegionDialog] = useState(false);
    const [openAddRegionDialog, setOpenAddRegionDialog] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState(displayData.map((item) => ({
        label: item.region_fullname,
        value: item.region_fullname
    })));
    const [country, setCountry] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);


    const [currLastRegionId, setCurrLastRegionId] = useState(""); // current last region
    const [lastRegionIdHistory, setLastRegionIdHistory] = useState(new Set()); // history of last region ids seen for each page
    const [lastRegionNameHistory, setLastRegionNameHistory] = useState(new Set()); // history of last region full names seen for each page
    const [shouldReset, setShouldReset] = useState(false);

    const handleGetRegions = () => {
        console.log("shouldReset?", shouldReset)
        console.log("region id:", currLastRegionId);

        axios
            .get(`${API_ENDPOINT}region`, {
                params: {
                    last_region_id: shouldReset ? null : currLastRegionId  // for pagination
                }
            })
            .then((response) => {
                console.log("Regions retrieved successfully", response.data);

                if (shouldReset) {
                    setLastRegionIdHistory(new Set())
                    setLastRegionNameHistory(new Set())
                    setShouldReset(false);
                }

                setDisplayData(response.data);
                setData(response.data);
                setSearchResults(response.data.map((item) => ({ label: item.region_fullname, value: item.region_fullname })));

                // update lastSpeciesId with the species_id of the last row displayed in the table
                if (response.data.length > 0) {
                    const newLastRegionId = response.data[response.data.length - 1].region_id;
                    const newLastRegionName = response.data[response.data.length - 1].region_fullname;

                    setCurrLastRegionId(newLastRegionId);
                    setLastRegionIdHistory(history => new Set([...history, newLastRegionId]));
                    setLastRegionNameHistory(history => new Set([...history, newLastRegionName]));
                }
            })
            .catch((error) => {
                console.error("Error retrieving region", error);
            });
    };

    const handleGetRegionsAfterSearch = () => {
        const formattedSearchInput = capitalizeString(searchInput);

        axios
            .get(`${API_ENDPOINT}region`, {
                params: {
                    region_fullname: formattedSearchInput,
                    last_region_id: shouldReset ? null : currLastRegionId  // for pagination
                }
            })
            .then((response) => {
                console.log("Regions retrieved successfully", response.data);
                setDisplayData(response.data);
            })
            .catch((error) => {
                console.error("Error searching up region", error);
            });
    };


    const handleReset = () => {
        console.log("reset data");
        setShouldReset(true);
        setSearchInput("");
        handleGetRegions();
    }

    useEffect(() => {
        console.log("last species id: ", currLastRegionId)
        console.log("history: ", lastRegionIdHistory, lastRegionNameHistory)
    }, [currLastRegionId, lastRegionIdHistory, lastRegionNameHistory]);

    // filters display data based on user search input
    useEffect(() => {
        const filteredData = data.filter((item) =>
            (searchInput === "" ||
                (item.region_fullname.toLowerCase().includes(searchInput.toLowerCase()) ||
                    item.region_code_name.toLowerCase().includes(searchInput.toLowerCase()))) &&
            (country === "" || item.country_fullname.toLowerCase() === country.toLowerCase())
        );

        if (searchInput === "" && country === "") {
            setDisplayData(data);
        } else {
            setDisplayData(filteredData);
        }

        // Update search results based on filtered data
        const results = filteredData.map((item) => ({
            label: item.region_fullname,
            value: item.region_fullname,
        }));
        setSearchResults(results);
    }, [searchInput, country, data]);


    // edit region row
    const startEdit = (region_id, rowData) => {
        setEditingId(region_id);
        setTempData(rowData);
        setOpenEditRegionDialog(true);
    };

    // helper function after saving 
    const handleFinishEditingRow = () => {
        setOpenEditRegionDialog(false);
        setEditingId(null);
    };

    // helper function that capitalizes a string
    const capitalizeString = (str) => {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // saves edited row
    const handleSave = (confirmed) => {

        const formattedData = {
            ...tempData,
            region_fullname: capitalizeString(tempData.region_fullname),
            region_code_name: tempData.region_code_name.toUpperCase(),
            country_fullname: capitalizeString(tempData.country_fullname)
        }

        if (confirmed) {
            console.log("saved region data: ", tempData);
            axios
                .put(`${API_ENDPOINT}region/${formattedData.region_id}`, formattedData)
                .then((response) => {
                    console.log("Region updated successfully", response.data);
                    setShouldReset(true);
                    handleFinishEditingRow();
                })
                .catch((error) => {
                    console.error("Error updating region", error);
                });
        };
    };

    // add region
    const handleAddRegion = (newRegionData) => {

        const formattedData = {
            ...newRegionData,
            region_fullname: capitalizeString(newRegionData.region_fullname),
            region_code_name: newRegionData.region_code_name.toUpperCase(),
            country_fullname: capitalizeString(newRegionData.country_fullname)
        }

        console.log("new region: ", formattedData)

        // request to POST new regions to the database
        axios
            .post(API_ENDPOINT + "region", formattedData)
            .then((response) => {
                console.log("region added successfully", response.data);
                setShouldReset(true);
                setOpenAddRegionDialog(false);
            })
            .catch((error) => {
                console.error("error adding region", error);
            })
    };

    // execute handleGetRegions after shouldReset state update
    useEffect(() => {
        if (shouldReset) {
            handleGetRegions();
        }
    }, [shouldReset]);

    // delete row with Confirmation before deletion
    const handleDeleteRow = (region_id) => {
        setDeleteId(region_id);
        setOpenDeleteConfirmation(true);
    };

    // Confirm delete
    const handleConfirmDelete = () => {
        // console.log("region id to delete: ", deleteId);
        if (deleteId) {
            axios
                .delete(`${API_ENDPOINT}region/${deleteId}`)
                .then((response) => {
                    setShouldReset(true);
                    setOpenDeleteConfirmation(false);
                    console.log("region deleted successfully", response.data);
                })
                .catch((error) => {
                    console.error("Error deleting region", error);
                })
        } else {
            setOpenDeleteConfirmation(false);
        }
    };

    // helper function when search input changes
    const handleSearchInputChange = (field, value) => {

        // only take in numbers and decimal or empty 
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

    // search region by full name or code name
    const handleSearch = (searchInput) => {
        if (searchInput === "") {
            setDisplayData(data);
        } else {
            const terms = searchInput.toLowerCase().split(" ");
            const results = data.filter((item) => {
                const regionFullNameMatch = terms.every((term) =>
                    item.region_fullname.toLowerCase().includes(term)
                );

                const regionCodeMatch = terms.every((term) =>
                    item.region_code_name.toLowerCase().includes(term)
                );

                return regionFullNameMatch || regionCodeMatch;
            });
            setDisplayData(results);
        }
    };

    // search country
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



    // TODO: match the rows per option with the lambda function
    const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
    const [page, setPage] = useState(0); // Start with page 0
    const [disabled, setDisabled] = useState(false); // disabled next button or not

    const start = page * rowsPerPage + 1;
    const end = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length); // min of rowsPerPage or displayed data length

    // updates page count
    const handleNextPage = () => {
        setPage(page + 1); // Increment the page by 1 on "Next" button click
    };

    // updates page count and history of species seen
    const handlePreviousPage = () => {
        if (lastRegionIdHistory.size > 1) {
            const updatedIdHistory = new Set([...lastRegionIdHistory]);
            updatedIdHistory.delete([...updatedIdHistory].pop());
            setLastRegionIdHistory(updatedIdHistory);

            const updatedNameHistory = new Set([...lastRegionNameHistory]);
            updatedNameHistory.delete([...updatedNameHistory].pop());
            setLastRegionNameHistory(updatedNameHistory);

            // gets the previous species id
            const prevSpeciesId = [...updatedIdHistory][[...updatedIdHistory].length - 2];
            setCurrLastRegionId(prevSpeciesId);
            setPage(page - 1);
        }
    };

    // gets next/previous set of species on page change
    useEffect(() => {
        handleGetRegions(false);
    }, [page]);


    // disables the next button if there are no species left to query
    useEffect(() => {
    // console.log("displayDataCount: ", displayData.length);
    // console.log("rows per page: ", rowsPerPage);

        if (displayData.length === 0 || displayData.length < rowsPerPage) {
            setDisabled(true);
        } else {
            setDisabled(false);
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

                <Box style={{ flex: 2, marginLeft: "10px" }}>
                    <Autocomplete
                        options={searchResults}
                        getOptionLabel={(option) => option.label}
                        onInputChange={(e, newInputValue) => handleSearch(newInputValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                        Search region
                                    </div>
                                }
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                }}
                                style={{ marginTop: "2rem", marginBottom: "1rem" }}
                            />
                        )}
                    />
                </Box>

                <ThemeProvider theme={Theme}>
                    <Button variant="contained" style={{ marginLeft: "20px", marginTop: "27px", width: "10%", height: "53px", alignItems: "center" }}>
                        <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
                    </Button>
                </ThemeProvider>

                <ThemeProvider theme={Theme}>
                    <Button variant="contained" onClick={() => handleReset()} style={{ marginLeft: "10px", marginTop: "27px", height: "53px", alignItems: "center" }}>
                        <RestartAltIcon />
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

            {/* pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "70%" }}>
                {/* dropdown for selecting rows per page */}
                <span style={{ marginRight: '10px' }}>Rows per page:</span>
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                    {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                {/* previous and next buttons for table */}
                <span style={{ marginRight: '10px', marginLeft: "30px" }}>{`${start}-${end} species`}</span>
                <IconButton onClick={handlePreviousPage} disabled={page === 0}>
                    <NavigateBeforeIcon />
                </IconButton>
                <IconButton onClick={handleNextPage} disabled={disabled}>
                    <NavigateNextIcon />
                </IconButton>
            </div>

            <div style={{ width: "90%", display: "flex", justifyContent: "center" }}>
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
                        {displayData &&
                            (country !== ""
                                ? displayData
                                .filter((item) => item.country_fullname.toLowerCase() === country.toLowerCase())
                                .sort((a, b) => a.region_fullname.localeCompare(b.region_fullname))
                                    .map((row) => (
                                        <TableRow key={row.region_code_name}>
                                            {/* editing the row and no country search*/}
                                            {editingId === row.region_id ? (
                                                <>
                                                    {/* region full name */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.region_fullname}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region_fullname", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* region code */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.region_code_name}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region_code_name", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* country */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.country_fullname}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("country_fullname", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* coordinates */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.geographic_coordinate}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("geographic_coordinate", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* edit/delete */}
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
                                            ) : (
                                                    // not editing row and no country search
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
                                            )}
                                        </TableRow>
                                    ))
                                : displayData
                                .sort((a, b) => a.region_fullname.localeCompare(b.region_fullname))
                                    .map((row) => (
                                        <TableRow key={row.region_id}>
                                            {/* editing the row and country */}
                                            {editingId === row.region_id ? (
                                                <>
                                                    {/* region full name */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.region_fullname}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region_fullname", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* region code */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.region_code_name}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region_code_name", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* country */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.country_fullname}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("country_fullname", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* coordinates */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.geographic_coordinate}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("geographic_coordinate", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* edit/delete */}
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
                                            ) : (
                                                    //  not editing the row and no country
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
                                            )}
                                        </TableRow>
                                    )))}
                    </TableBody>
                </Table>
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
                handleSearchInputChange={handleSearchInputChange}
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