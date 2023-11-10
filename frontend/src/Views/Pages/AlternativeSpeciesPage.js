import React, { useState, useEffect } from "react";
import { Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from '../../admin_pages/Theme';

import EditAlternativeSpeciesDialog from "../../dialogs/EditAlternativeSpeciesDialog";
import SearchComponent from '../../components/SearchComponent';
import AlternativeSpeciesTestData from "../../test_data/alternativeSpeciesTestData";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddAlternativeSpeciesDialog from "../../dialogs/AddAlternativeSpeciesDialog";
import boldText from "./formatDescriptionHelper";

import axios from "axios";

function AlternativeSpeciesPage() {
  const [data, setData] = useState(AlternativeSpeciesTestData);
  const [displayData, setDisplayData] = useState(AlternativeSpeciesTestData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(AlternativeSpeciesTestData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
  const [deleteId, setDeleteId] = useState(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);


  const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/region";

  // gets rows that matches search and location input 
  const filterData = data.filter((item) =>
  (searchTerm === "" || (
    item.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(item.common_name)
      ? item.common_name.some((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      : item.common_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ))
  );

  useEffect(() => {
    if (searchTerm === "") {
      setData(AlternativeSpeciesTestData);
    } else {
      const results = filterData.map((item) => ({
        label: item.scientific_name,
        value: item.scientific_name,
      }));
      setSearchResults(results);
    }
  }, [searchTerm, filterData]);

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
      if (item.alternativeSpeciesId === tempData.alternativeSpeciesId) {
        return { ...tempData };
      }
      return item;

    });

    setData(updatedData);

    // Preserve the edited row in the display data
    const updatedDisplayData = displayData.map((item) => {
      if (item.alternativeSpeciesId === tempData.alternativeSpeciesId) {
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
  const handleDeleteRow = (alternativeSpeciesId) => {
    setDeleteId(alternativeSpeciesId);
    setOpenConfirmation(true);
    console.log("id to delete: ", deleteId);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteId) {
      setDisplayData((prev) =>
        prev.filter((item) => item.alternativeSpeciesId !== deleteId));
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
          item.scientific_name.toLowerCase().includes(term)
        );

        const commonNameMatch = Array.isArray(item.common_name)
          ? item.common_name.some((name) =>
            terms.every((term) => name.toLowerCase().includes(term))
          )
          : terms.every((term) => item.common_name.toLowerCase().includes(term));

        return scientificNameMatch || commonNameMatch;
      });

      setDisplayData(results);
    }
  };

  // add species
  const handleAddSpecies = (newSpeciesData) => {
    // TODO: get species id from database
    // Generate a unique alternativeSpeciesId for the new species
    // const newSpeciesId = displayData.length + 1;

    // Create a new species object with the generated speciesId
    const newSpecies = {
      // alternativeSpeciesId: newSpeciesId,
      ...newSpeciesData,
    };

    console.log("new alternative species: ", newSpecies);

    setDisplayData([...displayData, newSpecies]);
    setOpenAddSpeciesDialog(false);

    // TODO: update the database with the new entry
    // curl -X POST -H "Content-Type: application/json" -d '{
    //   "scientific_name": ["test"],
    //   "common_name": ["test1"],
    //   "resource_links": ["11"],
    //   "image_links": [],
    //   "species_description": "balbslbflkasjdfhkjasdhf"
    // }' "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/alternativeSpecies"


    // axios
    //   .post(API_ENDPOINT, newSpecies)
    //   .then((response) => {
    //     console.log("species added successfully", response.data);
    //     setDisplayData([...displayData, newSpecies]);
    //     setOpenAddSpeciesDialog(false);
    //   })
    //   .catch((error) => {
    //     console.error("Error adding alternative species", error);
    //   });
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* title */}
      {/* <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          Alternative Species List
        </Typography>
      </Box> */}

      {/* lsearch bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
        <SearchComponent
          text={"Search alternative species (scientific or common name)"}
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
            Add Alternative Species
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
              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resource Links
                </Typography>
              </TableCell>

              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Image Links
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
              displayData
              .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name))
                .map((row) => (
                  <TableRow key={row.alternativeSpeciesId}>
                    {/* editing the row */}
                    {editingId === row.alternativeSpeciesId ? (
                      <>
                        {/* scientific name */}
                        <TableCell>
                          <TextField
                            value={tempData.scientific_name}
                            onChange={(e) =>
                              handleSearchInputChange("scientific_name", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* common name */}
                        <TableCell>
                          <TextField
                            value={
                              Array.isArray(tempData.common_name)
                                ? tempData.common_name.join(", ")
                                : tempData.common_name
                            }
                            onChange={(e) =>
                              handleSearchInputChange("common_name", e.target.value)
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

                        {/* resource links */}
                        <TableCell>
                          <TextField
                            value={tempData.resource_links?.join(", ")}
                            onChange={(e) =>
                              handleSearchInputChange(
                                "resourceLinks",
                                e.target.value.split(", ")
                              )
                            }
                          />
                        </TableCell>

                        {/* image links */}
                        <TableCell>
                          <TextField
                            value={
                              Array.isArray(tempData.image_links)
                                ? tempData.image_links.join(", ")
                                : tempData.image_links
                            }
                            onChange={(e) =>
                              handleSearchInputChange("image_links", e.target.value.split(", "))
                            }
                          />
                        </TableCell>

                        {/* edit/delete */}
                        <TableCell>
                          <Tooltip title="Edit"
                            onClick={() => startEdit(row.alternativeSpeciesId, row)}>
                            <IconButton>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title="Delete"
                            onClick={() => handleDeleteRow(row.alternativeSpeciesId, row)}>
                            <IconButton>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    ) : (
                      <>
                          <TableCell>{row.scientific_name}</TableCell>
                        <TableCell>
                            {Array.isArray(row.common_name)
                              ? row.common_name.join(", ")
                              : row.common_name}
                        </TableCell>
                          <TableCell>{boldText(row.species_description)}</TableCell>
                        <TableCell>
                          {Array.isArray(row.resource_links) ? row.resource_links.join(", ") : row.resource_links}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(row.image_links) ? row.image_links.join(", ") : row.image_links}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit"
                            onClick={() => startEdit(row.alternativeSpeciesId, row)}>
                            <IconButton>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title="Delete"
                            onClick={() => handleDeleteRow(row.alternativeSpeciesId, row)}>
                            <IconButton>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div >

      {/* Add species dialog */}
      <AddAlternativeSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
      />

      <EditAlternativeSpeciesDialog
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

export default AlternativeSpeciesPage;
