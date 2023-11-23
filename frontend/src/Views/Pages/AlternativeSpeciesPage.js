import React, { useState, useEffect } from "react";
import { TablePagination, InputAdornment, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from '../../admin_pages/Theme';

import EditAlternativeSpeciesDialog from "../../dialogs/EditAlternativeSpeciesDialog";
import SearchComponent from '../../components/SearchComponent';
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddAlternativeSpeciesDialog from "../../dialogs/AddAlternativeSpeciesDialog";
import boldText from "./formatDescriptionHelper";

import axios from "axios";

function AlternativeSpeciesPage() {
  const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState(displayData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
  const [deleteId, setDeleteId] = useState(null);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);

  // get alternative species
  const handleGetSpecies = () => {
    const capitalizeWordsSplitUnderscore = (str) => {
      return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const capitalizeWordsSplitSpace = (str) => {
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    axios
      .get(`${API_ENDPOINT}alternativeSpecies`)
      .then((response) => {  

        // Capitalize each scientific_name 
        const formattedData = response.data.map(item => {
          const capitalizedScientificNames = item.scientific_name.map(name => capitalizeWordsSplitUnderscore(name));
          const capitalizedCommonNames = item.common_name.map(name => capitalizeWordsSplitSpace(name));
          const image_links = item.images.map(img => img.image_url);
          const s3_keys = item.images.map(img => img.s3_key);

          return {
            ...item,
            scientific_name: capitalizedScientificNames,
            common_name: capitalizedCommonNames,
            image_links: image_links,
            s3_keys: s3_keys
          };
        });

        console.log("get alternative species data:", formattedData)
        setDisplayData(formattedData);
        setData(formattedData);
        setSearchResults(formattedData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
      })
      .catch((error) => {
        console.error("Error retrieving alternative species", error);
      });
  };
  useEffect(() => {
    handleGetSpecies();
  }, []); 

  useEffect(() => {
    const filteredData = data.filter((item) =>
    (searchInput === "" || (
      item.scientific_name.some((name) =>
        name.toLowerCase().includes(searchInput.toLowerCase())
      ) ||
      item.common_name.some((name) =>
        name.toLowerCase().includes(searchInput.toLowerCase())
      )
    )))

    if (searchInput === "") {
      // do nothing
    } else {
      setDisplayData(filteredData);
    }

    // Update search results based on filtered data
    const results = filteredData.map((item) => ({
      label: item.scientific_name,
      value: item.scientific_name,
    }));

    setSearchResults(results);
  }, [searchInput, data]);

  // edit species row
  const startEdit = (species_id, rowData) => {
    setEditingId(species_id);
    setTempData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingId(null);
  };

  const handleSave = (confirmed) => {
    const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

    if (confirmed) {
      // make sure that fields are proper data structure
      const updatedTempData = {
        ...tempData,
        scientific_name: typeof tempData.scientific_name === 'string' ? splitByCommaWithSpaces(tempData.scientific_name) : tempData.scientific_name,
        common_name: typeof tempData.common_name === 'string' ? splitByCommaWithSpaces(tempData.common_name) : tempData.common_name,
      };

      console.log("updatedTempData:", updatedTempData)

      let plantImages;
      if (updatedTempData.image_links && updatedTempData.image_links.length > 0) {
        plantImages = updatedTempData.image_links.map((link) => {
        const image_url = link;
        const species_id = updatedTempData.species_id;
        return { species_id, image_url };
      })
      }

      let imageS3Keys;
      if (updatedTempData.s3_keys && updatedTempData.s3_keys.length > 0) {
        imageS3Keys = updatedTempData.s3_keys.map((key) => {
          const s3_key = key;
          const species_id = updatedTempData.species_id;
          return { species_id, s3_key };
        });
      }

      console.log("to save s3 keys: ", imageS3Keys)
      console.log("to save images: ", plantImages)

      // add new images only
      let imagesToAdd;
      if (plantImages && plantImages.length > 0) {
        imagesToAdd = plantImages.filter((img) => {
        return !updatedTempData.images.some((existingImg) => existingImg.image_url === img.image_url);
      });
      }

      let s3KeysToAdd;
      if (imageS3Keys && imageS3Keys.length > 0) {
        s3KeysToAdd = imageS3Keys.filter((key) => {
          return !updatedTempData.images.some((existingImg) => existingImg.s3_key === key.s3_key);
        });
      }

      console.log("to add images (links): ", imagesToAdd)
      console.log("to add images (links): ", s3KeysToAdd)

      // POST user uploaded image links
      if (imagesToAdd && imagesToAdd.length > 0) {
      imagesToAdd.forEach((img) => {
        axios
          .post(API_ENDPOINT + "plantsImages", img)
          .then((response) => {
            console.log("images updated successfully", response.data);
          })
          .catch((error) => {
            console.error("Error adding image", error);
          });
      });
      }

      // POST user uploaded image files
      if (s3KeysToAdd && s3KeysToAdd.length > 0) {
        s3KeysToAdd.forEach((img) => {
          axios
            .post(API_ENDPOINT + "plantsImages", img)
            .then((response) => {
              console.log("images updated successfully", response.data);
            })
            .catch((error) => {
              console.error("Error adding image", error);
            });
        });
      }

      // update alternative species
      axios
        .put(`${API_ENDPOINT}alternativeSpecies/${tempData.species_id}`, updatedTempData)
        .then((response) => {
          console.log("alternative species updated successfully", response.data);
          handleGetSpecies();
          handleFinishEditingRow();
        })
        .catch((error) => {
          console.error("Error updating species", error);
        });

  };
  };

  // opens confirmation dialog before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenDeleteConfirmation(true);
  };

  // deletes species from the table
  const handleConfirmDelete = () => {
    console.log("alt species id to delete: ", deleteId);
    if (deleteId) {
      axios
        .delete(`${API_ENDPOINT}alternativeSpecies/${deleteId}`)
        .then((response) => {
          handleGetSpecies();
          console.log("Species deleted successfully", response.data);
        })
        .catch((error) => {
          console.error("Error deleting species", error);
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
    console.log("got here: ", field, value)
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  // sets species that match search
  const handleSearch = (searchInput) => {
    console.log(typeof searchInput);
    console.log("search input: ", searchInput);

    if (searchInput === "") {
      setDisplayData(data);
    } else {
      const terms = searchInput.toLowerCase().split(" ");
      const results = data.filter((item) => {
        const scientificNameMatch = item.scientific_name.some((name) =>
          terms.every((term) => name.toLowerCase().includes(term))
        );

        const commonNameMatch = item.common_name.some((name) =>
          terms.every((term) => name.toLowerCase().includes(term))
        );

        return scientificNameMatch || commonNameMatch || searchInput === item.scientific_name.join(', ');
      });

      setDisplayData(results);
    }
  };


  // add species
  const handleAddSpecies = (newSpeciesData) => {
    console.log("new alternative species: ", newSpeciesData);

    axios
      .post(API_ENDPOINT + "alternativeSpecies", newSpeciesData)
      .then((response) => {
        console.log("Alternative species added successfully", response);

        // plant data with image links
        const plantDataArrLinks = newSpeciesData.image_links.map((image_link) => ({
          species_id: response.data[0].species_id,
          image_url: image_link,
        }));


        // plant data with image files
        const plantDataArrFiles = newSpeciesData.s3_keys.map((key) => ({
          species_id: response.data[0].species_id,
          s3_key: key,
        }));

        const mergedPlantData = plantDataArrLinks.concat(plantDataArrFiles);
        console.log("plant data array: ", mergedPlantData);


        // upload plant images 
        mergedPlantData.forEach((plantData) => {
          console.log("plant: ", plantData);
          axios
            .post(API_ENDPOINT + "plantsImages", plantData)
            .then((response) => {
              console.log("images added successfully", response.data);
              // get updated alternative species
              handleGetSpecies();
              setOpenAddSpeciesDialog(false);
            })
            .catch((error) => {
              console.error("Error adding image", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error adding alternative species", error);
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

      {/* search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
        <SearchComponent
          text={"Search alternative species (scientific or common name)"}
          handleSearch={handleSearch}
          searchResults={searchResults}
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
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
      <div style={{ width: "90%", display: "flex", justifyContent: "center", marginTop: "-20px" }}>
        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          {/* table header */}
          <TableHead>
            <TableRow>
              <TableCell style={{ width: "8%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Scientific Name
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Common Name(s)
                </Typography>
              </TableCell>
              <TableCell style={{ width: "35%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%", whiteSpace: 'normal', wordWrap: 'break-word' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resource Links
                </Typography>
              </TableCell>

              <TableCell style={{ width: "12%", whiteSpace: 'normal', wordWrap: 'break-word' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Image Links
                </Typography>
              </TableCell>

              <TableCell style={{ width: "5%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* table body: display species */}
          <TableBody>
            {(displayData && displayData.length > 0
              ? displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : [])
            // {displayData &&
            //   displayData
              // .sort((a, b) => a.scientific_name[0].localeCompare(b.scientific_name)[0])
                .map((row) => (
                  <TableRow key={row.species_id}>
                    {/* editing the row */}              
                    {editingId === row.species_id ? (
                      <>
                        {/* scientific name */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
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
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
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
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={boldText(tempData.species_description)}
                            onChange={(e) =>
                              handleSearchInputChange("species_description", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* resource links */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>                        
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
                            sx={{
                              width: '100%',
                              wordBreak: 'break-word'
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {Array.isArray(tempData.resource_links) ? (
                                    tempData.resource_links.map((link, index) => (
                                      <span key={index}>
                                        <a
                                          href={link}
                                          target="_blank" // new tab
                                          rel="noopener noreferrer" // security stuff
                                        >
                                          {link}
                                        </a>
                                        <br />
                                        <br />
                                      </span>
                                    ))
                                  ) : (
                                    <span>
                                      <a
                                        href={tempData.resource_links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {tempData.resource_links}
                                      </a>
                                      <br />
                                        <br />
                                    </span>
                                  )}
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={
                              Array.isArray(tempData.image_links)
                                ? tempData.image_links.join(", ")
                                : tempData.image_links
                            }
                            onChange={(e) =>
                              handleSearchInputChange(
                                "image_links",
                                e.target.value.split(", ")
                              )
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {Array.isArray(tempData.image_links) ? (
                                    tempData.image_links.map((link, index) => (
                                      <span key={index}>
                                        <a
                                          href={link}
                                          target="_blank" // new tab
                                          rel="noopener noreferrer" // security stuff
                                        >
                                          {link}
                                        </a>
                                        <br />
                                        <br />
                                      </span>
                                    ))
                                  ) : (
                                    <span>
                                      <a
                                        href={tempData.image_links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {tempData.image_links}
                                      </a>
                                      <br />
                                      <br />
                                    </span>
                                  )}
                                </InputAdornment>
                              ),
                            }}
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
                            onClick={() => {
                              handleDeleteRow(row.species_id, row)
                            }}>
                            <IconButton>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    ) : (
                      <>
                          {/* not editing the row */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.scientific_name)
                              ? row.scientific_name.join(", ")
                              : row.scientific_name}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.common_name)
                              ? row.common_name.join(", ")
                              : row.common_name}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {boldText(row.species_description)}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.resource_links) ? (
                              row.resource_links.map((link, index) => (
                                <span key={index}>
                                  <a href={link} target="_blank" rel="noopener noreferrer">
                                    {link}
                                  </a>
                                  <br />
                                  <br />
                                </span>
                              ))
                            ) : (
                              <span>
                                <a href={row.resource_links} target="_blank" rel="noopener noreferrer">
                                  {row.resource_links}
                                </a>
                                <br />
                                <br />
                              </span>
                            )}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.image_links) ? (
                              row.image_links.map((link, index) => (
                                <span key={index}>
                                  <a href={link} target="_blank" rel="noopener noreferrer">
                                    {link}
                                  </a>
                                  <br />

                                  {row.s3_keys && row.s3_keys[index] && (
                                    <span>
                                      <a href={`https://d123pl6gvdlen1.cloudfront.net/${row.s3_keys[index]}`} target="_blank" rel="noopener noreferrer">
                                        View Image
                                      </a>
                                      <br />
                                    </span>
                                  )}
                                  <br />
                                </span>
                              ))
                            ) : (
                              <span>
                                <a href={row.image_links} target="_blank" rel="noopener noreferrer">
                                  {row.image_links}
                                </a>
                                <br />
                                  {row.s3_keys && row.s3_keys.map((key, index) => (
                                    <span key={index}>
                                      <a href={`https://d123pl6gvdlen1.cloudfront.net/${key}`} target="_blank" rel="noopener noreferrer">
                                        View Image
                                      </a>
                                      <br />
                                    </span>
                                  ))}
                                <br />
                              </span>
                            )}
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
                              onClick={() => {
                                console.log("got here!!!");
                                handleDeleteRow(row.species_id, row)
                              }}>
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
        open={openDeleteConfirmation}
        handleClose={() => setOpenDeleteConfirmation(false)}
        handleDelete={handleConfirmDelete}
      />
    </div >
  );
}

export default AlternativeSpeciesPage;
