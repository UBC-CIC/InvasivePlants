import React, { useState, useEffect } from "react";
import {
  InputAdornment, Tooltip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Button,
  TextField, Typography, ThemeProvider
} from "@mui/material";
import Theme from './Theme';
import { Auth } from "aws-amplify";

// components
import SearchComponent from '../../components/SearchComponent';
import PaginationComponent from '../../components/PaginationComponent';
import EditAlternativeSpeciesDialog from "../../dialogs/EditAlternativeSpeciesDialog";
import DeleteDialog from "../../dialogs/ConfirmDeleteDialog";
import AddAlternativeSpeciesDialog from "../../dialogs/AddAlternativeSpeciesDialog";

// icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import axios from "axios";
import { boldText, capitalizeFirstWord, capitalizeEachWord, formatString } from '../../functions/helperFunctions';

function AlternativeSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const S3_BASE_URL = process.env.REACT_APP_S3_BASE_URL;

  const [allAlternativeSpecies, setAllAlternativeSpecies] = useState([]); // array of all alternative species
  const [speciesCount, setSpeciesCount] = useState(0); // number of alternative species
  const [data, setData] = useState([]); // original data
  const [displayData, setDisplayData] = useState([]); // data displayed in the table
  const [editingSpeciesId, setEditingSpeciesId] = useState(null); // species_id of the row being edited
  const [tempEditingData, setTempEditingData] = useState({}); // data of the species being edited
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false); // state of the editing an alternative species dialog
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false); // state of the adding a new alternative species dialog
  const [searchInput, setSearchInput] = useState(""); // input of the species search bar
  const [searchBarDropdownResults, setSearchBarDropdownResults] = useState(displayData.map((species) => ({ 
    label: species.scientific_name, value: species.scientific_name
  })));
  const [deleteId, setDeleteId] = useState(null); // species_id of the row being deleted
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog 
  const [prevLastSpeciesId, setPrevLastSpeciesId] = useState(""); // prev last species
  const [currLastSpeciesId, setCurrLastSpeciesId] = useState(""); // current last species
  const [lastSpeciesIdHistory, setLastSpeciesIdHistory] = useState(new Set("")); // history of last species ids seen for each page
  const [shouldReset, setShouldReset] = useState(false); // reset above values
  const [shouldSave, setShouldSave] = useState(false); // reset above values

  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disabled, setDisabled] = useState(false); // disabled next button or not
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [user, setUser] = useState(""); // authorized admin user

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

  // retriever user on and alternative species on load
  useEffect(() => {
    // console.log("retrieved user!!! + loading all species")
    retrieveUser()
    loadSpeciesNamesInBackground()
    console.log("finished loading species")
  }, [])

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
      setSpeciesCount(prevCount => prevCount + response.data.length)

      // recursively gets species if more exists
      if (response.data.length === rowsPerPage) {
        const newLastSpeciesId = response.data[response.data.length - 1].species_id;
        await fetchAllAlternativeSpecies(newLastSpeciesId);
      }
    } catch (error) {
      console.error("Error retrieving invasive species", error);
    }
  };

  const loadSpeciesNamesInBackground = () => {
    fetchAllAlternativeSpecies();
  };

  const alternativeSpeciesNames = allAlternativeSpecies.map(species => ({
    label: species.scientific_name,
    value: species.scientific_name
  }));

  // fetches alternative species data 
  const handleGetAlternativeSpecies = () => {
    console.log("curr:", currLastSpeciesId, "prev:", prevLastSpeciesId, "history:", lastSpeciesIdHistory);

    // request to GET all alternative species
    axios
      .get(`${API_BASE_URL}alternativeSpecies`, {
        params: {
          last_species_id: shouldReset ? null : currLastSpeciesId, // default first page
          rows_per_page: rowsPerPage  // default 20
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {  

        // formats data 
        const formattedData = response.data.map(item => {
          const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));
          const capitalizedCommonNames = item.common_name.map(name => capitalizeEachWord(name));
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

        console.log("retrieved alternative species data:", formattedData);

        // reset pagination details
        if (shouldReset) {
          setLastSpeciesIdHistory(new Set())
          setPage(0);
          setStart(0);
          setEnd(0);
          setShouldReset(false);
        }

        // update states
        setDisplayData(formattedData);
        setData(formattedData);
        setSearchBarDropdownResults(formattedData.map((item) => ({ label: item.scientific_name, value: item.scientific_name })));

        // update lastSpeciesId with the species_id of the last row displayed in the table
        if (formattedData.length > 0) {
          const newLastSpeciesId = formattedData[formattedData.length - 1].species_id;

          setCurrLastSpeciesId(newLastSpeciesId);
          setLastSpeciesIdHistory(history => new Set([...history, newLastSpeciesId]));
        }
      })
      .catch((error) => {
        console.error("Error getting alternative species", error);
      });
  };

  useEffect(() => {
    if (shouldSave) {
      // request to GET all alternative species
      axios
        .get(`${API_BASE_URL}alternativeSpecies`, {
          params: {
            last_species_id: currLastSpeciesId ? currLastSpeciesId : null, // default first page
            rows_per_page: rowsPerPage  // default 20
          },
          headers: {
            'x-api-key': process.env.REACT_APP_X_API_KEY
          }
        })
        .then((response) => {

          // formats data 
          const formattedData = response.data.map(item => {
            const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));
            const capitalizedCommonNames = item.common_name.map(name => capitalizeEachWord(name));
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

          console.log("retrieved alternative species data:", formattedData);

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
          console.error("Error getting alternative species", error);
        })
        .finally(() => {
          setShouldSave(false);
        });
    }
  }, [shouldSave]);

  // fetches alternative species data 
  const handleGetAlternativeSpeciesAfterSave = () => {
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
  const handleGetAlternativeSpeciesAfterSearch = () => {
    const formattedSearchInput = searchInput.toLowerCase().toLowerCase().replace(/ /g, '_');
    console.log("formatted search input: ", formattedSearchInput);

    axios
      .get(`${API_BASE_URL}alternativeSpecies`, {
        params: {
          scientific_name: formattedSearchInput,
        },
        headers: {
          'x-api-key': process.env.REACT_APP_X_API_KEY
        }
      })
      .then((response) => {

        // formats data 
        const formattedData = response.data.map(item => {
          const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));
          const capitalizedCommonNames = item.common_name.map(name => capitalizeEachWord(name));
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

        console.log("Alternative species retrieved successfully", formattedData);
        setDisplayData(formattedData);
      })
      .catch((error) => {
        console.error("Error searching up alternative species", error);
      });
  };

  const handleReset = () => {
    console.log("reset clicked");
    setShouldReset(true);
    setSearchInput("");
    setAllAlternativeSpecies([]);
    loadSpeciesNamesInBackground();
  }

  // filters display data based on user search input
  useEffect(() => {
    // user can search up species by scientific name or common name
    const filteredData = data.filter((item) =>
    (searchInput === "" || (
      item.scientific_name.some((name) =>
        name.toLowerCase().includes(searchInput.toLowerCase())
      ) ||
      item.common_name.some((name) =>
        name.toLowerCase().includes(searchInput.toLowerCase())
      )
    )))

    // update display data when user searches up a species
    if (searchInput !== "") {
      setDisplayData(filteredData);
    }

    // update the search results based on filtered data
    const results = filteredData.map((item) => ({
      label: item.scientific_name,
      value: item.scientific_name,
    }));

    setSearchBarDropdownResults(results);
  }, [searchInput, data]);

  // begin editing a species
  const startEdit = (species_id, rowData) => {
    setEditingSpeciesId(species_id);
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // helper function after finishing editing a species and saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
    setEditingSpeciesId(null);
  };

  // updates changes to the database on save
  const handleSave = (confirmed) => {
    console.log("saved: temp editing data: ", tempEditingData);

    if (confirmed) {
      // make sure that fields are proper data structure
      let scientificNames = [];
      if (typeof tempEditingData.scientific_name === 'string') {
        scientificNames = formatString(tempEditingData.scientific_name)
          .map(name => name.toLowerCase().replace(/\s+/g, '_'));
      } else if (Array.isArray(tempEditingData.scientific_name)) {
        scientificNames = tempEditingData.scientific_name.map(name => name.toLowerCase().replace(/\s+/g, '_'));
      }

      let commonNames = [];
      if (typeof tempEditingData.common_name === 'string') {
        commonNames = formatString(tempEditingData.common_name)
          .map(name => name.toLowerCase().replace(/\s+/g, '_'));
      } else if (Array.isArray(tempEditingData.common_name)) {
        commonNames = tempEditingData.common_name.map(name => name.toLowerCase().replace(/\s+/g, '_'));
      }

      const formattedData = {
        ...tempEditingData,
        scientific_name: scientificNames,
        common_name: commonNames
      };

      console.log("formatted data", formattedData);

      // maps species_id to image_url if links exist and is not empty
      const plantImages = (formattedData.image_links && formattedData.image_links.length > 0) ?
        formattedData.image_links.map(link => ({ species_id: formattedData.species_id, image_url: link })) : null;

      // maps species_id to image s3_key if keys exist and is not empty
      const imageS3Keys = (formattedData.s3_keys && formattedData.s3_keys.length > 0) ?
        formattedData.s3_keys.map(key => ({ species_id: formattedData.species_id, s3_key: key })) : null;

      console.log("to save s3 keys: ", imageS3Keys);
      console.log("to save images: ", plantImages);

      // add new image links only
      const imagesToAdd = (plantImages && plantImages.length > 0) ?
        plantImages.filter(img => !formattedData.images.some(existingImg => existingImg.image_url === img.image_url)) : null;

      // add new s3 keys only
      const s3KeysToAdd = (imageS3Keys && imageS3Keys.length > 0) ?
        imageS3Keys.filter(key => !formattedData.images.some(existingImg => existingImg.s3_key === key.s3_key)) : null;

      console.log("to add images (links): ", imagesToAdd);
      console.log("to add images (keys): ", s3KeysToAdd);

      // POST new images to the database
      function postImages(images) {
        console.log("images: ", images)

        retrieveUser();
        const jwtToken = user.signInUserSession.accessToken.jwtToken;

        if (images && images.length > 0) {
          images.forEach(img => {
            console.log("curr image:", img);
            axios
              .post(API_BASE_URL + "plantsImages", img, {
                headers: {
                  'Authorization': `${jwtToken}`
                }
              })
              .then(response => {
                console.log("Images added successfully", response.data);
                if (start > rowsPerPage) {
                  handleGetAlternativeSpeciesAfterSave();
                } else {
                  setShouldReset(true);
                }
              })
              .catch(error => {
                console.error("Error adding images", error);
              });
          });
        }
      }
      postImages(imagesToAdd);
      postImages(s3KeysToAdd);


      retrieveUser();
      const jwtToken = user.signInUserSession.accessToken.jwtToken;

      // update alternative species table
      axios
        .put(`${API_BASE_URL}alternativeSpecies/${tempEditingData.species_id}`, formattedData, {
          headers: {
            'Authorization': `${jwtToken}`
          }
        })
        .then((response) => { 
          console.log("alternative species updated successfully", response.data);
          if (start > rowsPerPage) {
            handleGetAlternativeSpeciesAfterSave();
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

  // Deletes species from the table
  // TODO: delete images in s3 bucket too
  const handleConfirmDelete = () => {
    console.log("alt species id to delete: ", deleteId);
    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (deleteId) {
      axios
        .delete(`${API_BASE_URL}alternativeSpecies/${deleteId}`, {
          headers: {
            'Authorization': `${jwtToken}`
          }
        })
        .then((response) => {
          setShouldReset(true);
          console.log("alternative species deleted successfully", response.data);
        })
        .catch((error) => {
          console.error("Error deleting alternative species", error);
        })
        .finally(() => {
          setOpenDeleteConfirmation(false);
        });
    } else {
      setOpenDeleteConfirmation(false);
    }
  };

  // Add new alternative species
  const handleAddSpecies = (newSpeciesData) => {
    newSpeciesData = {
      ...newSpeciesData,
      scientific_name: newSpeciesData.scientific_name.map(name =>
        name.toLowerCase().replace(/\s+/g, '_')
      )
    }

    console.log("adding a new alternative species: ", newSpeciesData);

    retrieveUser();
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    // Request to POST new alternative species to database
    axios
      .post(API_BASE_URL + "alternativeSpecies", newSpeciesData, {
        headers: {
          'Authorization': `${jwtToken}`
        }
      })
      .then((response) => {
        console.log("Alternative species added successfully", response);

        // Maps species id to plant data with image links
        let plantsWithImgLinks = [];
        if (newSpeciesData.image_links && newSpeciesData.image_links.length > 0) {
          plantsWithImgLinks = newSpeciesData.image_links.map((image_link) => ({
            species_id: response.data[0].species_id,
            image_url: image_link
          }));
        }

        // Maps species id to plant data with image files
        let plantsWithImgFiles = [];
        if (newSpeciesData.s3_keys && newSpeciesData.s3_keys.length > 0) {
          plantsWithImgFiles = newSpeciesData.s3_keys.map((key) => ({
            species_id: response.data[0].species_id,
            s3_key: key
          }));
        }

        const allPlantImages = plantsWithImgLinks.concat(plantsWithImgFiles);
        console.log("merged plants: ", allPlantImages);

        // Uploads all plant images 
        allPlantImages.forEach((plantData) => {
          console.log("plant: ", plantData);
          axios
            .post(API_BASE_URL + "plantsImages", plantData, {
              headers: {
                'Authorization': `${jwtToken}`
              }
            })
            .then((response) => {
              console.log("all images added successfully", response.data);
              setShouldReset(true);
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

  // Call to handleGetAlternativeSpecies if shouldReset state is True
  useEffect(() => {
    if (shouldReset) {
      handleGetAlternativeSpecies();
    }
  }, [shouldReset]);

  // Updates row data when its fields change
  const handleInputChange = (field, value) => {
    setTempEditingData((prev) => ({ ...prev, [field]: value }));
  };

  // sets species that match search
  const handleSearch = (searchInput) => {

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


  // calculates start and end indices of the current displayed data in the entire data
  const calculateStartAndEnd = () => {
    const newStart = page * rowsPerPage + 1;
    const newEnd = Math.min((page + 1) * rowsPerPage, (page * rowsPerPage) + displayData.length);
    setStart(newStart);
    setEnd(newEnd);
  };

  useEffect(() => {
    calculateStartAndEnd();
  }, [rowsPerPage, page, displayData]);


  useEffect(() => {
    // console.log("rows per page changed!!: ", rowsPerPage);
    setShouldReset(true);
  }, [rowsPerPage]);

  // updates page count
  const handleNextPage = () => {
    setPage(page + 1); // increment the page by 1 on "next" button click
  };

  // updates page count and history of species seen
  const handlePreviousPage = () => {
    if (lastSpeciesIdHistory.size > 1) {
      const updatedIdHistory = new Set([...lastSpeciesIdHistory]);
      updatedIdHistory.delete([...updatedIdHistory].pop());
      setLastSpeciesIdHistory(updatedIdHistory);

      // gets the previous species id
      const prevSpeciesId = [...updatedIdHistory][[...updatedIdHistory].length - 2];
      setCurrLastSpeciesId(prevSpeciesId);
      setPage(page - 1);
    }
  };

  // gets next/previous set of species on page change
  useEffect(() => {
    handleGetAlternativeSpecies();
  }, [page]);


  // disables the next button if there are no species left to query
  useEffect(() => {
    if (displayData.length === 0 || displayData.length < rowsPerPage) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [displayData, rowsPerPage]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* search bars*/}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "90%" }}>
        <SearchComponent
          text={"Search alternative species (scientific or common name)"}
          handleSearch={handleSearch}
          searchResults={alternativeSpeciesNames}
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
        />

        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => handleGetAlternativeSpeciesAfterSearch()} style={{ marginLeft: "20px", marginTop: "12px", width: "10%", height: "53px", alignItems: "center" }}>
            <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
          </Button>
        </ThemeProvider>

        {/* <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => handleReset()} style={{ marginLeft: "10px", marginTop: "12px", height: "53px", alignItems: "center" }}>
            <RestartAltIcon />
          </Button>
        </ThemeProvider> */}

      </div>


      {/* button to add species */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <ThemeProvider theme={Theme}>
          <Button variant="contained" onClick={() => setOpenAddSpeciesDialog(true)} startIcon={<AddCircleOutlineIcon />}>
            Add Alternative Species
          </Button>
        </ThemeProvider>
      </div>


      {/* dropdown for selecting rows per page */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "67%" }}>
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
              ?
              // displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : []
              displayData : []
            )
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

                        {/* common name */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={
                              Array.isArray(tempEditingData.common_name)
                                ? tempEditingData.common_name.join(", ")
                                : tempEditingData.common_name
                            }
                            onChange={(e) =>
                              handleInputChange("common_name", e.target.value)
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

                        {/* resource links */}
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
                            sx={{
                              width: '100%',
                              wordBreak: 'break-word'
                            }}
                            // allows resource links to be opened in a new tab with proper security settings
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

                        {/* image links */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <TextField
                            value={
                              Array.isArray(tempEditingData.image_links)
                                ? tempEditingData.image_links.join(", ")
                                : tempEditingData.image_links
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "image_links",
                                e.target.value.split(", ")
                              )
                            }
                            // allows image links to be opened in a new tab with proper security settings
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {Array.isArray(tempEditingData.image_links) ? (
                                    tempEditingData.image_links.map((link, index) => (
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
                                        <a href={tempEditingData.image_links} target="_blank" rel="noopener noreferrer">
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

                        {/* edit/delete actions*/}
                        <TableCell>
                          <Tooltip title="Edit"
                            onClick={() => startEdit(row.species_id, row)}>
                            <IconButton><EditIcon /> </IconButton>
                          </Tooltip>
                          <Tooltip
                            title="Delete"
                            onClick={() => {
                              handleDeleteRow(row.species_id, row)
                            }}>
                            <IconButton><DeleteIcon /> </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    ) : (
                      <>
                          {/* not editing the row */}
                          {/* scientific names */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.scientific_name)
                              ? row.scientific_name.join(", ")
                              : row.scientific_name}
                          </TableCell>

                          {/* common names */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {Array.isArray(row.common_name)
                              ? row.common_name.join(", ")
                              : row.common_name}
                          </TableCell>

                          {/* Description */}
                          <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {boldText(row.species_description)}
                          </TableCell>

                          {/* resource links */}
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

                          {/* image links */}
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
                                      <a href={`${S3_BASE_URL}${row.s3_keys[index]}`} target="_blank" rel="noopener noreferrer">
                                        {row.s3_keys[index]}
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
                                      <a href={`${S3_BASE_URL}${row.s3_keys[index]}`} target="_blank" rel="noopener noreferrer">
                                        {row.s3_keys[index]}
                                      </a>
                                      <br />
                                    </span>
                                  ))}
                                <br />
                              </span>
                            )}
                          </TableCell>

                          {/* edit/delete actions */}
                        <TableCell>
                          <Tooltip title="Edit"
                              onClick={() => startEdit(row.species_id, row)}>
                              <IconButton><EditIcon /></IconButton>
                          </Tooltip>
                          <Tooltip
                            title="Delete"
                              onClick={() => {
                                handleDeleteRow(row.species_id, row)
                              }}>
                              <IconButton><DeleteIcon /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
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
      </div>

      <AddAlternativeSpeciesDialog
        open={openAddSpeciesDialog}
        handleClose={() => setOpenAddSpeciesDialog(false)}
        handleAdd={handleAddSpecies}
        data={displayData}
      />

      <EditAlternativeSpeciesDialog
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

export default AlternativeSpeciesPage;
