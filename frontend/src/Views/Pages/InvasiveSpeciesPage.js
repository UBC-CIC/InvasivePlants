import React, { useState, useEffect, useContext } from "react";
import { Table, TableBody, TableRow } from "@mui/material";
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

// functions
import { formatNames, removeTextInParentheses } from '../../functions/textFormattingUtils';
import { resetStates, updateData, checkNextButtonDisabled, handleNextPage, handlePreviousPage, calculateStartAndEnd } from "../../functions/pageDisplayUtils";
import { AuthContext } from "../PageContainer/PageContainer";
import { getSignedRequest } from "../../functions/getSignedRequest";
import { RegionsTableCell } from "../../components/Table/RegionsTableCell";
import { AlternativeSpeciesTableCell } from "../../components/Table/AlternativeSpeciesTableCell";
import { updateDropdownOptions } from "../../functions/searchUtils";
import { InvasivePageSearchPanel } from "../../components/Search/InvasivePageSearchPanel";
import { getPlantsWithImageFiles, getPlantsWithImageLinks, formatImages, postImages } from "../../functions/plantImageUtils";
import { handleGetData } from "../../functions/handleGetData";
import { updateDataToDatabase, handleEditRow, handleFinishEditingRow } from "../../functions/handleEditData";
import { deleteDataFromDatabase } from "../../functions/handleDeleteData";
import { addDataToDatabase } from "../../functions/handleAddData";

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
  const [disableNextButton, setDisableNextButton] = useState(false); // disabled next button or not
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


  const handleGetInvasiveSpecies = async () => {
    handleGetData({
      credentials, setIsLoading, path: "invasiveSpecies", shouldReset, currOffset, rowsPerPage,
      updateData, setCount: setSpeciesCount, setDisplayData, setData, setCurrOffset
    });
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
      // Invalid region input
      if (formattedSearchInput === "" && regionId === "") {
        setDisplayData([]);
      } else {
        const response = await getSignedRequest(
          "invasiveSpecies",
          {
            search_input: formattedSearchInput,
            region_id: regionId,
            rows_per_page: speciesCount
          },
          credentials
        )

        setDisplayData(response.formattedData);
        response.formattedData.length > 0 ? setStart(1) : setStart(0);
        setEnd(response.responseData.species.length);
      }

      setShouldCalculate(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error searching invasive species:', error);
    }
  };

  // Updates changes to the database on save
  const handleSave = (confirmed) => {
    const jwtToken = user.signInUserSession.accessToken.jwtToken

    if (confirmed) {
      const formattedData = {
        ...tempEditingData,
        scientific_name: formatNames(tempEditingData.scientific_name),
        common_name: formatNames(tempEditingData.common_name)
      };

      const { region_code_name, alternative_species, ...rest } = formattedData;

      // Get just the ids of alternative species
      const alternativeSpeciesIds = alternative_species.map(species => species.species_id);

      const updatedTempDataWithoutRegionCode = {
        ...rest,
        alternative_species: alternativeSpeciesIds,
      };

      const images = formatImages(formattedData);
      postImages(images, jwtToken);

      updateDataToDatabase({
        path: "invasiveSpecies",
        id: tempEditingData.species_id,
        formattedData: updatedTempDataWithoutRegionCode,
        jwtToken: jwtToken,
        handleGetData: handleGetInvasiveSpeciesAfterSave,
        handleFinishEditingRow: () => handleFinishEditingRow({ setOpenEditDialog: setOpenEditSpeciesDialog })
      });
    };
  };

  // Opens confirmation dialog before deletion
  const handleDeleteRow = (species_id) => {
    setDeleteId(species_id);
    setOpenDeleteConfirmation(true);
  };

  // Adds a new invasive species
  const handleAddSpecies = (newSpeciesData) => {
    setIsLoading(true);

    newSpeciesData = {
      ...newSpeciesData,
      scientific_name: formatNames(newSpeciesData.scientific_name),
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
        const plantsWithImgLinks = getPlantsWithImageLinks({ response, newSpeciesData });
        const plantsWithImgFiles = getPlantsWithImageFiles({ response, newSpeciesData });
        const allPlantImages = plantsWithImgLinks.concat(plantsWithImgFiles);

        // Uploads all plant images database
        allPlantImages.forEach((plantData) => {
          addDataToDatabase("plantsImages", plantData, jwtToken, setCurrOffset, setShouldReset, setOpenAddSpeciesDialog);
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
      await updateDropdownOptions(credentials, "invasiveSpecies", { search_input: searchInput }, setSearchDropdownOptions)
    }
  };

  // Searches location and updates displayed data accordingly
  const handleLocationSearch = async (locationInput) => {
    locationInput = removeTextInParentheses(locationInput);

    if (locationInput === "") {
      setDisplayData(data);
      setRegionId("");
      setShouldCalculate(true);
      setSearchDropdownRegionsOptions([]);
    } else if (!locationInput.includes('(')) {
      await updateDropdownOptions(credentials, "region", { region_fullname: locationInput }, setSearchDropdownRegionsOptions, setRegionId);
    }
  };

  // Call to calculate indices
  useEffect(() => {
    if (shouldCalculate) {
      calculateStartAndEnd(page, rowsPerPage, displayData, setStart, setEnd);
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

  // Disables the next button if there are no species left to query or if search by region only
  useEffect(() => {
    setDisableNextButton(checkNextButtonDisabled(displayData, rowsPerPage));
  }, [displayData, rowsPerPage]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <InvasivePageSearchPanel
        props={{
          searchDropdownRegionsOptions,
          handleLocationSearch,
          handleGetInvasiveSpeciesAfterSearch,
          searchDropdownSpeciesOptions,
          setSearchInput,
          handleSearch
        }}
      />

      < AddDataButton setOpenDialog={setOpenAddSpeciesDialog} text={"Add Invasive Species"} />

      {/* pagination selections*/}
      < div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "67%" }
      }>
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
          handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, regionId, searchInput, page, setPage)}
          handleNextPage={() => handleNextPage(setPage, page)}
          disabled={disableNextButton}
        />
      </div >

      {/* table */}
      < div style={{ width: "90%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {
          isLoading ? (
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
                          <ActionButtons
                            editRow={() => handleEditRow({ setTempEditingData, setOpenEditDialog: setOpenEditSpeciesDialog, rowData: row })}
                            deleteRow={handleDeleteRow}
                            row={row}
                          />
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
          handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, regionId, searchInput, page, setPage)}
          handleNextPage={() => handleNextPage(setPage, page)}
          disabled={disableNextButton}
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
        handleFinishEditingRow={() => handleFinishEditingRow({ setOpenEditDialog: setOpenEditSpeciesDialog })}
        handleSave={handleSave}
        credentials={credentials}
      />

      <DeleteDialog
        open={openDeleteConfirmation}
        handleClose={() => setOpenDeleteConfirmation(false)}
        handleDelete={() => deleteDataFromDatabase("invasiveSpecies", deleteId, user, setSpeciesCount, setShouldReset, setOpenDeleteConfirmation)}
      />
    </div >
  );
}

export default InvasiveSpeciesPage;