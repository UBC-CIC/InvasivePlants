import React, { useState, useEffect } from "react";
import { InputAdornment, TablePagination, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
import Theme from './Theme';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import EditInvasiveSpeciesDialog from "../../dialogs/EditInvasiveSpeciesDialog";
import LocationFilterComponent from '../../components/LocationFilterComponent';
import SearchComponent from '../../components/SearchComponent';
import AddInvasiveSpeciesDialog from "../../dialogs/AddInvasiveSpeciesDialog";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import boldText from "./formatDescriptionHelper";
import handleGetRegions from "../../functions/RegionMap"
import axios from "axios";

function InvasiveSpeciesPage() {
  const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [editingSpeciesId, setEditingSpeciesId] = useState(null);
  const [tempData, setTempData] = useState({});
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
  const [lastSpeciesNameHistory, setLastSpeciesNameHistory] = useState(new Set()); // history of lastSpeciesIds seen for each page
  const [shouldReset, setShouldReset] = useState(false); // reset above values

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

  // request to GET invasive species in the database
  const handleGetInvasiveSpecies = () => {
    // console.log("previous last species id: ", currLastSpeciesId);
    console.log("should reset?: ", shouldReset);
    // helper function that capitalizes scientific name
    const capitalizeScientificName = (str) => {
      const strSplitUnderscore = str.split("_");
      const words = strSplitUnderscore.flatMap(word => word.split(" "));

      const formattedWords = words.map((word, index) => {
        if (index === 0) { // first "word"
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      });

      return formattedWords.join(" ");
    };

    console.log("rows per page get", rowsPerPage);

    // request to GET invasive species
    axios
      .get(`${API_ENDPOINT}invasiveSpecies`, {
        params: {
          last_species_id: shouldReset ? null : currLastSpeciesId, // default first page
          rows_per_page: rowsPerPage // default 20
        }
      })
      .then((response) => {
        const promises = response.data.flatMap(item =>
          item.region_id.map(regionId =>
            axios.get(`${API_ENDPOINT}region/${regionId}`)
          )
        );

        return Promise.all(promises)
          .then(regionResponses => {
            const formattedData = response.data.map((item, index) => {
              return {
                ...item,
                scientific_name: item.scientific_name.map(name => capitalizeScientificName(name))
              };
            });

            console.log("Invasive species retrieved successfully", formattedData);

            // reset pagination details
            if (shouldReset) {
              setLastSpeciesIdHistory(new Set())
              setLastSpeciesNameHistory(new Set())
              setPage(0);
              setStart(0);
              setEnd(0);
              setShouldReset(false);
            }

            setDisplayData(formattedData);
            setData(formattedData);
            setSearchBarResults(formattedData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));

            // update lastSpeciesId with the species_id of the last row displayed in the table
            if (formattedData.length > 0) {
              const newLastSpeciesId = formattedData[formattedData.length - 1].species_id;
              const newLastSpeciesNames = formattedData[formattedData.length - 1].scientific_name;

              setCurrLastSpeciesId(newLastSpeciesId);
              setLastSpeciesIdHistory(history => new Set([...history, newLastSpeciesId]));
              setLastSpeciesNameHistory(history => { // TODO: could get rid of this later
                const updatedNames = new Set([...history]);
                newLastSpeciesNames.forEach(name => {
                  if (!updatedNames.has(name)) {
                    updatedNames.add(name);
                  }
                });
                return updatedNames;
              });
            }
          });
      }).catch((error) => {
        console.error("Error retrieving invasive species", error);
      });
  };

  useEffect(() => {
    // console.log("last species id: ", currLastSpeciesId)
    console.log("history: ", lastSpeciesIdHistory, lastSpeciesNameHistory)
  }, [currLastSpeciesId, lastSpeciesIdHistory, lastSpeciesNameHistory]);


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
    setTempData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingSpeciesId(null);
  };

  // saves edited row
  const handleSave = (confirmed) => {
    console.log("got here");
    const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

    if (confirmed) {
      const updatedTempData = {
        ...tempData,
        scientific_name: typeof tempData.scientific_name === 'string' ? splitByCommaWithSpaces(tempData.scientific_name) : tempData.scientific_name,
      };

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
        .put(`${API_ENDPOINT}invasiveSpecies/${tempData.species_id}`, updatedTempDataWithoutRegionCode)
        .then((response) => {
          console.log("invasive species updated successfully", response.data);
          setShouldReset(true);
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

    // request to DELETE species from the database
    if (deleteId) {
      axios
        .delete(`${API_ENDPOINT}invasiveSpecies/${deleteId}`)
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
      .post(API_ENDPOINT + "invasiveSpecies", newSpeciesData)
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

  // helper function when input changes
  const handleSearchInputChange = (field, value) => {
    console.log("value: ", value);

    if (field === "region_code_name") {
      const selectedRegionCodes = value.map((region_id) => regionMap[region_id]);
      setTempData((prev) => ({ ...prev, region_id: value, region_code_name: selectedRegionCodes }));
    }
    else {
      setTempData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // search species
  const handleSearch = (searchInput) => {
    // console.log(typeof searchInput);
    // console.log("search input: ", searchInput);

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



  // TODO: match the rows per option with the lambda function
  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // Start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disabled, setDisabled] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

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

      const updatedNameHistory = new Set([...lastSpeciesNameHistory]);
      updatedNameHistory.delete([...updatedNameHistory].pop()); // remove last item from the Set
      setLastSpeciesNameHistory(updatedNameHistory);

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
          searchResults={searchBarResults}
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
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

      {/* pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginLeft: "70%" }}>
        {/* Dropdown for selecting rows per page */}
        <span style={{ marginRight: '10px' }}>Rows per page:</span>
        <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Previous and next buttons for table */}
        <span style={{ marginRight: '10px', marginLeft: "30px" }}>{`${start}-${end} species`}</span>
        <IconButton onClick={handlePreviousPage} disabled={page === 0}>
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton onClick={handleNextPage} disabled={disabled}>
          <NavigateNextIcon />
        </IconButton>
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
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={boldText(tempData.species_description)}
                              onChange={(e) =>
                                handleSearchInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                              // value={
                              // Array.isArray(tempData.alternative_species)
                              //   ? tempData.alternative_species.map((alternative) => {
                              //     const foundOption = AlternativeSpeciesTestData.find(
                              //       (option) => option.scientific_name === alternative
                              //     );
                              //     return foundOption ? foundOption.scientific_name : "";
                              //   })
                              //   : []
                              // }
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
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {Array.isArray(tempData.resource_links) ? (
                                    tempData.resource_links.map((link, index) => (
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

                          {/* region */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                            value={tempData.region_id.map((id) => regionMap[id]).join(", ")}
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
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={boldText(tempData.species_description)}
                              onChange={(e) =>
                                handleSearchInputChange("species_description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              // value={
                              //   Array.isArray(tempData.alternative_species)
                              //     ? tempData.alternative_species.map((alternative) => {
                              //       const foundOption = AlternativeSpeciesTestData.find(
                              //         (option) => option.scientific_name === alternative
                              //       );
                              //       return foundOption ? foundOption.scientific_name : "";
                              //     })
                              //     : []
                              // }
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
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    {Array.isArray(tempData.resource_links) ? (
                                      tempData.resource_links.map((link, index) => (
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

                          {/* region */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            <TextField
                              value={tempData.region_id.map((id) => regionMap[id]).join(", ")}
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
        open={openDeleteConfirmation}
        handleClose={() => setOpenDeleteConfirmation(false)}
        handleDelete={handleConfirmDelete}
      />
    </div >
  );
}

export default InvasiveSpeciesPage;
