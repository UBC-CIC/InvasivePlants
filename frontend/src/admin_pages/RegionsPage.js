import React, { useState, useEffect } from "react";
import { Autocomplete, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
// import CountryMap from "../functions/countryMap";
// import { Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText } from "@mui/material";
import DeleteDialog from "../components/ConfirmDeleteDialog";
import RegionsTestData from "../test_data/regionsTestData";
import AddRegionDialog from "../components/AddRegionDialogComponent";
import Theme from './Theme';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditRegionsDialog from "../components/EditRegionsDialogComponent";


function RegionsPage() {
    const COLOR = '#5e8da6';

    const [data, setData] = useState(RegionsTestData);
    const [displayData, setDisplayData] = useState(RegionsTestData);
    const [editingId, setEditingId] = useState(null);
    const [tempData, setTempData] = useState({});
    const [openEditRegionDialog, setOpenEditRegionDialog] = useState(false);
    const [openAddRegionDialog, setOpenAddRegionDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState(RegionsTestData.map((item) => ({ label: item.regionFullName, value: item.regionFullName })));
    const [country, setCountry] = useState("");

    const [deleteId, setDeleteId] = useState(null);
    const [openConfirmation, setOpenConfirmation] = useState(false);


    // gets rows that matches search and country input 
    const filterData = data.filter((item) =>
        (searchTerm === "" || (
            item.regionFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.regionId.toLowerCase().includes(searchTerm.toLowerCase())
        )) &&
        (country === "" || item.country.toLowerCase() === country.toLowerCase())
    );

    useEffect(() => {
        if (searchTerm === "" && country === "") {
            setData(RegionsTestData);
        } else {
            const results = filterData.map((item) => ({
                label: item.regionFullName,
                value: item.regionFullName,
            }));
            setSearchResults(results);
        }
    }, [searchTerm, filterData, country]);

    // edit species row
    const startEdit = (id, rowData) => {
        setEditingId(id);
        setTempData(rowData);
        setOpenEditRegionDialog(true);
    };

    // helper function after saving 
    const handleFinishEditingRow = () => {
        setOpenEditRegionDialog(false);
        setEditingId(null);
    };

    // saves edited row
    const handleSave = () => {
        const updatedData = data.map((item) => {
            if (item.regionId === tempData.regionId) {
                return { ...tempData };
            }
            return item;
        });

        setData(updatedData);

        // Preserve the edited row in the display data
        const updatedDisplayData = displayData.map((item) => {
            if (item.regionId === tempData.regionId) {
                return { ...tempData };
            }
            return item;
        });
        setDisplayData(updatedDisplayData);

        // TODO: update the database with the updatedData
        handleFinishEditingRow();
    };


    // delete row with Confirmation before deletion
    const handleDeleteRow = (regionId) => {
        setDeleteId(regionId);
        setOpenConfirmation(true);
    };

    // Confirm delete
    const handleConfirmDelete = () => {
        if (deleteId) {
            setDisplayData((prev) =>
                prev.filter((item) => item.regionId !== deleteId));
            // TODO: need to delete in from database
        }
        setOpenConfirmation(false);
    };


    // helper function when search input changes
    const handleSearchInputChange = (field, value) => {
        setTempData((prev) => ({ ...prev, [field]: value }));
    };

    // search species
    const handleSearch = (searchInput) => {
        if (searchInput === "") {
            setDisplayData(data);
        } else {
            const terms = searchInput.toLowerCase().split(" ");
            const results = data.filter((item) => {
                const regionFullNameMatch = terms.every((term) =>
                    item.regionFullName.toLowerCase().includes(term)
                );

                const regionCodeMatch = terms.every((term) =>
                    item.regionCode.toLowerCase().includes(term)
                );

                return regionFullNameMatch || regionCodeMatch;
            });

            setDisplayData(results);
        }
    };

    // search country
    const handleCountrySearch = (countryInput) => {
        setCountry(countryInput);

        if (countryInput === "") {
            setDisplayData(data);
        } else {
            const results = data.filter(
                (item) => item.country.toLowerCase() === countryInput
            );
            setDisplayData(results);
        }
    };

    // add species
    const handleAddRegion = (newRegionData) => {
        // Generate a unique regionId for the new species
        const newRegionId = data.length + 1;

        // Create a new species object with the generated regionId
        const newRegion = {
            regionId: newRegionId,
            ...newRegionData,
        };

        setData([...data, newRegion]);
        setOpenAddRegionDialog(false);
    };

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                <Typography variant="h4" sx={{ textAlign: 'center' }}>
                    Regions List
                </Typography>
            </Box>

            {/* location and search bars*/}
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <Box style={{ flex: 1, marginRight: "10px" }}>
                    <Autocomplete
                        options={Array.from(new Set(displayData.map((data) => data.country)))}
                        getOptionLabel={(option) => option}
                        onInputChange={(e, newInputValue) => handleCountrySearch(newInputValue.toLowerCase())}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Filter by Country"
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
                                label="Search region"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                                style={{ marginTop: "2rem", marginBottom: "1rem" }}
                            />
                        )}
                    />
                </Box>
            </div>

            {/* button to add region */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <ThemeProvider theme={Theme}>

                <Button variant="contained" onClick={() => setOpenAddRegionDialog(true)} startIcon={<AddCircleOutlineIcon />}>
                    Add Region
                </Button>
                </ThemeProvider>
            </div >

            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <Table style={{ width: "100%", tableLayout: "fixed" }}>
                    {/* table header */}
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
                            <TableCell style={{ width: "10%" }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Actions
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    {/* table body: display species */}
                    <TableBody>
                        {displayData &&
                            (country !== ""
                                ? displayData
                                    .filter((item) => item.country.toLowerCase() === country.toLowerCase())
                                    .sort((a, b) => a.regionFullName.localeCompare(b.regionFullName))
                                    .map((row) => (
                                        <TableRow key={row.regionCode}>
                                            {/* editing the row */}
                                            {editingId === row.regionId ? (
                                                <>
                                                    {/* region full name */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.regionFullName}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* region code */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.regionCode}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("regionCode", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* country */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.country}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("country", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* edit/delete */}
                                                    <TableCell>
                                                        <Button
                                                            onClick={() => startEdit(row.regionId, row)}
                                                            sx={{ color: COLOR }}
                                                            startIcon={<EditIcon />}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteRow(row.regionId, row)}
                                                            sx={{ color: "brown" }}
                                                            startIcon={<DeleteIcon />}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>{row.regionFullName}</TableCell>
                                                    <TableCell> {row.regionCode} </TableCell>
                                                    <TableCell>{row.country}</TableCell>
                                                    <TableCell>
                                                            <Button onClick={() => startEdit(row.regionId, row)}
                                                                sx={{ color: COLOR }}
                                                            startIcon={<EditIcon />}>
                                                            Edit
                                                        </Button>
                                                        <Button
                                                                onClick={() => handleDeleteRow(row.regionId, row)}
                                                            sx={{ color: "brown" }}
                                                            startIcon={<DeleteIcon />}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                : displayData
                                    .sort((a, b) => a.regionFullName.localeCompare(b.regionFullName))
                                    .map((row) => (
                                        <TableRow key={row.regionId}>
                                            {/* editing the row */}
                                            {editingId === row.regionId ? (
                                                <>
                                                    {/* region full name */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.regionFullName}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("region", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* region code */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.regionCode}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("regionCode", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* country */}
                                                    <TableCell>
                                                        <TextField
                                                            value={tempData.country}
                                                            onChange={(e) =>
                                                                handleSearchInputChange("country", e.target.value)
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* edit/delete */}
                                                    <TableCell>
                                                        <Button
                                                            onClick={() => startEdit(row.regionId, row)}
                                                            sx={{ color: COLOR }}
                                                            startIcon={<EditIcon />}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteRow(row.regionId, row)}
                                                            sx={{ color: "brown" }}
                                                            startIcon={<DeleteIcon />}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>{row.regionFullName}</TableCell>
                                                    <TableCell> {row.regionCode} </TableCell>
                                                    <TableCell>{row.country}</TableCell>
                                                    <TableCell>
                                                            <Button onClick={() => startEdit(row.regionId, row)}
                                                                sx={{ color: COLOR }}
                                                                startIcon={<EditIcon />}
                                                            >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                                onClick={() => handleDeleteRow(row.regionId, row)}
                                                            sx={{ color: "brown" }}
                                                            startIcon={<DeleteIcon />}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    )))}
                    </TableBody>
                </Table>
            </div>


            {/* Add region dialog */}
            <AddRegionDialog
                open={openAddRegionDialog}
                handleClose={() => setOpenAddRegionDialog(false)}
                handleAdd={handleAddRegion}
            />
            <EditRegionsDialog
                open={openEditRegionDialog}
                tempData={tempData}
                handleSearchInputChange={handleSearchInputChange}
                handleFinishEditingRow={handleFinishEditingRow}
                handleSave={handleSave}
            />

            <DeleteDialog
                open={openConfirmation}
                handleClose={() => setOpenConfirmation(false)}
                handleDelete={handleConfirmDelete}
            />

        </div >
    );
}

export default RegionsPage;