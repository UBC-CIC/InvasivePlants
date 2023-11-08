import React, { useState, useEffect } from "react";
import { Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from './Theme';

import RegionMap from "../functions/RegionMap";
import EditSpeciesDialog from "../dialogs/EditSpeciesDialogComponent";
import LocationFilterComponent from '../Components/LocationFilterComponent';
import SearchComponent from '../Components/SearchComponent';
import AddSpeciesDialog from "../dialogs/AddSpeciesDialogComponent";
import SpeciesTestData from "../test_data/speciesTestData";
import AlternativeSpeciesTestData from "../test_data/alternativeSpeciesTestData";
import DeleteDialog from "../dialogs/ConfirmDeleteDialog";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


function SpeciesPage() {
  const [data, setData] = useState(SpeciesTestData);
  const [displayData, setDisplayData] = useState(SpeciesTestData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(SpeciesTestData.map((item) => ({ label: item.scientificName, value: item.scientificName })));
  const [location, setLocation] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [alternativeSpeciesTestData, setAlternativeSpeciesTestData] = useState(AlternativeSpeciesTestData);

  // gets rows that matches search and location input 
  const filterData = data.filter((item) =>
    (searchTerm === "" || (
      item.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(item.commonName)
        ? item.commonName.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : item.commonName.toLowerCase().includes(searchTerm.toLowerCase()))
    )) &&
    (location === "" || item.location.some((loc) => RegionMap[loc.toLowerCase()] === RegionMap[location]))
  );

  useEffect(() => {
    if (searchTerm === "" && location === "") {
      setData(SpeciesTestData);
    } else {
      const results = filterData.map((item) => ({
        label: item.scientificName,
        value: item.scientificName,
      }));
      setSearchResults(results);
    }
  }, [searchTerm, filterData, location]);

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
  const handleSave = () => {
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
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  // search species
  const handleSearch = (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
    } else {
      const terms = searchInput.toLowerCase().split(" ");
      const results = data.filter((item) => {
        const scientificNameMatch = terms.every((term) =>
          item.scientificName.toLowerCase().includes(term)
        );

        const commonNameMatch = Array.isArray(item.commonName)
          ? item.commonName.some((name) =>
            terms.every((term) => name.toLowerCase().includes(term))
          )
          : terms.every((term) => item.commonName.toLowerCase().includes(term));

        return scientificNameMatch || commonNameMatch;
      });

      setDisplayData(results);
    }
  };

  // search location
  const handleLocationSearch = (locationInput) => {
    setLocation(locationInput);

    if (locationInput === "") {
      setDisplayData(data);
    } else {
      const results = data.filter((item) =>
        item.location.some((loc) => loc.toLowerCase().includes(locationInput.toLowerCase().trim()))
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          Invasive Species List
        </Typography>
      </Box>

      {/* location and search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <LocationFilterComponent
          handleLocationSearch={handleLocationSearch}
          location={location}
          setLocation={setLocation}
        />

        <SearchComponent
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
          Add Species
        </Button>
        </ThemeProvider>
      </div>

      {/* table */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          {/* table header */}
          <TableHead>
            <TableRow>
              <TableCell style={{ width: "8%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Scientific Name
                </Typography>
              </TableCell>
              <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Common Name(s)
                </Typography>
              </TableCell>
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
              (location !== ""
                ? displayData
                .filter((item) =>
                  item.location.some((loc) => loc.toLowerCase().includes(location.toLowerCase().trim()))
                )
                  .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
                  .map((row) => (
                    <TableRow key={row.speciesId}>
                      {/* editing the row */}
                      {editingId === row.speciesId ? (
                        <>
                          {/* scientific name */}
                          <TableCell>
                            <TextField
                              value={tempData.scientificName}
                              onChange={(e) =>
                                handleSearchInputChange("scientificName", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* common name */}
                          <TableCell>
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
                          </TableCell>

                          {/* decsription */}
                          <TableCell>
                            <TextField
                              value={tempData.description}
                              onChange={(e) =>
                                handleSearchInputChange("description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.alternatives)
                                  ? tempData.alternatives.map((alternative) => {
                                    const foundOption = AlternativeSpeciesTestData.find(
                                      (option) => option.alternativeScientificName === alternative
                                    );
                                    return foundOption ? foundOption.alternativeScientificName : "";
                                  })
                                  : []
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "alternatives",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell>
                            <TextField
                              value={tempData.links?.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "links",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* region */}
                          <TableCell>
                            <TextField
                              value={tempData.location.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "region",
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
                          <TableCell>{row.scientificName}</TableCell>
                          <TableCell>
                            {Array.isArray(row.commonName)
                              ? row.commonName.join(", ")
                              : row.commonName}
                          </TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                              {Array.isArray(row.alternatives)
                                ? row.alternatives.map((item) => item.alternativeScientificName).join(", ")
                                : row.alternatives}
                          </TableCell>
                            <TableCell>
                              {Array.isArray(row.links) ? row.links.join(", ") : row.links}
                            </TableCell>
                            <TableCell>
                              {Array.isArray(row.location)
                                ? row.location.join(", ")
                                : row.location}
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
                  .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
                  .map((row) => (
                    <TableRow key={row.speciesId}>
                      {/* editing the row */}
                      {editingId === row.speciesId ? (
                        <>
                          {/* scientific name */}
                          <TableCell>
                            <TextField
                              value={tempData.scientificName}
                              onChange={(e) =>
                                handleSearchInputChange("scientificName", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* common name */}
                          <TableCell>
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
                          </TableCell>

                          {/* decsription */}
                          <TableCell>
                            <TextField
                              value={tempData.description}
                              onChange={(e) =>
                                handleSearchInputChange("description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.alternatives)
                                  ? tempData.alternatives.map((alternative) => {
                                    const foundOption = AlternativeSpeciesTestData.find(
                                      (option) => option.alternativeScientificName === alternative
                                    );
                                    return foundOption ? foundOption.alternativeScientificName : "";
                                  })
                                  : []
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "alternatives",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell>
                            <TextField
                              value={tempData.links?.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "links",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* region */}
                          <TableCell>
                            <TextField
                              value={tempData.location.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "region",
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
                          <TableCell>{row.scientificName}</TableCell>
                          <TableCell>
                            {Array.isArray(row.commonName)
                              ? row.commonName.join(", ")
                              : row.commonName}
                          </TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                              {Array.isArray(row.alternatives)
                                ? row.alternatives.map((item) => item.alternativeScientificName).join(", ")
                                : row.alternatives}
                            </TableCell>
                            <TableCell>
                              {Array.isArray(row.links) ? row.links.join(", ") : row.links}
                            </TableCell>
                            <TableCell>
                              {Array.isArray(row.location)
                                ? row.location.join(", ")
                                : row.location}
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
      <AddSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
      />

      <EditSpeciesDialog
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

export default SpeciesPage;
