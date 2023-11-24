import React, { useState, useEffect } from "react";
import { Autocomplete, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddRegionDialog from "../../dialogs/AddRegionDialog";
import Theme from '../../admin_pages/Theme';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditRegionDialog from "../../dialogs/EditRegionsDialog";
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import LocationFilterComponent from '../../components/LocationFilterComponent';
// import Pagination from '../../components/TablePaginationComponent';

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

    const handleGetRegions = () => {
        axios
            .get(`${API_ENDPOINT}region`)
            .then((response) => {
                // console.log("Regions retrieved successfully", response.data);
                setDisplayData(response.data);
                setData(response.data);
                setSearchResults(response.data.map((item) => ({ label: item.region_fullname, value: item.region_fullname })));
            })
            .catch((error) => {
                console.error("Error retrieving region", error);
            });
    };
    useEffect(() => {
        handleGetRegions();
    }, []); 

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
                    handleGetRegions();
                    handleFinishEditingRow();
                })
                .catch((error) => {
                    console.error("Error updating region", error);
                });
        };
    };

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
                    handleGetRegions();
                    console.log("region deleted successfully", response.data);
                })
                .catch((error) => {
                    console.error("Error deleting region", error);
                })
                .finally(() => {
                    setOpenDeleteConfirmation(false);
                });
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
                handleGetRegions();
                setOpenAddRegionDialog(false);
            })
            .catch((error) => {
                console.error("error adding region", error);
            });
    };


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
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <ThemeProvider theme={Theme}>
                    <Button variant="contained" onClick={() => setOpenAddRegionDialog(true)} startIcon={<AddCircleOutlineIcon />}>
                        Add Region
                    </Button>
                </ThemeProvider>
            </div >


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