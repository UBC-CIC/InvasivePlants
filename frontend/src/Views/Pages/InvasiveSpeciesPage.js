import React, { useState, useEffect, useContext } from "react";
import { Table, TableBody, TableRow, Box, Autocomplete, TextField } from "@mui/material";
import axios from "axios";

// components
import PaginationComponent from '../../components/PaginationComponent';
import EditInvasiveSpeciesDialog from "../../components/Dialogs/EditInvasiveSpeciesDialog";
import AddInvasiveSpeciesDialog from "../../components/Dialogs/AddInvasiveSpeciesDialog";
import DeleteDialog from "../../components/Dialogs/ConfirmDeleteDialog";
import { ActionButtons } from "../../components/Table/ActionButtons";
import { ResourceLinksCell } from "../../components/Table/ResourceLinksTableCell";
import { ImagesTableCell } from "../../components/Table/ImagesTableCell";
import { NamesTableCell } from "../../components/Table/NamesTableCell";
import { DescriptionTableCell } from "../../components/Table/DescriptionTableCell";
import { InvasivePageTableHeader } from "../../components/Table/InvasivePageTableHeader";
import { NoDataBox } from "../../components/Table/NoDataBox";
import { RowsPerPageDropdown } from "../../components/RowsPerPageDropdown";
import { AddDataButton } from "../../components/AddDataButton";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SearchButton } from "../../components/SearchButton";

// icons
import SearchIcon from '@mui/icons-material/Search';
import 'bootstrap/dist/css/bootstrap.min.css';

// functions
import { formatNames, removeTextInParentheses } from '../../functions/textFormattingUtils';
import { handleKeyPress, resetStates, updateData } from "../../functions/pageDisplayUtils";
import { AuthContext } from "../PageContainer/PageContainer";
import { getSignedRequest } from "../../functions/getSignedRequest";
import { RegionsTableCell } from "../../components/Table/RegionsTableCell";
import { AlternativeSpeciesTableCell } from "../../components/Table/AlternativeSpeciesTableCell";
import { updateDropdownOptions } from "../../functions/searchUtils";

function InvasiveSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [searchDropdownSpeciesOptions, setSearchDropdownOptions] = useState([]); // dropdown options for invasive species search bar (scientific names)
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
  const { user, credentials } = useContext(AuthContext);


  useEffect(() => {
    if (credentials) {
      handleGetInvasiveSpecies();
    }
  }, [credentials]);


  // Fetches rowsPerPage number of invasive species (pagination)
  const handleGetInvasiveSpecies = async () => {
    if (!credentials) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getSignedRequest(
        "invasiveSpecies",
        {
          curr_offset: shouldReset ? 0 : Math.max(0, currOffset),
          rows_per_page: rowsPerPage
        },
        credentials
      )

      updateData(setSpeciesCount, setDisplayData, setData, setCurrOffset, response.responseData, response.formattedData);
      setIsLoading(false);
    } catch (error) {
      console.log('Unexpected error retrieving invasive species:', error);
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
      setShouldSave(false);
    }
  }, [shouldSave]);

  // Fetches the invasive species that matches user search
  const handleGetInvasiveSpeciesAfterSearch = async () => {
    let formattedSearchInput = searchInput.toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/ /g, '_'); // only keep scientific name, and replace spaces with '_'
    formattedSearchInput = formattedSearchInput.split(',')[0].trim(); // if multiple scientific names, just search up one

    setIsLoading(true);
    try {
      const response = await getSignedRequest(
        "invasiveSpecies",
        {
          search_input: formattedSearchInput,
          region_id: regionId,
          rows_per_page: speciesCount
        },
        credentials
      )

      setShouldCalculate(false);
      setDisplayData(response.formattedData);
      response.formattedData.length > 0 ? setStart(1) : setStart(0);
      setEnd(response.responseData.species.length);
      setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error searching invasive species:', error);
    }
  };

  // Updates editing states when editing a species
  const handleEditRow = (rowData) => {
    setTempEditingData(rowData);
    setOpenEditSpeciesDialog(true);
  };

  // Updates states after editing a species and saving 
  const handleFinishEditingRow = () => {
    setOpenEditSpeciesDialog(false);
  };

  // Updates changes to the database on save
  const handleSave = (confirmed) => {
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (confirmed) {
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
      resetStates(setCurrOffset, setPage, setStart, setEnd, setShouldCalculate);
      handleGetInvasiveSpecies();
      setShouldReset(false);
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
    setTempEditingData((prev) => ({ ...prev, [field]: value }));
  };

  // Displays original data when search input is empty, otherwise updates dropdown
  const handleSearch = async (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
      setShouldCalculate(true);
      setSearchDropdownOptions([]);
    } else if (!searchInput.includes('(')) {
      // Update drop down only when search input is not both full name and common name
      await updateDropdownOptions(credentials, "invasiveSpecies", { search_input: searchInput }, setSearchDropdownOptions)
    }
  };

  // Searches location and updates displayed data accordingly
  const handleLocationSearch = async (locationInput) => {
    locationInput = removeTextInParentheses(locationInput);

    if (locationInput === "") {
      setDisplayData(data);
      setRegionId("");
    } else if (!locationInput.includes('(')) {
      await updateDropdownOptions(credentials, "region", { region_fullname: locationInput }, setSearchDropdownRegionsOptions, setRegionId);
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

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* location and search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>

        {/* regions search bar */}
        <Box style={{ flex: 1, marginLeft: "10px" }}>
          <Autocomplete
            options={searchDropdownRegionsOptions}
            getOptionLabel={(option) => `${option.region_fullname} (${option.region_code_name})`}
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
            getOptionLabel={(option) =>
              `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
            }
            onInputChange={(e, newInputValue) => {
              setSearchInput(newInputValue);
              handleSearch(newInputValue);
            }}
            clearOnBlur={false}
            onKeyDown={(event) => handleKeyPress(event, handleGetInvasiveSpeciesAfterSearch)}
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

        <SearchButton getDataAfterSearch={handleGetInvasiveSpeciesAfterSearch} />
      </div>

      <AddDataButton setOpenDialog={setOpenAddSpeciesDialog} text={"Add Invasive Species"} />

      {/* pagination selections*/}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "67%" }}>
        <RowsPerPageDropdown
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          setRowsPerPage={setRowsPerPage}
          dataCount={speciesCount}
        />

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
          <LoadingSpinner />
        ) : (
          (displayData && displayData.length > 0 ? (
            <Table style={{ width: "100%", tableLayout: "fixed" }}>
              <InvasivePageTableHeader />

              <TableBody>
                {(displayData && displayData.length > 0 ? displayData : [])
                  .map((row) => (
                    <TableRow key={row.species_id}>
                      <>
                        <NamesTableCell name={row.scientific_name} />
                        <NamesTableCell name={row.common_name} />
                        <DescriptionTableCell row={row} />
                        <AlternativeSpeciesTableCell row={row} />
                        <ResourceLinksCell row={row} />
                        <RegionsTableCell row={row} />
                        <ImagesTableCell row={row} />
                        <ActionButtons editRow={handleEditRow} deleteRow={handleDeleteRow} row={row} />
                      </>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <NoDataBox data={"species"} />
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