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
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import axios from "axios";
import { boldText, formatString, capitalizeFirstWord } from '../../functions/helperFunctions';


function InvasiveSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [allInvasiveSpecies, setAllInvasiveSpecies] = useState([]); // all invasive species in database
  const [allAlternativeSpecies, setAllAlternativeSpecies] = useState([]); // array of all alternative species
  const [speciesCount, setSpeciesCount] = useState(0); // number of invasive species
  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [editingSpeciesId, setEditingSpeciesId] = useState(null);
  const [tempEditingData, setTempEditingData] = useState({});
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchBarResults, setSearchBarResults] = useState(displayData.map((item) => ({
    label: item.scientific_name,
    value: item.scientific_name
  })));
  const [regionCodeName, setRegionCodeName] = useState([]);
  const [regionMap, setRegionsMap] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [region_id, setRegionId] = useState("");

  const [currLastSpeciesId, setCurrLastSpeciesId] = useState(""); // current last species
  const [lastSpeciesIdHistory, setLastSpeciesIdHistory] = useState(new Set("")); // history of lastSpeciesIds seen for each page
  const [shouldReset, setShouldReset] = useState(false); // reset above values
  const [shouldSave, setShouldSave] = useState(false); // reset above values

  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disabled, setDisabled] = useState(false); // disabled next button or not
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [user, setUser] = useState("");


  // gets current authorized user
  const retrieveUser = async () => {
    try {
      const returnedUser = await Auth.currentAuthenticatedUser();
      setUser(returnedUser);
      console.log("current user: ", returnedUser);
    } catch (e) {
      console.log("error getting user: ", e);
    }
  }

  // GET regions once
  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        const regionMap = await handleGetRegions();
        setRegionsMap(regionMap);
        // console.log("set regions map: ", regionMap)
      } catch (error) {
        console.error('error fetching regions', error);
      }
    };
    fetchRegionData();
  }, []);

  // retriever user on and alternative species on load
  useEffect(() => {
    // console.log("retrieved user!!! + loading all species")
    retrieveUser()
    loadSpeciesInBackground()
    console.log("finished loading species")
  }, [])

  // gets all alternative species in the database
  const fetchAllInvasiveSpecies = async (lastSpeciesId = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          last_species_id: lastSpeciesId,
          rows_per_page: rowsPerPage
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      });

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
      setSpeciesCount(prevCount => prevCount + response.data.length)

      // recursively gets species if more exists
      if (response.data.length === rowsPerPage) {
        const newLastSpeciesId = response.data[response.data.length - 1].species_id;
        await fetchAllInvasiveSpecies(newLastSpeciesId);
      }
    } catch (error) {
      console.error("Error retrieving invasive species", error);
    }
  };

  // gets all alternative species in the database
  const fetchAllAlternativeSpecies = async (lastSpeciesId = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}alternativeSpecies`, {
        params: {
          last_species_id: lastSpeciesId,
          rows_per_page: rowsPerPage
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      });

      const formattedData = response.data.flatMap(item => {
        return item.scientific_name.map(name => {
          const capitalizedScientificName = capitalizeFirstWord(name);
          return {
            ...item,
            scientific_name: capitalizedScientificName
          };
        });
      });

      setAllAlternativeSpecies(prevSpecies => [...prevSpecies, ...formattedData]);

      // recursively gets species if more exists
      if (response.data.length === rowsPerPage) {
        const newLastSpeciesId = response.data[response.data.length - 1].species_id;
        await fetchAllAlternativeSpecies(newLastSpeciesId);
      }
    } catch (error) {
      console.error("Error retrieving invasive species", error);
    }
  };

  const loadSpeciesInBackground = () => {
    fetchAllInvasiveSpecies();
    fetchAllAlternativeSpecies();

  };

  const invasiveSpeciesNames = allInvasiveSpecies.map(species => ({
    label: species.scientific_name,
    value: species.scientific_name
  }));

  // request to GET invasive species in the database
  const handleGetInvasiveSpecies = () => {

    console.log("should reset?: ", shouldReset);
    console.log("rows per page get", rowsPerPage);

    // request to GET invasive species
    axios
      .get(`${API_BASE_URL}invasiveSpecies`, {
        params: {
          last_species_id: shouldReset ? null : currLastSpeciesId, // default first page
          rows_per_page: rowsPerPage // default 20
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {

        const promises = response.data.flatMap(item =>
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
            const formattedData = response.data.map((item, index) => {
              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
              };
            });

            console.log("Invasive species retrieved successfully", formattedData);

            // reset pagination details
            if (shouldReset) {
              setLastSpeciesIdHistory(new Set())
              // setLastSpeciesNameHistory(new Set())
              setPage(0);
              setStart(0);
              setEnd(0);
              setShouldReset(false);
              console.log("reset pagination details")
            }

            setDisplayData(formattedData);
            setData(formattedData);

            // update lastSpeciesId with the species_id of the last row displayed in the table
            if (formattedData.length > 0) {
              const newLastSpeciesId = formattedData[formattedData.length - 1].species_id;

              setCurrLastSpeciesId(newLastSpeciesId);
              setLastSpeciesIdHistory(history => new Set([...history, newLastSpeciesId]));
            }
          });
      }).catch((error) => {
        console.error("Error retrieving invasive species", error);
      });
  };


  useEffect(() => {
    if (shouldSave) {
      // request to GET invasive species
      axios
        .get(`${API_BASE_URL}invasiveSpecies`, {
          params: {
            last_species_id: currLastSpeciesId ? currLastSpeciesId : null, // default first page
            rows_per_page: rowsPerPage // default 20
          },
          headers: {
            'x-api-key': process.env.REACT_APP_X_API_KEY
          }
        })
        .then((response) => {
          const formattedData = response.data.map((item, index) => {
            return {
              ...item,
              scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name))
            };
          });

          console.log("Invasive species retrieved successfully", formattedData);

          // update states
          setDisplayData(formattedData);
          // update lastSpeciesId with the species_id of the last row displayed in the table
          if (formattedData.length > 0) {
            const newLastSpeciesId = formattedData[formattedData.length - 1].species_id;

            setCurrLastSpeciesId(newLastSpeciesId);
            setLastSpeciesIdHistory(history => new Set([...history, newLastSpeciesId]));
          }
        })
        .catch((error) => {
          console.error("Error getting invasive species", error);
        })
        .finally(() => {
          setShouldSave(false);
        });
      // });
    }
  }, [shouldSave]);

  // fetches alternative species data 
  const handleGetInvasiveSpeciesAfterSave = () => {
    console.log("curr:", currLastSpeciesId, "history:", lastSpeciesIdHistory);

    if (lastSpeciesIdHistory.size > 1) {
      const updatedIdHistory = Array.from(lastSpeciesIdHistory);
      updatedIdHistory.pop(); // Remove the last element

      setLastSpeciesIdHistory(new Set(updatedIdHistory));

      const prevSpeciesId = updatedIdHistory[updatedIdHistory.length - 1];
      setCurrLastSpeciesId(prevSpeciesId);

      setShouldSave(true)
    }
  };

  // GET invasive species in the database that matches user search
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
        const promises = response.data.flatMap(item =>
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
            const formattedData = response.data.map((item, index) => {
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

  const handleReset = () => {
    console.log("reset data");
    setShouldReset(true);
    setSearchInput("");
    handleGetInvasiveSpecies();
  }

  // filters data of current page that matches search input and region id
  useEffect(() => {
    const filteredData = data.filter((item) => {
      const matchesSearchInput = searchInput === "" ||
        item.scientific_name.some((name) => name.toLowerCase().includes(searchInput.toLowerCase())
      );

      const matchesRegionID = region_id === "" ||
        item.region_id.includes(region_id);

      return matchesSearchInput && matchesRegionID;
    });

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

    setSearchBarResults(results);
  }, [searchInput, data, regionMap, region_id]);


  // edit species row
  const startEdit = (id, rowData) => {
    setEditingSpeciesId(id);
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingSpeciesId(null);
  };

  // saves edited row
  const handleSave = (confirmed) => {
    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    console.log("got here");
    const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

    if (confirmed) {
      // make sure that fields are proper data structure
      let scientificNames;
      if (typeof tempEditingData.scientific_name === 'string') {
        scientificNames = formatString(tempEditingData.scientific_name)
          .map(name => name.toLowerCase().replace(/\s+/g, '_'));
      } else if (Array.isArray(tempEditingData.scientific_name)) {
        scientificNames = tempEditingData.scientific_name.map(name => name.toLowerCase().replace(/\s+/g, '_'));
      }
      const formattedScientificNames = scientificNames || [];

      let updatedTempData = {
        ...tempEditingData,
        scientific_name: formattedScientificNames
      };

      console.log("updated temp data: ", updatedTempData)
      const { region_code_name, alternative_species, ...rest } = updatedTempData;

      // get just the ids of alt species
      const alternativeSpeciesIds = alternative_species.map(species => species.species_id);

      const updatedTempDataWithoutRegionCode = {
        ...rest,
        alternative_species: alternativeSpeciesIds,
      };

      console.log("saved invasive species data: ", updatedTempDataWithoutRegionCode);

      // request to PUT updated invasive species to the database
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

  // delete row with confirmation before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenDeleteConfirmation(true);
  };

  // confirm delete of species
  const handleConfirmDelete = () => {
    console.log("invasive species id to delete: ", deleteId);

    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken
    console.log("token: ", jwtToken)

    // request to DELETE species from the database
    if (deleteId) {
      axios
        .delete(`${API_BASE_URL}invasiveSpecies/${deleteId}`,
          {
            headers: {
              'Authorization': `${jwtToken}`
            }
          })
        .then((response) => {
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

  // add species
  const handleAddSpecies = (newSpeciesData) => {
    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    // format scientific names
    newSpeciesData = {
      ...newSpeciesData,
      scientific_name: newSpeciesData.scientific_name.map(name =>
        name.toLowerCase().replace(/\s+/g, '_')
      )
    }
    console.log("new invasive species: ", newSpeciesData);

    // POST new species to database
    axios
      .post(API_BASE_URL + "invasiveSpecies", newSpeciesData,
        {
          headers: {
            'Authorization': `${jwtToken}`
          }
        })
      .then((response) => {
        console.log("Invasive Species added successfully", response.data);
        setShouldReset(true);
        // handleGetInvasiveSpecies();
        setOpenAddSpeciesDialog(false);
      })
      .catch((error) => {
        console.error("Error adding invasive species", error);
      });
  };

  // execute handleGetInvasiveSpecies after shouldReset state update
  useEffect(() => {
    if (shouldReset) {
      handleGetInvasiveSpecies();
    }
  }, [shouldReset]);

  // updates temp data when search input changes
  const handleSearchInputChange = (field, value) => {
    console.log("value: ", value);

    if (field === "region_code_name") {
      const selectedRegionCodes = value.map((region_id) => regionMap[region_id]);
      setTempEditingData((prev) => ({ ...prev, region_id: value, region_code_name: selectedRegionCodes }));
    }
    else {
      setTempEditingData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // search species
  const handleSearch = (searchInput) => {
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

  // calculates start and end indices of the current displayed data in the entire data
  const calculateStartAndEnd = () => {
    const newStart = page * rowsPerPage + 1;
    const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
    setStart(newStart);
    setEnd(newEnd);
  };

  useEffect(() => {
    calculateStartAndEnd();
  }, [page, rowsPerPage, displayData]);

  useEffect(() => {
    console.log("rows per page changed!!: ", rowsPerPage);
    setShouldReset(true);
    handleGetInvasiveSpecies()
  }, [rowsPerPage]);

  // updates page count
  const handleNextPage = () => {
    setPage(page + 1); // Increment the page by 1 on "Next" button click
  };

  // updates page count and history of species seen
  const handlePreviousPage = () => {
    if (lastSpeciesIdHistory.size > 1) {
      const updatedIdHistory = new Set([...lastSpeciesIdHistory]);
      updatedIdHistory.delete([...updatedIdHistory].pop()); // remove last item from the Set
      setLastSpeciesIdHistory(updatedIdHistory);

      // gets the previous species id
      const prevSpeciesId = [...updatedIdHistory][[...updatedIdHistory].length - 2];
      setCurrLastSpeciesId(prevSpeciesId);
      setPage(page - 1);
    }
  };

  // gets next/previous set of species on page change
  useEffect(() => {
    handleGetInvasiveSpecies();
  }, [page]);


  // disables the next button if there are no species left to query
  useEffect(() => {
    console.log("displayDataCount: ", displayData.length);
    console.log("rows per page: ", rowsPerPage);

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
          searchResults={invasiveSpeciesNames}
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
        />

        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => handleGetInvasiveSpeciesAfterSearch()} style={{ marginLeft: "20px", marginTop: "27px", width: "10%", height: "53px", alignItems: "center" }}>
            <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
          </Button>
        </ThemeProvider>

        {/* <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => handleReset()} style={{ marginLeft: "10px", marginTop: "27px", height: "53px", alignItems: "center" }}>
            <RestartAltIcon />
          </Button>
        </ThemeProvider> */}
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
              (region_id !== ""
                ? displayData
                .filter((item) => {
                  item.region_id.some((id) => regionMap[id] === region_id)
                })
                // .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                                handleSearchInputChange("scientific_name", e.target.value)
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

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            onChange={(e) =>
                                handleSearchInputChange(
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
                              handleSearchInputChange(
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
                                handleSearchInputChange(
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
                                handleSearchInputChange("scientific_name", e.target.value)
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

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              onChange={(e) =>
                                handleSearchInputChange(
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
                                handleSearchInputChange(
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
                                handleSearchInputChange(
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
        handleSearchInputChange={handleSearchInputChange}
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
