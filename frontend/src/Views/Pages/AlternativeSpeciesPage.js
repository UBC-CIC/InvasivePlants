import React, { useState, useEffect, useContext } from "react";
import { Table, TableBody, TableRow } from "@mui/material";
import axios from "axios";

// components
import PaginationComponent from '../../components/PaginationComponent';
import EditAlternativeSpeciesDialog from "../../components/Dialogs/EditAlternativeSpeciesDialog";
import DeleteDialog from "../../components/Dialogs/ConfirmDeleteDialog";
import AddAlternativeSpeciesDialog from "../../components/Dialogs/AddAlternativeSpeciesDialog";
import { ActionButtons } from "../../components/Table/ActionButtons";
import { ResourceLinksCell } from "../../components/Table/ResourceLinksTableCell";
import { ImagesTableCell } from "../../components/Table/ImagesTableCell";
import { NamesTableCell } from "../../components/Table/NamesTableCell";
import { DescriptionTableCell } from "../../components/Table/DescriptionTableCell";
import { AlternativePageTableHeader } from "../../components/Table/AlternativePageTableHeader";
import { NoDataBox } from "../../components/Table/NoDataBox";
import { RowsPerPageDropdown } from "../../components/RowsPerPageDropdown";
import { AddDataButton } from "../../components/AddDataButton";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SearchButton } from "../../components/Search/SearchButton";

// functions
import { formatNames, removeTextInParentheses } from '../../functions/textFormattingUtils';
import { resetStates, updateData, checkNextButtonDisabled, handleNextPage, handlePreviousPage, calculateStartAndEnd, updatePaginationAfterSearch } from "../../functions/pageDisplayUtils";
import { AuthContext } from "../PageContainer/PageContainer";
import { getSignedRequest } from "../../functions/getSignedRequest";
import { updateDropdownOptions } from "../../functions/searchUtils";
import { SearchBar } from "../../components/Search/SearchBar";
import { getPlantsWithImageFiles, getPlantsWithImageLinks, formatImages, postImages } from "../../functions/plantImageUtils";
import { handleGetData } from "../../functions/handleGetData";
import { updateDataToDatabase, handleEditRow, handleFinishEditingRow } from "../../functions/handleEditData";
import { deleteDataFromDatabase, handleDeleteRow } from "../../functions/handleDeleteData";
import { addDataToDatabase } from "../../functions/handleAddData";

function AlternativeSpeciesPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [searchDropdownOptions, setSearchDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
  const [speciesCount, setSpeciesCount] = useState(0); // number of alternative species
  const [data, setData] = useState([]); // original data
  const [displayData, setDisplayData] = useState([]); // data displayed in the table
  const [tempEditingData, setTempEditingData] = useState({}); // temp data of the species being edited
  const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false); // state of the editing an alternative species dialog
  const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false); // state of the adding a new alternative species dialog
  const [searchInput, setSearchInput] = useState(""); // input of the species search bar
  const [deleteId, setDeleteId] = useState(null); // species_id of the row being deleted
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false); // state of the delete confirmation dialog 

  // Pagination states
  const [currOffset, setCurrOffset] = useState(0); // current index of the first species on a page
  const rowsPerPageOptions = [10, 20, 50]; // user selects number of species to display
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]); // start with default 20 rows per page
  const [page, setPage] = useState(0); // Start with page 0
  const [disableNextButton, setDisableNextButton] = useState(false); // disabled next button or not
  const [start, setStart] = useState(0); // starting index of species
  const [end, setEnd] = useState(0); // end index of species
  const [shouldReset, setShouldReset] = useState(false); // state of should reset 
  const [shouldSave, setShouldSave] = useState(false); // state of should save 
  const [shouldCalculate, setShouldCalculate] = useState(true); // whether calculation of start and end should be made

  const [isLoading, setIsLoading] = useState(false); // loading data or not
  const { user, credentials } = useContext(AuthContext);

  useEffect(() => {
    if (credentials) {
      handleGetAlternativeSpecies();
    }
  }, [credentials]);


  const handleGetAlternativeSpecies = async () => {
    handleGetData(
      credentials, setIsLoading, "alternativeSpecies", shouldReset, currOffset, rowsPerPage,
      updateData, setSpeciesCount, setDisplayData, setData, setCurrOffset
    );
  };

  // Maintains history of last species_id and currLastSpeciesId so that on GET, 
  // the current page is maintained instead of starting from page 1
  const handleGetAlternativeSpeciesAfterSave = () => {
    setCurrOffset(curr => curr - rowsPerPage);
    setShouldSave(true) // useEffect listens for this state to change and will GET alternative species when True
  };

  // Request to GET alternative species (same page) after editing a row to see the updated data when shouldSave state changes
  useEffect(() => {
    if (shouldSave) {
      handleGetAlternativeSpecies();
      setShouldSave(false);
    }
  }, [shouldSave]);

  // Fetches the alternative species that matches user search
  const handleGetAlternativeSpeciesAfterSearch = async () => {
    let formattedSearchInput = removeTextInParentheses(searchInput)
    formattedSearchInput = formattedSearchInput.split(',')[0].trim(); // if multiple scientific names, just search up first one
    setIsLoading(true);

    try {
      const response = await getSignedRequest(
        "alternativeSpecies",
        {
          search_input: formattedSearchInput
        },
        credentials
      )

      updatePaginationAfterSearch("species", setShouldCalculate, setDisplayData, response, setStart, setEnd, setIsLoading);
    } catch (error) {
      console.error('Unexpected error searching alternative species:', error);
    }
  };

  // Updates changes to the database on save
  const handleSave = (confirmed) => {
    const jwtToken = user.signInUserSession.accessToken.jwtToken;

    if (confirmed) {
      const formattedData = {
        ...tempEditingData,
        scientific_name: formatNames(tempEditingData.scientific_name),
        common_name: formatNames(tempEditingData.common_name)
      };

      const images = formatImages(formattedData);
      postImages(images, jwtToken);

      updateDataToDatabase("alternativeSpecies", tempEditingData.species_id, formattedData, jwtToken,
        handleGetAlternativeSpeciesAfterSave, handleFinishEditingRow, setOpenEditSpeciesDialog
      );
    };
  };

  // Adds a new alternative species
  const handleAddSpecies = (newSpeciesData) => {
    setIsLoading(true);

    newSpeciesData = {
      ...newSpeciesData,
      scientific_name: newSpeciesData.scientific_name.map(name => name.toLowerCase().replace(/\s+/g, '_'))
    }

    const jwtToken = user.signInUserSession.accessToken.jwtToken

    // Request to POST new alternative species to the database
    axios
      .post(API_BASE_URL + "alternativeSpecies", newSpeciesData, {
        headers: {
          'Authorization': `${jwtToken}`
        }
      })
      .then((response) => {
        const plantsWithImgLinks = getPlantsWithImageLinks(response, newSpeciesData);
        const plantsWithImgFiles = getPlantsWithImageFiles(response, newSpeciesData);
        const allPlantImages = plantsWithImgLinks.concat(plantsWithImgFiles);

        // Uploads all plant images to database
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

  // Reset states
  useEffect(() => {
    if (shouldReset) {
      setIsLoading(true);
      resetStates(setCurrOffset, setPage, setStart, setEnd, setShouldCalculate);
      handleGetAlternativeSpecies();
      setShouldReset(false);
    }
  }, [shouldReset]);

  // Updates temporary row data when field inputs change
  const handleInputChange = (field, value) => {
    setTempEditingData((prev) => ({ ...prev, [field]: value }));
  };

  // Updates search dropdown
  const handleSearch = async (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
      setShouldCalculate(true);
      setSearchDropdownOptions([]);
    } else if (!searchInput.includes('(')) {
      await updateDropdownOptions(credentials, "alternativeSpecies", { search_input: searchInput }, setSearchDropdownOptions)
    }
  };

  // Call to calculate indices
  useEffect(() => {
    if (shouldCalculate) {
      calculateStartAndEnd(page, rowsPerPage, displayData, setStart, setEnd);
    }
  }, [rowsPerPage, page, displayData]);


  // Resets if rowsPerPage changes 
  useEffect(() => {
    setShouldReset(true);
  }, [rowsPerPage]);

  // Call to get next/previous rowsPerPage number of species on page change
  useEffect(() => {
    handleGetAlternativeSpecies();
  }, [page]);

  useEffect(() => {
    setDisableNextButton(checkNextButtonDisabled(displayData, rowsPerPage));
  }, [displayData, rowsPerPage]);


  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
        <SearchBar
          size={3}
          type={"species"}
          options={searchDropdownOptions}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
          getDataAfterSearch={handleGetAlternativeSpeciesAfterSearch}
          text={"Search alternative species"}
        />

        <SearchButton getDataAfterSearch={handleGetAlternativeSpeciesAfterSearch} />
      </div>

      <AddDataButton setOpenDialog={setOpenAddSpeciesDialog} text={"Add Alternative Species"} />

      {/* dropdown for selecting rows per page */}
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
          handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, null, searchInput, page, setPage)}
          handleNextPage={() => handleNextPage(setPage, page)}
          disabled={disableNextButton}
        />
      </div>

      {/* table */}
      <div style={{ width: "90%", display: "flex", justifyContent: "center", marginTop: "-20px" }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          (displayData && displayData.length > 0 ? (
            <Table style={{ width: "100%", tableLayout: "fixed" }}>
              <AlternativePageTableHeader />

              <TableBody>
                {displayData.map((row) => (
                  <TableRow key={row.species_id}>
                    <>
                      <NamesTableCell name={row.scientific_name} />
                      <NamesTableCell name={row.common_name} />
                      <DescriptionTableCell row={row} />
                      <ResourceLinksCell row={row} />
                      <ImagesTableCell row={row} />
                      <ActionButtons
                        editRow={() => handleEditRow(setTempEditingData, setOpenEditSpeciesDialog, row)}
                        deleteRow={() => handleDeleteRow(row.species_id, setDeleteId, setOpenDeleteConfirmation)}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '10px', marginLeft: "75%" }}>
        <PaginationComponent
          start={start}
          end={end}
          count={speciesCount}
          page={page}
          handlePreviousPage={() => handlePreviousPage(displayData, rowsPerPage, setCurrOffset, searchInput, page, setPage)}
          handleNextPage={() => handleNextPage(setPage, page)}
          disabled={disableNextButton}
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
        handleFinishEditingRow={() => handleFinishEditingRow(setOpenEditSpeciesDialog)}
        handleSave={handleSave}
      />

      <DeleteDialog
        open={openDeleteConfirmation}
        handleClose={() => setOpenDeleteConfirmation(false)}
        handleDelete={() => deleteDataFromDatabase("alternativeSpecies", deleteId, user, setSpeciesCount, setShouldReset, setOpenDeleteConfirmation)}
      />
    </div >
  );
}

export default AlternativeSpeciesPage;