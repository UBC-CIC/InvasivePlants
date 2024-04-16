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
import sigV4Client from "../../functions/sigV4Client";

function InvasiveSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const S3_BASE_URL = process.env.REACT_APP_S3_BASE_URL;
  const USER_POOL_ID = process.env.REACT_APP_USERPOOL_ID;
  const IDENTITY_POOL_ID = process.env.REACT_APP_IDENTITY_POOL_ID;
  const REGION = process.env.REACT_APP_REGION;

  const AWS = require("aws-sdk");

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
  const [firstLoad, setFirstLoad] = useState(true); // flag to indicate if it's the first time loading the page
  const [user, setUser] = useState(""); // authorized admin user
  const [jwtToken, setJwtToken] = useState(""); // jwtToken from current session
  const [credentials, setCredentials] = useState(); // temporary credentials

  useEffect(() => {
    retrieveJwtToken();
    retrieveUser();
  }, []);

  useEffect(() => {
    if (user && jwtToken && firstLoad) {
      getIdentityCredentials();
    }
  }, [user, jwtToken]);


  useEffect(() => {
    if (credentials && firstLoad) {
      handleGetInvasiveSpecies();
      setFirstLoad(false);
    }
  }, [credentials]);

  // Gets current authorized user
  const retrieveUser = async () => {
    try {
      const returnedUser = await Auth.currentAuthenticatedUser();
      setUser(returnedUser);
    } catch (e) {
      console.log("error getting user: ", e);
    }
  }

  // Gets temporary AWS credentials
  function getIdentityCredentials() {
    const creds = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.ca-central-1.amazonaws.com/${USER_POOL_ID}`]: jwtToken
      }
    });


    AWS.config.update({
      region: 'ca-central-1',
      credentials: creds
    });

    AWS.config.credentials.get(function () {
      setCredentials(creds);
    });
  }

  // Gets jwtToken for current session 
  const retrieveJwtToken = async () => {
    try {
      var session = await Auth.currentSession()
      var idToken = await session.getIdToken()
      var token = await idToken.getJwtToken()
      setJwtToken(token);

      // Check if the token is close to expiration
      const expirationTime = idToken.getExpiration() * 1000; // Milliseconds
      const currentTime = new Date().getTime();

      if (expirationTime - currentTime < 2700000) { // 45 minutes
        await Auth.currentSession();
        idToken = await session.getIdToken()
        token = await idToken.getJwtToken()
        setJwtToken(token);
      }
    } catch (e) {
      console.log("error getting token: ", e);
    }
  }

  // Fetches rowsPerPage number of invasive species (pagination)
  const handleGetInvasiveSpecies = async () => {
    setIsLoading(true);

    try {
      // Create a new sigV4Client instance
      const signedRequest = sigV4Client
        .newClient({
          accessKey: credentials.accessKeyId,
          secretKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          region: REGION,
          endpoint: API_BASE_URL
        })
        .signRequest({
          method: 'GET',
          path: 'invasiveSpecies',
          headers: {},
          queryParams: {
            curr_offset: shouldReset ? 0 : Math.max(0, currOffset),
            rows_per_page: rowsPerPage
          }
        });

      const response = await fetch(signedRequest.url, {
        headers: signedRequest.headers,
        method: 'GET'
      });

      if (response.ok) {
        const responseData = await response.json();

        // Format data
        const formattedData = responseData.species.map((item) => {
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
            scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name)),
            common_name: item.common_name.map(name => capitalizeEachWord(name)),
            image_links: item.images.map(img => img.image_url),
            s3_keys: item.images.map(img => img.s3_key)
          };
        });

        // Resets pagination details 
        if (shouldReset) {
          setCurrOffset(0);
          setPage(0);
          setStart(0);
          setEnd(0);
          setShouldCalculate(true);
          setShouldReset(false);
        }

        setSpeciesCount(responseData.count[0].count);
        setDisplayData(formattedData);
        setData(formattedData);
        setCurrOffset(responseData.nextOffset);
        setShouldSave(false);
        setIsLoading(false);
      } else {
        console.error('Failed to retrieve invasive species:', response.statusText);
      }
    } catch (error) {
      console.error('Unexpected error retrieving invasive species:', error);
    }
  };

  // Maintains history of last species_id and currLastSpeciesId so that on GET, 
  // the current page is maintained instead of starting from page 1
  const handleGetInvasiveSpeciesAfterSave = () => {
    setCurrOffset(curr => curr - rowsPerPage);
    setShouldSave(true);
  };

  // Request to GET invasive species (same page) after editing a row to see the updated data when shouldSave state changes
  useEffect(() => {
    if (shouldSave) {
      handleGetInvasiveSpecies();
    }
  }, [shouldSave]);

  // Fetches the invasive species that matches user search
  const handleGetInvasiveSpeciesAfterSearch = async () => {
    let formattedSearchInput = searchInput.toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/ /g, '_'); // only keep scientific name, and replace spaces with '_'
    formattedSearchInput = formattedSearchInput.split(',')[0].trim(); // if multiple scientific names, just search up one
    setIsLoading(true);

    try {
      const signedRequest = sigV4Client
        .newClient({
          accessKey: credentials.accessKeyId,
          secretKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          region: REGION,
          endpoint: API_BASE_URL
        })
        .signRequest({
          method: 'GET',
          path: 'invasiveSpecies',
          headers: {},
          queryParams: {
            search_input: formattedSearchInput,
            region_id: regionId,
            rows_per_page: speciesCount
          }
        });

      const response = await fetch(signedRequest.url, {
        headers: signedRequest.headers,
        method: 'GET'
      });

      if (response.ok) {
        const responseData = await response.json();
        const promises = responseData.species.flatMap(item =>
          item.region_id.map(regionId =>
            sigV4Client.newClient({
              accessKey: credentials.accessKeyId,
              secretKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken,
              region: REGION,
              endpoint: API_BASE_URL
            }).signRequest({
              method: 'GET',
              path: `region/${regionId}`,
              headers: {}
            }).url
          )
        );

        await Promise.all(promises);

        const formattedData = responseData.species.map((item) => {
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
            scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name)),
            common_name: item.common_name.map(name => capitalizeEachWord(name)),
            image_links: item.images.map(img => img.image_url),
            s3_keys: item.images.map(img => img.s3_key)
          };
        });

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

        setShouldCalculate(false);
        setDisplayData(uniqueFormattedData);
        uniqueFormattedData.length > 0 ? setStart(1) : setStart(0);
        setEnd(responseData.species.length);
      } else {
        console.error('Failed to search invasive species:', response.statusText);
      }
    } catch (error) {
      console.error('Unexpected error searching invasive species:', error);
    } finally {
      setIsLoading(false);
    }
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
      function formatNames(names) {
        let formattedNames = [];
        if (typeof names === 'string') {
          formattedNames = formatString(names)
            .map(name => name.toLowerCase().replace(/\s+/g, '_'));
        } else if (Array.isArray(names)) {
          formattedNames = names.map(name => name.toLowerCase().replace(/\s+/g, '_'));
        }
        return formattedNames;
      }

      let scientificNames = formatNames(tempEditingData.scientific_name);
      let commonNames = formatNames(tempEditingData.common_name);

      let formattedData = {
        ...tempEditingData,
        scientific_name: scientificNames,
        common_name: commonNames
      };

      const { region_code_name, alternative_species, ...rest } = formattedData;

      // Get just the ids of alternative species
      const alternativeSpeciesIds = alternative_species.map(species => species.species_id);

      const updatedTempDataWithoutRegionCode = {
        ...rest,
        alternative_species: alternativeSpeciesIds,
      };


      // Maps species_id to image_url if links exist and is not empty
      const plantImages = (formattedData.image_links && formattedData.image_links.length > 0) ?
        formattedData.image_links.map(link => ({ species_id: formattedData.species_id, image_url: link })) : null;

      // Maps species_id to image s3_key if keys exist and is not empty
      const imageS3Keys = (formattedData.s3_keys && formattedData.s3_keys.length > 0) ?
        formattedData.s3_keys.map(key => ({ species_id: formattedData.species_id, s3_key: key })) : null;

      // Add new image links only
      const imagesToAdd = (plantImages && plantImages.length > 0) ?
        plantImages.filter(img => !formattedData.images.some(existingImg => existingImg.image_url === img.image_url)) : [];

      // Add new s3 keys only
      const s3KeysToAdd = (imageS3Keys && imageS3Keys.length > 0) ?
        imageS3Keys.filter(key => !formattedData.images.some(existingImg => existingImg.s3_key === key.s3_key)) : [];

      // Combine imagesToAdd and s3KeysToAdd into a single images array
      const images = [
        ...(imagesToAdd),
        ...(s3KeysToAdd)
      ];

      postImages(images);

      // POST new images to the database
      function postImages(images) {
        if (images && images.length > 0) {
          images.forEach(img => {
            axios
              .post(API_BASE_URL + "plantsImages", img, {
                headers: {
                  'Authorization': jwtToken
                }
              })
              .then(() => {
                handleGetInvasiveSpeciesAfterSave();
              })
              .catch(error => {
                console.error("Error adding images", error);
              });
          });
        }
      }

      // Update invasive species table
      axios
        .put(`${API_BASE_URL}invasiveSpecies/${tempEditingData.species_id}`,
          updatedTempDataWithoutRegionCode,
          {
            headers: {
              'Authorization': jwtToken
            }
          })
        .then(() => {
          handleGetInvasiveSpeciesAfterSave();
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
          setCurrOffset(0)
          setShouldReset(true);
          setOpenDeleteConfirmation(false);
        })
        .catch((error) => {
          console.error("Error deleting species", error);
        })
    } else {
      setOpenDeleteConfirmation(false);
    }
  };

  // Adds a new invasive species
  const handleAddSpecies = (newSpeciesData) => {
    setIsLoading(true);

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
      .then((response) => {
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


        // Uploads all plant images 
        allPlantImages.forEach((plantData) => {
          axios
            .post(API_BASE_URL + "plantsImages", plantData, {
              headers: {
                'Authorization': `${jwtToken}`
              }
            })
            .then(() => {
              setCurrOffset(0)
              setShouldReset(true);
              setOpenAddSpeciesDialog(false);
            })
            .catch((error) => {
              console.error("Error adding image", error);
            });
        });

        if (allPlantImages.length === 0) {
          setCurrOffset(0)
          setShouldReset(true);
          setOpenAddSpeciesDialog(false);
        }
      })
      .catch((error) => {
        console.error("Error adding alternative species", error);
      })
  };

  // Call to handleGetInvasiveSpecies if shouldReset state is True
  useEffect(() => {
    if (shouldReset) {
      setIsLoading(true);
      handleGetInvasiveSpecies();
    }
  }, [shouldReset]);

  // Updates temporary row data when field inputs change
  const handleInputChange = async (field, value) => {
    if (field === "all_regions") {
      const regionIds = value.map(region => region.region_id);
      const regionCodeNames = value.map(region => region.region_code_name);

      setTempEditingData(prev => ({
        ...prev,
        region_id: regionIds,
        region_code_name: regionCodeNames
      }));
    }

    try {
      if (field === "region_code_name") {
        const selectedRegionCodes = await Promise.all(value.map(async (region_id) => {
          try {
            const signedRequest = sigV4Client
              .newClient({
                accessKey: credentials.accessKeyId,
                secretKey: credentials.secretAccessKey,
                sessionToken: credentials.sessionToken,
                region: REGION,
                endpoint: API_BASE_URL
              })
              .signRequest({
                method: 'GET',
                path: `region/${region_id}`,
                headers: {}
              });

            const response = await fetch(signedRequest.url, {
              headers: signedRequest.headers,
              method: 'GET'
            });

            if (response.ok) {
              const responseData = await response.json();
              return responseData[0].region_code_name;
            } else {
              console.error('Failed to get region:', response.statusText);
            }
          } catch (error) {
            console.error("Unexpected error retrieving region:", error);
          }
        }));
        setTempEditingData((prev) => ({ ...prev, region_id: value, region_code_name: selectedRegionCodes }));
      } else {
        setTempEditingData((prev) => ({ ...prev, [field]: value }));
      }
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  // Displays original data when search input is empty, otherwise updates dropdown
  const handleSearch = async (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
      setShouldCalculate(true);
      setSearchDropdownSpeciesOptions([]);
    } else {
      try {
        const signedRequest = sigV4Client
          .newClient({
            accessKey: credentials.accessKeyId,
            secretKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            region: REGION,
            endpoint: API_BASE_URL
          })
          .signRequest({
            method: 'GET',
            path: 'invasiveSpecies',
            headers: {},
            queryParams: {
              search_input: searchInput
            }
          });

        const response = await fetch(signedRequest.url, {
          headers: signedRequest.headers,
          method: 'GET'
        });

        if (response.ok) {
          const responseData = await response.json();
          const formattedData = responseData.species.map(item => {
            const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));

            return {
              ...item,
              scientific_name: capitalizedScientificNames,
              common_name: item.common_name.map(name => capitalizeEachWord(name)),
              image_links: item.images.map(img => img.image_url),
              s3_keys: item.images.map(img => img.s3_key)
            };
          });

          if (formattedData.length > 0) {
            const scientificNames = formattedData.flatMap((species) => `${species.scientific_name} (${species.common_name ? species.common_name.join(', ') : ''})`);
            const uniqueScientificNames = [...new Set(scientificNames)];
            setSearchDropdownSpeciesOptions(uniqueScientificNames);
          }
        } else {
          console.error('Failed to search invasive species:', response.statusText);
        }
      } catch (error) {
        console.error('Unexpected error searching invasive species:', error);
      }
    }
  };

  // Searches location and updates displayed data accordingly
  const handleLocationSearch = async (locationInput) => {
    // gets only region full name
    locationInput = locationInput.replace(/\s*\([^)]*\)\s*/, '') // Remove the region code within parentheses
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_'); // Replace spaces with underscores 

    try {
      if (locationInput === "") {
        setDisplayData(data);
        setRegionId("");
      } else {
        const signedRequest = sigV4Client
          .newClient({
            accessKey: credentials.accessKeyId,
            secretKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            region: REGION,
            endpoint: API_BASE_URL
          })
          .signRequest({
            method: 'GET',
            path: 'region',
            headers: {},
            queryParams: {
              region_fullname: locationInput,
            }
          });

        const response = await fetch(signedRequest.url, {
          headers: signedRequest.headers,
          method: 'GET'
        });

        if (response.ok) {
          const responseData = await response.json();

          const formattedData = responseData.regions.map(item => {
            return {
              ...item,
              region_fullname: capitalizeEachWord(item.region_fullname),
              region_code_name: item.region_code_name.toUpperCase(),
            };
          });

          if (formattedData.length > 0) {
            setRegionId(formattedData[0].region_id);
            const regionNames = formattedData.map((region) => `${region.region_fullname} (${region.region_code_name})`);
            setSearchDropdownRegionsOptions(regionNames);
          }
        } else {
          console.error('Failed to search region:', response.statusText);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
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
    if (!firstLoad) {
      setShouldReset(true);
    }
  }, [rowsPerPage]);

  // Call to get next/previous rowsPerPage number of species on page change
  useEffect(() => {
    if (!firstLoad) {
      handleGetInvasiveSpecies();
    }
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
                    {"Search invasive species"}
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
      <div style={{ width: "90%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {isLoading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          (displayData && displayData.length > 0 ? (
            <Table style={{ width: "100%", tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: "8%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Scientific Name(s)
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "7%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Common Name(s)
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "35%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Description
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "10%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Alternative Species
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "10%", whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Resource Links
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "6%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Region(s)
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "8%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Images
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "3%" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Actions
                    </Typography>
                  </TableCell>
                  <TableCell style={{ width: "1%" }}></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(displayData && displayData.length > 0 ? displayData : [])
                  .map((row) => (
                    <TableRow key={row.species_id}>
                      <>
                        {/* scientific names */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                          {Array.isArray(row.scientific_name) ? row.scientific_name.join(", ") : row.scientific_name}
                        </TableCell>

                        {/* common names */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                          {Array.isArray(row.common_name) ? row.common_name.join(", ") : row.common_name}
                        </TableCell>

                        {/* description */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                          {boldText(row.species_description)}
                        </TableCell>

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
                          {Array.isArray(row.region_code_names)
                            ? row.region_code_names.join(", ")
                            : row.region_code_names}
                        </TableCell>

                        {/* image links */}
                        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
                          {Array.isArray(row.image_links) ? (
                            row.image_links.map((link, index) => (
                              <span key={index}>
                                <img
                                  src={link}
                                  alt={`${link}`}
                                  style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                />
                                {row.s3_keys && row.s3_keys[index] && (
                                  <span>
                                    <img
                                      src={`${S3_BASE_URL}${row.s3_keys[index]}`}
                                      alt={`${row.s3_keys[index]}`}
                                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                    />
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
          ) : (
            // No data exists
            !firstLoad && (<Box style={{ margin: 'auto', textAlign: 'center' }}>No species found</Box>)
          )))}
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
        credentials={credentials}
      />

      <EditInvasiveSpeciesDialog
        open={openEditSpeciesDialog}
        tempData={tempEditingData}
        handleInputChange={handleInputChange}
        handleFinishEditingRow={handleFinishEditingRow}
        handleSave={handleSave}
        credentials={credentials}
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