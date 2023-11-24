import React, { useState, useEffect } from "react";
import {
  TablePagination, InputAdornment, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button,
  TextField, Typography, ThemeProvider, listItemTextClasses
} from "@mui/material";
import Theme from '../../admin_pages/Theme';

// components
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

  const [data, setData] = useState([]); // original data
  const [displayData, setDisplayData] = useState([]); // data displayed in the table
  const [editingId, setEditingId] = useState(null); // species_id of the row being edited
  const [tempEditingData, setTempEditingData] = useState({}); // data of the species being edited
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false); // state of the editing an alternative species dialog
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false); // state of the adding a new alternative species dialog
  const [searchBarInput, setSearchBarInput] = useState(""); // input of the species search bar
  const [searchBarDropdownResults, setSearchBarDropdownResults] = useState(displayData.map((item) => ({ // dropdown options in the search bar
    label: item.scientific_name, value: item.scientific_name
  })));
  const [deleteId, setDeleteId] = useState(null); // species_id of the row being deleted
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog 

  // fetches alternative species data 
  const handleGetSpecies = () => {

    // helper function that capitalizes each word
    const capitalizeWordsSplitUnderscore = (str) => {
      return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // helper function that capitalizes each word
    const capitalizeWordsSplitSpace = (str) => {
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // request to GET all alternative species
    axios
      .get(`${API_ENDPOINT}alternativeSpecies`)
      .then((response) => {  

        // formats data 
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

        // update states
        setDisplayData(formattedData);
        setData(formattedData);
        setSearchBarDropdownResults(formattedData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));
      })
      .catch((error) => {
        console.error("Error retrieving alternative species", error);
      });
  };
  useEffect(() => {
    handleGetSpecies();
  }, []); 

  // filters display data based on user search input
  useEffect(() => {
    // user can search up species by scientific name or common name
    const filteredData = data.filter((item) =>
    (searchBarInput === "" || (
      item.scientific_name.some((name) =>
        name.toLowerCase().includes(searchBarInput.toLowerCase())
      ) ||
      item.common_name.some((name) =>
        name.toLowerCase().includes(searchBarInput.toLowerCase())
      )
    )))

    // update display data when user searches up a species
    if (searchBarInput !== "") {
      setDisplayData(filteredData);
    }

    // update the search results based on filtered data
    const results = filteredData.map((item) => ({
      label: item.scientific_name,
      value: item.scientific_name,
    }));

    setSearchBarDropdownResults(results);
  }, [searchBarInput, data]);

  // begin editing a species
  const startEdit = (species_id, rowData) => {
    setEditingId(species_id);
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after finishing editing a species and saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingId(null);
  };

  // updates changes to the database on save
  const handleSave = (confirmed) => {
    // helper function that formats a string by spliting it based on commas and spacces
    const formatString = (str) => str.split(/,\s*|\s*,\s*/);

    if (confirmed) {
      // make sure that fields are proper data structure
      const formattedData = {
        ...tempEditingData,
        scientific_name: typeof tempEditingData.scientific_name === 'string' ? formatString(tempEditingData.scientific_name) : tempEditingData.scientific_name,
        common_name: typeof tempEditingData.common_name === 'string' ? formatString(tempEditingData.common_name) : tempEditingData.common_name,
      };

      // maps species_id to image_url if links exist and is not empty
      const plantImages = (formattedData.image_links && formattedData.image_links.length > 0) ?
        formattedData.image_links.map(link => ({ species_id: formattedData.species_id, image_url: link })) : null;

      // maps species_id to image s3_key if keys exist and is not empty
      const imageS3Keys = (formattedData.s3_keys && formattedData.s3_keys.length > 0) ?
        formattedData.s3_keys.map(key => ({ species_id: formattedData.species_id, s3_key: key })) : null;

      console.log("to save s3 keys: ", imageS3Keys)
      console.log("to save images: ", plantImages)

      // add new image links only
      const imagesToAdd = (plantImages && plantImages.length > 0) ?
        plantImages.filter(img =>
          !formattedData.images.some(existingImg => existingImg.image_url === img.image_url)
        ) : null;

      // add new s3 keys only
      const s3KeysToAdd = (imageS3Keys && imageS3Keys.length > 0) ?
        imageS3Keys.filter(key =>
          !formattedData.images.some(existingImg => existingImg.s3_key === key.s3_key)
        ) : null;


      console.log("to add images (links): ", imagesToAdd)
      console.log("to add images (keys): ", s3KeysToAdd)

      // POST new images to the database
      function postImages(images) {
        if (images && images.length > 0) {
          images.forEach(img => {
            axios
              .post(API_ENDPOINT + "plantsImages", img)
              .then(response => {
                console.log("Images updated successfully", response.data);
              })
              .catch(error => {
                console.error("Error adding image", error);
              });
          });
        }
      }

      postImages(imagesToAdd);
      postImages(s3KeysToAdd);

      // update alternative species table
      axios
        .put(`${API_ENDPOINT}alternativeSpecies/${tempEditingData.species_id}`, formattedData)
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
    setTempEditingData((prev) => ({ ...prev, [field]: value }));
  };

  // sets species that match search
  const handleSearch = (searchInput) => {
    console.log(typeof searchInput);
    console.log("search input: ", searchInput);

    // display original data when no search option chosen
    if (searchInput === "") {
      setDisplayData(data);
    } else {
      // filter display data by search input
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


  // add new alternative species
  const handleAddSpecies = (newSpeciesData) => {
    console.log("new alternative species: ", newSpeciesData);

    axios
      .post(API_ENDPOINT + "alternativeSpecies", newSpeciesData)
      .then((response) => {
        console.log("Alternative species added successfully", response);

        // Plant data with image links
        let plantsWithImgLinks = [];
        if (newSpeciesData.image_links && newSpeciesData.image_links.length > 0) {
          plantsWithImgLinks = newSpeciesData.image_links.map((image_link) => ({
            species_id: response.data[0].species_id,
            image_url: image_link,
          }));
        }

        // Plant data with image files
        let plantsWithImgFiles = [];
        if (newSpeciesData.s3_keys && newSpeciesData.s3_keys.length > 0) {
          plantsWithImgFiles = newSpeciesData.s3_keys.map((key) => ({
            species_id: response.data[0].species_id,
            s3_key: key,
          }));
        }

        const allPlantImages = plantsWithImgLinks.concat(plantsWithImgFiles);
        console.log("merged plants: ", allPlantImages);

        // upload plant images 
        allPlantImages.forEach((plantData) => {
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

  // pagination states
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
          searchResults={searchBarDropdownResults}
          searchTerm={searchBarInput}
          setSearchTerm={setSearchBarInput}
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
                .map((row) => (
                  <TableRow key={row.species_id}>
                    {/* editing the row */}              
                    {editingId === row.species_id ? (
                      <>
                        {/* scientific name */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={
                              Array.isArray(tempEditingData.scientific_name)
                                ? tempEditingData.scientific_name.join(", ")
                                : tempEditingData.scientific_name
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
                              Array.isArray(tempEditingData.common_name)
                                ? tempEditingData.common_name.join(", ")
                                : tempEditingData.common_name
                            }
                            onChange={(e) =>
                              handleSearchInputChange("common_name", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* decsription */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={boldText(tempEditingData.species_description)}
                            onChange={(e) =>
                              handleSearchInputChange("species_description", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* resource links */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>                        
                          <TextField
                            value={
                              Array.isArray(tempEditingData.resource_links)
                                ? tempEditingData.resource_links.join(", ")
                                : tempEditingData.resource_links
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
                                  {Array.isArray(tempEditingData.resource_links) ? (
                                    tempEditingData.resource_links.map((link, index) => (
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
                                          href={tempEditingData.resource_links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                          {tempEditingData.resource_links}
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
                              Array.isArray(tempEditingData.image_links)
                                ? tempEditingData.image_links.join(", ")
                                : tempEditingData.image_links
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
                                  {Array.isArray(tempEditingData.image_links) ? (
                                    tempEditingData.image_links.map((link, index) => (
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
                                          href={tempEditingData.image_links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                          {tempEditingData.image_links}
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

      <AddAlternativeSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
      />

      <EditAlternativeSpeciesDialog
        open={openEditSpeciesDialog}
        tempData={tempEditingData}
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
