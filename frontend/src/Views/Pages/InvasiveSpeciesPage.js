import React, { useState, useEffect } from "react";
import {
  InputAdornment, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow,
  Button, TextField, Typography, ThemeProvider
} from "@mui/material";
import Theme from './Theme';
import { Auth } from "aws-amplify";

// components
import LocationFilterComponent from '../../components/LocationFilterComponent';
import SearchComponent from '../../components/SearchComponent';
import PaginationComponent from '../../components/PaginationComponent';
import EditInvasiveSpeciesDialog from "../../dialogs/EditInvasiveSpeciesDialog";
import AddInvasiveSpeciesDialog from "../../dialogs/AddInvasiveSpeciesDialog";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import handleGetRegions from "../../functions/RegionMap"

// icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';

import axios from "axios";
import { boldText, formatString, capitalizeFirstWord } from '../../functions/helperFunctions';

function InvasiveSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [allInvasiveSpecies, setAllInvasiveSpecies] = useState([]); // all invasive species in database
  const [allInvasiveSpeciesNames, setAllInvasiveSpeciesNames] = useState([]); // array of invasive species names
  const [allAlternativeSpecies, setAllAlternativeSpecies] = useState([]); // array of all alternative species
  const [speciesCount, setSpeciesCount] = useState(0); // number of invasive species
  const [data, setData] = useState([]); // original data
  const [displayData, setDisplayData] = useState([]); // data displayed in the table
  const [editingSpeciesId, setEditingSpeciesId] = useState(null); // species_id of the row being edited
  const [tempEditingData, setTempEditingData] = useState({}); // data of the species being edited
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false); // state of the editing an invasive species dialog
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false); // state of the adding an invasive species dialog
  const [searchInput, setSearchInput] = useState(""); // input of the species search bar
  const [regionCodeName, setRegionCodeName] = useState([]); // region code name (ex. BC)
  const [regionMap, setRegionsMap] = useState({}); // maps region code name to region id
  const [deleteId, setDeleteId] = useState(null); // species_id of the row being deleted
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog 
  const [regionId, setRegionId] = useState(""); // current region id

  const [currOffset, setCurrOffset] = useState(0); // current index of the first species on a page
  const [shouldReset, setShouldReset] = useState(false); // reset above values
  const [shouldSave, setShouldSave] = useState(false); // reset above values

  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disabled, setDisabled] = useState(false); // disabled next button or not
  const [start, setStart] = useState(0); // starting index of species
  const [end, setEnd] = useState(0); // end index of species

  const [user, setUser] = useState(""); // authorized admin user

  // Retrieves user, regions, invasive species, and alternative species on load
  useEffect(() => {
    retrieveUser()
    fetchRegionData();
    fetchAllInvasiveSpecies();
    fetchAllAlternativeSpecies();
    console.log("finished loading invasive species")
  }, [])

  // Gets current authorized user
  const retrieveUser = async () => {
    try {
      const returnedUser = await Auth.currentAuthenticatedUser();
      setUser(returnedUser);
      console.log("current user: ", returnedUser);
    } catch (e) {
      console.log("error getting user: ", e);
    }
  }

  // Gets regions
  const fetchRegionData = async () => {
    try {
      const regionMap = await handleGetRegions();
      setRegionsMap(regionMap);
    } catch (error) {
      console.error('error fetching regions', error);
    }
  };

  // Fetches all invasive species (recursively) in the database
  const fetchAllInvasiveSpecies = async (currOffset = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          curr_offset: currOffset,
          rows_per_page: rowsPerPage
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      });

      const formattedData = response.data.species.flatMap(item => {
        return item.scientific_name.map(name => {
          const capitalizedScientificName = capitalizeFirstWord(name);
          return {
            ...item,
            scientific_name: capitalizedScientificName
          };
        });
      });

      setAllInvasiveSpecies(prevSpecies => [...prevSpecies, ...formattedData]);
      setSpeciesCount(prevCount => prevCount + response.data.species.length)

      // Recursively gets species
      if (response.data.species.length === rowsPerPage) {
        const nextOffset = response.data.nextOffset;
        await fetchAllInvasiveSpecies(nextOffset);
      }
    } catch (error) {
      console.error("Error retrieving invasive species", error);
    }
  };

  // Updates search bar dropdown when alternative species are added or deleted
  useEffect(() => {
    const updatedSpeciesNames = allInvasiveSpecies.map(species => ({
      label: species.scientific_name,
      value: species.scientific_name
    }));

    setAllInvasiveSpeciesNames(updatedSpeciesNames);
  }, [allInvasiveSpecies]);


  // Fetches all alternative species (recursively) in the database
  const fetchAllAlternativeSpecies = async (currOffset = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}alternativeSpecies`, {
        params: {
          curr_offset: currOffset,
          rows_per_page: rowsPerPage
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      });

      const formattedData = response.data.species.flatMap(item => {
        return item.scientific_name.map(name => {
          const capitalizedScientificName = capitalizeFirstWord(name);
          return {
            ...item,
            scientific_name: capitalizedScientificName
          };
        });
      });

      setAllAlternativeSpecies(prevSpecies => [...prevSpecies, ...formattedData]);

      // Recursively gets species
      if (response.data.species.length === rowsPerPage) {
        const nextOffset = response.data.nextOffset;
        await fetchAllAlternativeSpecies(nextOffset);
      }
    } catch (error) {
      console.error("Error retrieving invasive species", error);
    }
  };


  // Fetches rowsPerPage number of invasive species (pagination)
  const handleGetInvasiveSpecies = () => {
    axios
      .get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          curr_offset: shouldReset ? null : currOffset,
          rows_per_page: rowsPerPage // default 20
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {

        const promises = response.data.species.flatMap(item =>
          item.region_id.map(regionId =>
            axios.get(`${API_BASE_URL}region/${regionId}`, {
              headers: {
                'x-api-key': process.env.REACT_APP_X_API_KEY
              }
            })
          )
        );

        return Promise.all(promises)
          .then(regionResponses => {
            const formattedData = response.data.species.map((item, index) => {
              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
              };
            });

            console.log("Invasive species retrieved successfully", formattedData);

            // Resets pagination details
            // This will clear the last species id history and display the first page
            if (shouldReset) {
              setCurrOffset(0);
              setPage(0);
              setStart(0);
              setEnd(0);
              setShouldReset(false);
            }

            setDisplayData(formattedData);
            setData(formattedData);
            setCurrOffset(response.data.nextOffset);
          });
      }).catch((error) => {
        console.error("Error retrieving invasive species", error);
      });
  };

  // Maintains history of last species_id and currLastSpeciesId so that on GET, 
  // the current page is maintained instead of starting from page 1
  const handleGetInvasiveSpeciesAfterSave = () => {
    setCurrOffset(curr => curr - rowsPerPage);
    setShouldSave(true)// useEffect listens for this state to change and will GET invasive species when True
  };

  // Request to GET invasive species (same page) after editing a row to see the updated data when shouldSave state changes
  useEffect(() => {
    if (shouldSave) {
      axios
        .get(`${API_BASE_URL}invasiveSpecies`, {
          params: {
            curr_offset: currOffset ? currOffset : null, // default first page
            rows_per_page: rowsPerPage // default 20
          },
          headers: {
            'x-api-key': process.env.REACT_APP_X_API_KEY
          }
        })
        .then((response) => {
          const formattedData = response.data.species.map((item, index) => {
            return {
              ...item,
              scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
            };
          });

          console.log("Invasive species retrieved successfully", formattedData);
          setDisplayData(formattedData);
          setCurrOffset(response.data.nextOffset);
        })
        .catch((error) => {
          console.error("Error getting invasive species", error);
        })
        .finally(() => {
          setShouldSave(false);
        });
    }
  }, [shouldSave]);

  // Fetches the invasive species that matches user search
  const handleGetInvasiveSpeciesAfterSearch = () => {
    const formattedSearchInput = searchInput.toLowerCase().replace(/ /g, '_'); 
    console.log("formatted search input: ", formattedSearchInput);

    axios
      .get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          scientific_name: formattedSearchInput,
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {
        console.log("resp: ", response);
        const promises = response.data.species.flatMap(item =>
          item.region_id.map(regionId =>
            axios
              .get(`${API_BASE_URL}region/${regionId}`, {
                headers: {
                  'x-api-key': process.env.REACT_APP_X_API_KEY
                }
              })
          )
        );

        return Promise.all(promises)
          .then(regionResponses => {
            const formattedData = response.data.species.map((item, index) => {
              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
              };
            });

            console.log("Invasive species retrieved successfully", formattedData);
            setDisplayData(formattedData);
          });
      }).catch((error) => {
        console.error("Error searching up invasive species", error);
      });
  };

  // Updates editing states when editing a species
  const startEdit = (id, rowData) => {
    setEditingSpeciesId(id);
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // Updates states after editing a species and saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingSpeciesId(null);
  };

  // Updates changes to the database on save
  const handleSave = (confirmed) => {
    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (confirmed) {
      let scientificNames = [];
      if (typeof tempEditingData.scientific_name === 'string') {
        scientificNames = formatString(tempEditingData.scientific_name)
          .map(name => {
            const formattedName = name.toLowerCase().replace(/\s+/g, '_');
            return capitalizeFirstWord(formattedName);
          });
      } else if (Array.isArray(tempEditingData.scientific_name)) {
        scientificNames = tempEditingData.scientific_name.map(name => name.toLowerCase().replace(/\s+/g, '_'));
      }

      let updatedTempData = {
        ...tempEditingData,
        scientific_name: scientificNames
      };

      console.log("updated temp data: ", updatedTempData)
      const { region_code_name, alternative_species, ...rest } = updatedTempData;

      // Get just the ids of alternative species
      const alternativeSpeciesIds = alternative_species.map(species => species.species_id);

      const updatedTempDataWithoutRegionCode = {
        ...rest,
        alternative_species: alternativeSpeciesIds,
      };

      console.log("saved invasive species data: ", updatedTempDataWithoutRegionCode);

      // Update invasive species table
      axios
        .put(`${API_BASE_URL}invasiveSpecies/${tempEditingData.species_id}`,
          updatedTempDataWithoutRegionCode,
          {
            headers: {
              'Authorization': `${jwtToken}`
            }
          })
        .then((response) => {
          console.log("invasive species updated successfully", response.data);
          if (start > rowsPerPage) {
            handleGetInvasiveSpeciesAfterSave();
          } else {
            setShouldReset(true);
          }
          handleFinishEditingRow();
        })
        .catch((error) => {
          console.error("Error updating species", error);
        });
  };
  };

  // Opens confirmation dialog before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenDeleteConfirmation(true);
  };

  // Deletes invasive species from the table
  const handleConfirmDelete = () => {
    console.log("invasive species id to delete: ", deleteId);
    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (deleteId) {
      axios
        .delete(`${API_BASE_URL}invasiveSpecies/${deleteId}`,
          {
            headers: {
              'Authorization': `${jwtToken}`
            }
          })
        .then((response) => {
          setSpeciesCount(prevCount => prevCount - 1)
          setAllInvasiveSpecies(prevSpecies => prevSpecies.filter(species => species.species_id !== deleteId));
          setShouldReset(true);
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

  // Adds a new invasive species
  const handleAddSpecies = (newSpeciesData) => {
    newSpeciesData = {
      ...newSpeciesData,
      scientific_name: newSpeciesData.scientific_name.map(name =>
        name.toLowerCase().replace(/\s+/g, '_')
      )
    }
    console.log("new invasive species: ", newSpeciesData);

    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    // Request to POST new invasive species to the database
    axios
      .post(API_BASE_URL + "invasiveSpecies", newSpeciesData,
        {
          headers: {
            'Authorization': `${jwtToken}`
          }
        })
      .then((response) => {
        console.log("Invasive Species added successfully", response.data);

        // Ensures that if a species has multiple scientific names, each are separately displayed      
        const formattedData = response.data.flatMap(item => {
          return item.scientific_name.map(name => {
            const capitalizedScientificName = capitalizeFirstWord(name);
            return {
              ...item,
              scientific_name: capitalizedScientificName
            };
          });
        });

        setAllInvasiveSpecies(prevSpecies => [...prevSpecies, ...formattedData]);
        setSpeciesCount(prevCount => prevCount + 1);
        setShouldReset(true);
        setOpenAddSpeciesDialog(false);
      })
      .catch((error) => {
        console.error("Error adding invasive species", error);
      });
  };

  // Call to handleGetAlternativeSpecies if shouldReset state is True
  useEffect(() => {
    if (shouldReset) {
      handleGetInvasiveSpecies();
    }
  }, [shouldReset]);

  // Updates temporary row data when field inputs change
  const handleInputChange = (field, value) => {
    if (field === "region_code_name") {
      const selectedRegionCodes = value.map((region_id) => regionMap[region_id]);
      setTempEditingData((prev) => ({ ...prev, region_id: value, region_code_name: selectedRegionCodes }));
    }
    else {
      setTempEditingData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Displays original data when search input is empty
  const handleSearch = (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
    }
  };

  // Searches location and updates displayed data accordingly
  const handleLocationSearch = (locationInput) => {
    if (locationInput === "") {
      setDisplayData(data);
    } else {
      const results = data.filter((item) =>
        item.region_id.some(
          (id) =>
            regionMap[id] &&
            regionMap[id].toLowerCase().trim() === locationInput.toLowerCase().trim()
        )
      );
      setDisplayData(results);
    }
  }

  // Calculates start and end species indices of the current page of displayed data
  const calculateStartAndEnd = () => {
    const newStart = page * rowsPerPage + 1;
    const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
    setStart(newStart);
    setEnd(newEnd);
  };

  // Call to calculate indices
  useEffect(() => {
    calculateStartAndEnd();
  }, [page, rowsPerPage, displayData]);

  // Resets if rowsPerPage changes 
  useEffect(() => {
    setShouldReset(true);
  }, [rowsPerPage]);

  // Call to get next/previous rowsPerPage number of species on page change
  useEffect(() => {
    handleGetInvasiveSpecies();
  }, [page]);

  // Increments the page count by 1 
  const handleNextPage = () => {
    setPage(page + 1); 
  };

  // Decrements page count by 1 and removes last id in seen species history 
  const handlePreviousPage = () => {
    setCurrOffset(curr => curr - rowsPerPage * 2);
    setPage(page - 1);
  };

  // Disables the next button if there are no species left to query
  useEffect(() => {
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
        <LocationFilterComponent
          text={"Search by region"}
          inputData={regionMap}
          handleLocationSearch={handleLocationSearch}
          location={regionCodeName}
          setLocation={setRegionCodeName}
        />

        <SearchComponent
          text={"Search invasive species (scientific name)"}
          handleSearch={handleSearch}
          searchResults={allInvasiveSpeciesNames}
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
        />

        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => handleGetInvasiveSpeciesAfterSearch()} style={{ marginLeft: "20px", marginTop: "27px", width: "10%", height: "53px", alignItems: "center" }}>
            <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
          </Button>
        </ThemeProvider>
      </div>

      {/* button to add species */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => setOpenAddSpeciesDialog(true)} startIcon={<AddCircleOutlineIcon />}>
            Add Invasive Species
          </Button>
        </ThemeProvider>
      </div>

      {/* pagination selections*/}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "67%" }}>
        {/* Dropdown for selecting rows per page */}
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
          count={speciesCount}
          page={page}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          disabled={disabled}
        />
      </div>

      {/* table */}
      <div style={{ width: "90%", display: "flex", justifyContent: "center" }}>
        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          {/* table header */}
          <TableHead>
            <TableRow>
              <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Scientific Name
                </Typography>
              </TableCell>
              <TableCell style={{ width: "35%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell style={{ width: "13%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Alternative Species
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%", whiteSpace: 'normal', wordWrap: 'break-word' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resources
                </Typography>
              </TableCell>
              <TableCell style={{ width: "7%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Region(s)
                </Typography>
              </TableCell>
              <TableCell style={{ width: "7%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* table body: display species */}
          <TableBody>
            {displayData &&
              (regionId !== ""
                ? displayData
                .filter((item) => {
                  item.region_id.some((id) => regionMap[id] === regionId)
                })
                .map((row) => (
                    <TableRow key={row.species_id}>
                      {/* editing the row */}
                    {editingSpeciesId === row.species_id ? (
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
                                handleInputChange("scientific_name", e.target.value)
                              }
                            />
                          </TableCell>


                          {/* decsription */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                            value={boldText(tempEditingData.species_description)}
                              onChange={(e) =>
                                handleInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            onChange={(e) =>
                              handleInputChange(
                                  "alternative_species",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={
                              Array.isArray(tempEditingData.resource_links)
                                ? tempEditingData.resource_links.join(", ")
                                : tempEditingData.resource_links
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "resource_links",
                                e.target.value.split(", ")
                              )
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {Array.isArray(tempEditingData.resource_links) ? (
                                    tempEditingData.resource_links.map((link, index) => (
                                      <span key={index}>
                                        <a
                                          href={link}
                                          target="_blank"
                                          rel="noopener noreferrer"
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

                          {/* region */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                            value={tempEditingData.region_id.map((id) => regionMap[id]).join(", ")}
                              onChange={(e) =>
                                handleInputChange(
                                  "region_code_name",
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
                            <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                              {Array.isArray(row.scientific_name)
                                ? row.scientific_name.join(", ")
                                : row.scientific_name}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }} >{boldText(row.species_description)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                              {Array.isArray(row.alternative_species)
                                ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                                : row.alternative_species}
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
                            {Array.isArray(row.region_id)
                              ? row.region_id.map((id) => regionMap[id]).join(", ")
                              : regionMap[row.region_id]}                        
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
                  .map((row) => (
                    <TableRow key={row.species_id}>
                      {/* editing the row */}
                      {editingSpeciesId === row.species_id ? (
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
                                handleInputChange("scientific_name", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* decsription */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={boldText(tempEditingData.species_description)}
                              onChange={(e) =>
                                handleInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              onChange={(e) =>
                                handleInputChange(
                                  "alternative_species",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={
                                Array.isArray(tempEditingData.resource_links)
                                  ? tempEditingData.resource_links.join(", ")
                                  : tempEditingData.resource_links
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  "resource_links",
                                  e.target.value.split(", ")
                                )
                              }
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    {Array.isArray(tempEditingData.resource_links) ? (
                                      tempEditingData.resource_links.map((link, index) => (
                                        <span key={index}>
                                          <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
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

                          {/* region */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={tempEditingData.region_id.map((id) => regionMap[id]).join(", ")}
                              onChange={(e) =>
                                handleInputChange(
                                  "region_code_name",
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
                            <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                              {Array.isArray(row.scientific_name)
                                ? row.scientific_name.join(", ")
                                : row.scientific_name}
                            </TableCell>
                            <TableCell>{boldText(row.species_description)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                              {Array.isArray(row.alternative_species)
                                ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                                : row.alternative_species}
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
                              {Array.isArray(row.region_id)
                                ? row.region_id.map((id) => regionMap[id]).join(", ")
                                : regionMap[row.region_id]}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "78%" }}>
        <PaginationComponent
          start={start}
          end={end}
          count={speciesCount}
          page={page}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          disabled={disabled}
        />
      </div >

      <AddInvasiveSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
        alternativeSpeciesData={allAlternativeSpecies}
      />

      <EditInvasiveSpeciesDialog
        open={openEditSpeciesDialog}
        tempData={tempEditingData}
        handleInputChange={handleInputChange}
        handleFinishEditingRow={handleFinishEditingRow}
        handleSave={handleSave}
        alternativeSpeciesData={allAlternativeSpecies}
      />

      <DeleteDialog
        open={openDeleteConfirmation}
        handleClose={() => setOpenDeleteConfirmation(false)}
        handleDelete={handleConfirmDelete}
      />
    </div >
  );
}

export default InvasiveSpeciesPage;