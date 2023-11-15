import React, { useState, useEffect } from "react";
import { TablePagination, Dialog, Snackbar, Alert, AlertTitle, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from '../../admin_pages/Theme';

import RegionMap from "../../functions/RegionMap";
import EditInvasiveSpeciesDialog from "../../dialogs/EditInvasiveSpeciesDialog";
import LocationFilterComponent from '../../components/LocationFilterComponent';
import SearchComponent from '../../components/SearchComponent';
import AddInvasiveSpeciesDialog from "../../dialogs/AddInvasiveSpeciesDialog";
import SpeciesTestData from "../../test_data/invasiveSpeciesTestData";
import AlternativeSpeciesTestData from "../../test_data/alternativeSpeciesTestData";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import boldText from "./formatDescriptionHelper";
import RegionsTestData from '../../test_data/regionsTestData';

import axios from "axios";

function InvasiveSpeciesPage() {
  const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(displayData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
  const [region_id, setRegionId] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);


  const handleGetSpecies = () => {
    axios
      .get(`${API_ENDPOINT}invasiveSpecies`)
      .then((response) => {
        // console.log("Invasive species retrieved successfully", response.data);
        setDisplayData(response.data);
        setData(response.data);
        setSearchResults(response.data.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
      })
      .catch((error) => {
        console.error("Error retrieving invasive species", error);
      });
  };
  useEffect(() => {
    handleGetSpecies();
  }, []); 

  // gets rows that matches search and location input 
  const filterData = data.filter((item) =>
    (searchTerm === "" || (
      (Array.isArray(item.scientific_name)
        ? item.scientific_name.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : item.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )) &&
    (region_id === "" || item.region_id.some((loc) => RegionMap[loc.toLowerCase()] === RegionMap[region_id]))
  );

  useEffect(() => {
    if (searchTerm === "" && region_id === "") {
      // do nothing
      // setData(SpeciesTestData);
    } else {
      const results = filterData.map((item) => ({
        label: item.scientific_name,
        value: item.scientific_name,
      }));
      setSearchResults(results);
    }
  }, [searchTerm, filterData, region_id]);

  // edit species row
  const startEdit = (id, rowData) => {
    setEditingId(id);
    setTempData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingId(null);
  };

  // saves edited row
  const handleSave = (confirmed) => {
    const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

    if (confirmed) {

      const updatedTempData = {
        ...tempData,
        scientific_name: typeof tempData.scientific_name === 'string' ? splitByCommaWithSpaces(tempData.scientific_name) : tempData.scientific_name,
        common_name: typeof tempData.common_name === 'string' ? splitByCommaWithSpaces(tempData.common_name) : tempData.common_name,
      };

      console.log("data: ", updatedTempData);

      axios
        .put(`${API_ENDPOINT}invasiveSpecies/${tempData.species_id}`, updatedTempData)
        .then((response) => {
          console.log("Species updated successfully", response.data);
          handleGetSpecies();
          handleFinishEditingRow();
        })
        .catch((error) => {
          console.error("Error updating species", error);
        });
  };
  };

  // delete row with Confirmation before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenConfirmation(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    console.log("invasive species id to delete: ", deleteId);

    if (deleteId) {
      axios
        .delete(`${API_ENDPOINT}invasiveSpecies/${deleteId}`)
        .then((response) => {
          handleGetSpecies();
          console.log("Species deleted successfully", response.data);
        })
        .catch((error) => {
          console.error("Error deleting species", error);
        })
        .finally(() => {
          setOpenConfirmation(false);
        });
    } else {
      setOpenConfirmation(false);
    }
  };


  // helper function when search input changes
  const handleSearchInputChange = (field, value) => {
    if (field === "region_code_name") {
      setTempData((prev) => ({ ...prev, region_id: value }));
    }
    else {
    setTempData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // search species
  const handleSearch = (searchInput) => {
    console.log(typeof searchInput);
    console.log("search input: ", searchInput);

    if (searchInput === "") {
      setDisplayData(data);
    } else {
      const terms = searchInput.toLowerCase().split(" ");
      const results = data.filter((item) => {
        const scientificNameMatch = Array.isArray(item.scientific_name)
          ? item.scientific_name.some((name) =>
            terms.every((term) => name.toLowerCase().includes(term))
          )
          : terms.every((term) =>
          item.scientific_name.toLowerCase().includes(term)
        );


        return scientificNameMatch || searchInput === item.scientific_name.join(", ");
      });

      setDisplayData(results);
    }
  };

  // search location
  const handleLocationSearch = (locationInput) => {
    setRegionId(locationInput);

    if (locationInput === "") {
      setDisplayData(data);
    } else {
      const results = data.filter((item) =>
        item.region_id.some((loc) => loc.toLowerCase().includes(locationInput.toLowerCase().trim()))
      );
      console.log("results: ", results);
      setDisplayData(results);
    }
  }
  // add species
  const handleAddSpecies = (newSpeciesData) => {
    console.log("new invasive species: ", newSpeciesData);

    axios
      .post(API_ENDPOINT + "invasiveSpecies", newSpeciesData)
      .then((response) => {
        console.log("Invasive Species added successfully", response.data);
        handleGetSpecies();
        setOpenAddSpeciesDialog(false);
      })
      .catch((error) => {
        console.error("Error adding invasive species", error);
      });
  };


  const rowsPerPageOptions = [3, 10, 25, 50, 100];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[2]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* title */}
      {/* <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          Invasive Species List
        </Typography>
      </Box> */}

      {/* location and search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
        <LocationFilterComponent
          text={"Search by region"}
          mapTo={"region_code_name"}
          inputData={RegionsTestData}
          handleLocationSearch={handleLocationSearch}
          location={region_id}
          setLocation={setRegionId}
        />

        <SearchComponent
          text={"Search invasive species (scientific name)"}
          handleSearch={handleSearch}
          searchResults={searchResults}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* button to add species */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => setOpenAddSpeciesDialog(true)} startIcon={<AddCircleOutlineIcon />}>
            Add Invasive Species
          </Button>
        </ThemeProvider>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', marginLeft: "70%", marginTop: '10px' }}>
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={displayData ? displayData.length : 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>

      {/* table */}
      <div style={{ width: "90%", display: "flex", justifyContent: "center" }}>
        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          {/* table header */}
          <TableHead>
            <TableRow>
              <TableCell style={{ width: "8%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Scientific Name
                </Typography>
              </TableCell>
              {/* <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Common Name(s)
                </Typography>
              </TableCell> */}
              <TableCell style={{ width: "40%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Alternative Species
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resources
                </Typography>
              </TableCell>
              <TableCell style={{ width: "8%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Region(s)
                </Typography>
              </TableCell>
              <TableCell style={{ width: "9%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* table body: display species */}
          <TableBody>
            {displayData &&
              (region_id !== ""
                ? displayData
                  .filter((item) =>
                    item.region_id.some((loc) => loc.toLowerCase().includes(region_id.toLowerCase().trim()))
                  )
                // .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name))
                  .map((row) => (
                    <TableRow key={row.species_id}>
                      {/* editing the row */}
                      {editingId === row.species_id ? (
                        <>
                          {/* scientific name */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.scientific_name)
                                  ? tempData.scientific_name.join(", ")
                                  : tempData.scientific_name
                              }
                              onChange={(e) =>
                                handleSearchInputChange("scientific_name", e.target.value)
                              }
                            />
                          </TableCell>


                          {/* decsription */}
                          <TableCell>
                            <TextField
                              value={boldText(tempData.species_description)}
                              onChange={(e) =>
                                handleSearchInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.alternative_species)
                                  ? tempData.alternative_species.map((alternative) => {
                                    const foundOption = AlternativeSpeciesTestData.find(
                                      (option) => option.scientific_name === alternative
                                    );
                                    return foundOption ? foundOption.scientific_name : "";
                                  })
                                  : []
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "alternative_species",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.resource_links)
                                  ? tempData.resource_links.join(", ")
                                  : tempData.resource_links
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "resource_links",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* region */}
                          <TableCell>
                            <TextField
                              value={tempData.region_id.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "region_id",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>



                          {/* edit/delete */}
                          <TableCell>
                            <Tooltip title="Edit"
                              onClick={() => startEdit(row.species_id, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.species_id, row)}>
                              <IconButton>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : (
                        <>
                            {/* <TableCell>{row.scientific_name}</TableCell> */}
                            <TableCell>
                              {Array.isArray(row.scientific_name)
                                ? row.scientific_name.join(", ")
                                : row.scientific_name}
                            </TableCell>
                            {/* <TableCell>
                            {Array.isArray(row.commonName)
                              ? row.commonName.join(", ")
                              : row.commonName}
                          </TableCell> */}
                            <TableCell>{boldText(row.species_description)}</TableCell>
                          <TableCell>
                              {Array.isArray(row.alternative_species)
                                ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                                : row.alternative_species}
                          </TableCell>
                          <TableCell>
                              {Array.isArray(row.resource_links) ? row.resource_links.join(", ") : row.resource_links}
                          </TableCell>
                          <TableCell>
                              {Array.isArray(row.region_id)
                                ? row.region_id.join(", ")
                                : row.region_id}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit"
                                onClick={() => startEdit(row.species_id, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                                onClick={() => handleDeleteRow(row.species_id, row)}>
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
                // .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name))
                  .map((row) => (
                    <TableRow key={row.species_id}>
                      {/* editing the row */}
                      {editingId === row.species_id ? (
                        <>
                          {/* scientific name */}
                          <TableCell>
                            {/* <TextField
                              value={tempData.scientific_name}
                              onChange={(e) =>
                                handleSearchInputChange("scientific_name", e.target.value)
                              }
                            /> */}
                            <TextField
                              value={
                                Array.isArray(tempData.scientific_name)
                                  ? tempData.scientific_name.join(", ")
                                  : tempData.scientific_name
                              }
                              onChange={(e) =>
                                handleSearchInputChange("scientific_name", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* decsription */}
                          <TableCell>
                            <TextField
                              value={boldText(tempData.species_description)}
                              onChange={(e) =>
                                handleSearchInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.alternative_species)
                                  ? tempData.alternative_species.map((alternative) => {
                                    const foundOption = AlternativeSpeciesTestData.find(
                                      (option) => option.scientific_name === alternative
                                    );
                                    return foundOption ? foundOption.scientific_name : "";
                                  })
                                  : []
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "alternative_species",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.resource_links)
                                  ? tempData.resource_links.join(", ")
                                  : tempData.resource_links
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "resource_links",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* region */}
                          <TableCell>
                            <TextField
                              value={tempData.region_id.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "region_id",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* edit/delete */}
                          <TableCell>
                            <Tooltip title="Edit"
                              onClick={() => startEdit(row.species_id, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.species_id, row)}>
                              <IconButton>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : (
                          <>
                            <TableCell>
                              {Array.isArray(row.scientific_name)
                                ? row.scientific_name.join(", ")
                                : row.scientific_name}
                            </TableCell>
                            <TableCell>{boldText(row.species_description)}</TableCell>
                          <TableCell>
                              {Array.isArray(row.alternative_species)
                                ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                                : row.alternative_species}
                          </TableCell>
                          <TableCell>
                              {Array.isArray(row.resource_links) ? row.resource_links.join(", ") : row.resource_links}
                          </TableCell>
                          <TableCell>
                              {Array.isArray(row.region_id)
                                ? row.region_id.join(", ")
                                : row.region_id}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit"
                                onClick={() => startEdit(row.species_id, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                                onClick={() => handleDeleteRow(row.species_id, row)}>
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
      </div >

      {/* Add species dialog */}
      <AddInvasiveSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
      />

      <EditInvasiveSpeciesDialog
        open={openEditSpeciesDialog}
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

export default InvasiveSpeciesPage;
