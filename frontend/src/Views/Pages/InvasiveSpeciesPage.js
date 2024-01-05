import React, { useState, useEffect } from "react";
import { Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Typography, ThemeProvider, Box, Autocomplete, TextField } from "@mui/material";
import Theme from './Theme';
import { Auth } from "aws-amplify";

// components
import PaginationComponent from '../../components/PaginationComponent';
import EditInvasiveSpeciesDialog from "../../components/Dialogs/EditInvasiveSpeciesDialog";
import AddInvasiveSpeciesDialog from "../../components/Dialogs/AddInvasiveSpeciesDialog";
import DeleteDialog from "../../components/Dialogs/ConfirmDeleteDialog";

// icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from "axios";
import { boldText, formatString, capitalizeFirstWord, capitalizeEachWord } from '../../functions/helperFunctions';

function InvasiveSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [searchDropdownSpeciesOptions, setSearchDropdownSpeciesOptions] = useState([]); // dropdown options for invasive species search bar (scientific names)
  const [searchDropdownRegionsOptions, setSearchDropdownRegionsOptions] = useState([]); // dropdown options for regions search bar 
  const [speciesCount, setSpeciesCount] = useState(0); // number of invasive species
  const [data, setData] = useState([]); // original data
  const [displayData, setDisplayData] = useState([]); // data displayed in the table
  const [tempEditingData, setTempEditingData] = useState({}); // data of the species being edited
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false); // state of the editing an invasive species dialog
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false); // state of the adding an invasive species dialog
  const [searchInput, setSearchInput] = useState(""); // input of the species search bar
  const [deleteId, setDeleteId] = useState(null); // species_id of the row being deleted
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog 
  const [regionId, setRegionId] = useState(""); // current region id

  // Pagination states
  const [currOffset, setCurrOffset] = useState(0); // current index of the first species on a page
  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disabled, setDisabled] = useState(false); // disabled next button or not
  const [start, setStart] = useState(0); // starting index of species
  const [end, setEnd] = useState(0); // end index of species
  const [shouldReset, setShouldReset] = useState(false); // reset above values
  const [shouldSave, setShouldSave] = useState(false); // reset above values
  const [shouldCalculate, setShouldCalculate] = useState(true); // whether calculation of start and end should be made

  const [isLoading, setIsLoading] = useState(false); // loading data or not
  const [user, setUser] = useState(""); // authorized admin user

  // Retrieves user on load
  useEffect(() => {
    retrieveUser()
  }, [])

  // Gets current authorized user
  const retrieveUser = async () => {
    try {
      const returnedUser = await Auth.currentAuthenticatedUser();
      console.log(returnedUser);
      setUser(returnedUser);
    } catch (e) {
      console.log("error getting user: ", e);
    }
  }

  // Fetches rowsPerPage number of invasive species (pagination)
  const handleGetInvasiveSpecies = () => {
    setIsLoading(true);
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
          .then(() => {
            const formattedData = response.data.species.map((item) => {
              if (item.alternative_species) {
                item.alternative_species.forEach(species => {
                  species.scientific_name = species.scientific_name.map(name =>
                    capitalizeFirstWord(name)
                  );
                  species.common_name = species.common_name.map(name =>
                    capitalizeEachWord(name)
                  );
                });
              }

              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
              };
            });

            // Resets pagination details
            // This will clear the last species id history and display the first page
            if (shouldReset) {
              setCurrOffset(0);
              setPage(0);
              setStart(0);
              setEnd(0);
              setShouldCalculate(true);
              setShouldReset(false);
            }

            setSpeciesCount(response.data.count[0].count);
            setDisplayData(formattedData);
            setData(formattedData);
            setCurrOffset(response.data.nextOffset);
          });
      })
      .catch((error) => {
        console.error("Error retrieving invasive species", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Maintains history of last species_id and currLastSpeciesId so that on GET, 
  // the current page is maintained instead of starting from page 1
  const handleGetInvasiveSpeciesAfterSave = () => {
    setCurrOffset(curr => curr - rowsPerPage);
    setShouldSave(true); // useEffect listens for this state to change and will GET invasive species when True
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
    let formattedSearchInput = searchInput.toLowerCase().replace(/ /g, '_');
    setIsLoading(true);

    axios
      .get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          scientific_name: formattedSearchInput,
          region_id: regionId,
          rows_per_page: speciesCount
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {
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
          .then(() => {
            // gets the species that match user search
            const formattedData = response.data.species.map((item) => {
              if (item.alternative_species) {
                item.alternative_species.forEach(species => {
                  species.scientific_name = species.scientific_name.map(name =>
                    capitalizeFirstWord(name)
                  );
                  species.common_name = species.common_name.map(name =>
                    capitalizeEachWord(name)
                  );
                });
              }

              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
              };
            });

            // ensure that there are no dupliaces
            const uniqueFormattedData = [];
            const uniqueScientificNames = new Set();

            formattedData.forEach((item) => {
              const capitalizedScientificNames = item.scientific_name.map(name =>
                capitalizeFirstWord(name)
              );

              const scientificNameKey = capitalizedScientificNames.join('_');

              if (!uniqueScientificNames.has(scientificNameKey)) {
                uniqueFormattedData.push({
                  ...item,
                  scientific_name: capitalizedScientificNames
                });
                uniqueScientificNames.add(scientificNameKey);
              }
            });

            // updates pagination start and end indices
            setShouldCalculate(false);
            setDisplayData(uniqueFormattedData);
            uniqueFormattedData.length > 0 ? setStart(1) : setStart(0);
            setEnd(response.data.species.length);
          });
      })
      .catch((error) => {
        console.error("Error searching up invasive species", error);
      })
      .finally(() => {
        setIsLoading(false);
      })
  };

  // Updates editing states when editing a species
  const startEdit = (rowData) => {
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // Updates states after editing a species and saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
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

      const { region_code_name, alternative_species, ...rest } = updatedTempData;

      // Get just the ids of alternative species
      const alternativeSpeciesIds = alternative_species.map(species => species.species_id);

      const updatedTempDataWithoutRegionCode = {
        ...rest,
        alternative_species: alternativeSpeciesIds,
      };

      // Update invasive species table
      axios
        .put(`${API_BASE_URL}invasiveSpecies/${tempEditingData.species_id}`,
          updatedTempDataWithoutRegionCode,
          {
            headers: {
              'Authorization': `${jwtToken}`
            }
          })
        .then(() => {
          if (start > rowsPerPage) {
            handleGetInvasiveSpeciesAfterSave();
          } else {
            setShouldReset(true);
          }
          handleFinishEditingRow();
        })
        .catch((error) => {
          console.error("Error updating species", error);
        })
    };
  };

  // Opens confirmation dialog before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenDeleteConfirmation(true);
  };

  // Deletes invasive species from the table
  const handleConfirmDelete = () => {
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
        .then(() => {
          setSpeciesCount(prevCount => prevCount - 1)
          setShouldReset(true);
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
      ),
      region_id: newSpeciesData.all_regions.map(region => region.region_id),
    }

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
      .then(() => {
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
    console.log("input change:", "field: ", field, "value: ", value)

    if (field === "all_regions") {
      const regionIds = value.map(region => region.region_id);
      const regionCodeNames = value.map(region => region.region_code_name);

      setTempEditingData(prev => ({
        ...prev,
        region_id: regionIds,
        region_code_name: regionCodeNames
      }));
    }

    if (field === "region_code_name") {
      const selectedRegionCodes = value.map((region_id) =>
        axios
          .get(`${API_BASE_URL}region/${region_id}`, {
            headers: {
              'x-api-key': process.env.REACT_APP_X_API_KEY
            }
          })
          .then((response) => {
            return response.data[0].region_code_name;
          })
          .catch((error) => {
            console.error("Error getting region", error);
          }));
      setTempEditingData((prev) => ({ ...prev, region_id: value, region_code_name: selectedRegionCodes }));
    }
    else {
      setTempEditingData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Displays original data when search input is empty, otherwise updates dropdown
  const handleSearch = (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
      setShouldCalculate(true);
      setSearchDropdownSpeciesOptions([]);
    } else {
      axios
        .get(`${API_BASE_URL}invasiveSpecies`, {
          params: {
            scientific_name: searchInput,
          },
          headers: {
            'x-api-key': process.env.REACT_APP_X_API_KEY
          }
        })
        .then((response) => {
          const formattedData = response.data.species.map(item => {
            const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));

            return {
              ...item,
              scientific_name: capitalizedScientificNames,
            };
          });

          // updates species search dropdown options
          if (formattedData.length > 0) {
            const scientificNames = formattedData.flatMap((species) => species.scientific_name);
            const uniqueScientificNames = [...new Set(scientificNames)];
            setSearchDropdownSpeciesOptions(uniqueScientificNames);
          }
        })
        .catch((error) => {
          console.error("Error searching up invasive species", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  // Searches location and updates displayed data accordingly
  const handleLocationSearch = (locationInput) => {
    // gets only region full name
    locationInput.replace(/\s*\([^)]*\)\s*/, '') // Remove the region code within parentheses
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_'); // Replace spaces with underscores 

    // resets displayed data if no region search input is provided
    if (locationInput === "") {
      setDisplayData(data);
      setRegionId("");
    } else {
      axios
        .get(`${API_BASE_URL}region`, {
          params: {
            region_fullname: locationInput,
          },
          headers: {
            'x-api-key': process.env.REACT_APP_X_API_KEY
          }
        })
        .then((response) => {
          const formattedData = response.data.regions.map(item => {
            return {
              ...item,
              region_fullname: capitalizeEachWord(item.region_fullname),
              region_code_name: item.region_code_name.toUpperCase(),
            };
          });

          setRegionId(formattedData[0].region_id)

          // updates region search dropdown options
          if (formattedData.length > 0) {
            const regionNames = formattedData.map((region) => `${region.region_fullname} (${region.region_code_name})`);
            setSearchDropdownRegionsOptions(regionNames);
          }
        })
        .catch((error) => {
          console.error("Error searching up region", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  // Calculates start and end species indices of the current page of displayed data
  const calculateStartAndEnd = () => {
    const newStart = page * rowsPerPage + 1;
    const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
    setStart(newStart);
    setEnd(newEnd);
  };

  // Call to calculate indices
  useEffect(() => {
    if (shouldCalculate) {
      calculateStartAndEnd();
    }
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

  // Disables the next button if there are no species left to query or if search by region only
  useEffect(() => {
    if (displayData.length === 0 || displayData.length < rowsPerPage || regionId) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [displayData, rowsPerPage, regionId]);

  // search species on "enter" key
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleGetInvasiveSpeciesAfterSearch();
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* location and search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
        {/* regions search bar */}
        <Box style={{ flex: 1, marginLeft: "10px" }}>
          <Autocomplete
            options={searchDropdownRegionsOptions}
            onInputChange={(e, newInputValue) => {
              handleLocationSearch(newInputValue.toLowerCase());
            }}
            clearOnBlur={false}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ marginRight: '0.5rem' }} />
                    {"Search by region"}
                  </div>
                }
                style={{ marginTop: "2rem", marginBottom: "1rem" }}
              />
            )}
          />
        </Box>

        {/* invasive species search bar */}
        <Box style={{ flex: 3, marginLeft: "10px" }}>
          <Autocomplete
            options={searchDropdownSpeciesOptions}
            onInputChange={(e, newInputValue) => {
              setSearchInput(newInputValue);
              handleSearch(newInputValue);
            }}
            clearOnBlur={false}
            onKeyDown={handleKeyPress}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ marginRight: '0.5rem' }} />
                    {"Search invasive species (scientific name)"}
                  </div>
                }
                style={{ marginTop: "2rem", marginBottom: "1rem" }}
              />
            )}
          />
        </Box>

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
        {isLoading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          <Table style={{ width: "100%", tableLayout: "fixed" }}>
            {/* table header */}
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "10%" }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Scientific Name(s)
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
                    Resource Links
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
              {(displayData && displayData.length > 0 ? displayData : [])
                .map((row) => (
                  <TableRow key={row.species_id}>
                    <>
                      {/* scientific names */}
                      <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                        {Array.isArray(row.scientific_name) ? row.scientific_name.join(", ") : row.scientific_name}
                      </TableCell>

                      {/* description */}
                      <TableCell>{boldText(row.species_description)}</TableCell>

                      {/* alternative species */}
                      <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                        {Array.isArray(row.alternative_species)
                          ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                          : row.alternative_species}
                      </TableCell>

                      {/* resource links */}
                      <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
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

                      {/* regions */}
                      <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                        {Array.isArray(row.region_code_names) //region_code_names
                          ? row.region_code_names.join(", ")
                          : row.region_code_names}
                      </TableCell>

                      {/* actions: edit/delete */}
                      <TableCell>
                        <Tooltip title="Edit"
                          onClick={() => startEdit(row)}>
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
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
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
      />

      <EditInvasiveSpeciesDialog
        open={openEditSpeciesDialog}
        tempData={tempEditingData}
        handleInputChange={handleInputChange}
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


export default InvasiveSpeciesPage;