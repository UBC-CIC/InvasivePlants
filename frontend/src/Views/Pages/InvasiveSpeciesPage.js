import React, { useState, useEffect } from "react";
import { Dialog, Snackbar, Alert, AlertTitle, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
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
import RegionsTestData from '../../test_data/regionsTestData'

function InvasiveSpeciesPage() {
  const [data, setData] = useState(SpeciesTestData);
  const [displayData, setDisplayData] = useState(SpeciesTestData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(SpeciesTestData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
  const [region_id, setRegionId] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [alternativeSpeciesTestData, setAlternativeSpeciesTestData] = useState(AlternativeSpeciesTestData);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // gets rows that matches search and location input 
  const filterData = data.filter((item) =>
    (searchTerm === "" || (
      (Array.isArray(item.scientific_name)
        ? item.scientific_name.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : item.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()))

      // item.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())
      // ||
      // (Array.isArray(item.commonName)
      //   ? item.commonName.some((name) =>
      //     name.toLowerCase().includes(searchTerm.toLowerCase())
      //   )
      //   : item.commonName.toLowerCase().includes(searchTerm.toLowerCase()))
    )) &&
    (region_id === "" || item.region_id.some((loc) => RegionMap[loc.toLowerCase()] === RegionMap[region_id]))
  );

  useEffect(() => {
    if (searchTerm === "" && region_id === "") {
      setData(SpeciesTestData);
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
    if (confirmed) {
    const updatedData = data.map((item) => {
      if (item.speciesId === tempData.speciesId) {
        return { ...tempData };
      }
      return item;

    });

    setData(updatedData);

    // Preserve the edited row in the display data
    const updatedDisplayData = displayData.map((item) => {
      if (item.speciesId === tempData.speciesId) {
        return { ...tempData };
      }
      return item;
    });
    setDisplayData(updatedDisplayData);

    // TODO: update the database with the updatedData
    handleFinishEditingRow();
  };
  };

  // delete row with Confirmation before deletion
  const handleDeleteRow = (speciesId) => {
    setDeleteId(speciesId);
    setOpenConfirmation(true);
    console.log("id to delete: ", deleteId);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteId) {
      setDisplayData((prev) =>
        prev.filter((item) => item.speciesId !== deleteId));
      // TODO: need to delete in from database
    }
    setOpenConfirmation(false);
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
        // || commonNameMatch;
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
    // Generate a unique speciesId for the new species
    const newSpeciesId = displayData.length + 1;

    // Create a new species object with the generated speciesId
    const newSpecies = {
      speciesId: newSpeciesId,
      ...newSpeciesData,
    };

    setDisplayData([...displayData, newSpecies]);
    setOpenAddSpeciesDialog(false);
    console.log("speciesId: ", newSpecies.speciesId);

    // TODO: update the database with the new entry
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
                    <TableRow key={row.speciesId}>
                      {/* editing the row */}
                      {editingId === row.speciesId ? (
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
                              onClick={() => startEdit(row.speciesId, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.speciesId, row)}>
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
                              onClick={() => startEdit(row.speciesId, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.speciesId, row)}>
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
                    <TableRow key={row.speciesId}>
                      {/* editing the row */}
                      {editingId === row.speciesId ? (
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

                          {/* common name */}
                          {/* <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.commonName)
                                  ? tempData.commonName.join(", ")
                                  : tempData.commonName
                              }
                              onChange={(e) =>
                                handleSearchInputChange("commonName", e.target.value)
                              }
                            />
                          </TableCell> */}

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
                              onClick={() => startEdit(row.speciesId, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.speciesId, row)}>
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
                              onClick={() => startEdit(row.speciesId, row)}>
                              <IconButton>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title="Delete"
                              onClick={() => handleDeleteRow(row.speciesId, row)}>
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
