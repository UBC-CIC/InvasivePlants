// import React, { useState, useEffect } from "react";
// import { Tooltip, IconButton, Button, Box, TextField, Typography, ThemeProvider } from "@mui/material";
// import { DataGrid } from '@mui/x-data-grid';
// import Theme from "./Theme";

// import RegionMap from "../functions/RegionMap";
// import EditSpeciesDialog from "../components/EditSpeciesDialogComponent";
// import LocationFilterComponent from '../components/LocationFilterComponent';
// import SearchComponent from '../components/SearchComponent';
// import AddSpeciesDialog from "../components/AddSpeciesDialogComponent";
// import { SpeciesTestData } from "../test_data/speciesTestData";
// import DeleteDialog from "../components/ConfirmDeleteDialog";

// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';


// function SpeciesPage() {
//   const COLOR = '#5e8da6';

//   const [data, setData] = useState(SpeciesTestData);
//   const [displayData, setDisplayData] = useState(SpeciesTestData);
//   const [editingId, setEditingId] = useState(null);
//   const [tempData, setTempData] = useState({});
//   const [openEditSpeciesDialog, setOpenEditSpeciesDialog] = useState(false);
//   const [openAddSpeciesDialog, setOpenAddSpeciesDialog] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState(SpeciesTestData.map((item) => ({ label: item.scientificName, value: item.scientificName })));
//   const [location, setLocation] = useState("");
//   const [deleteId, setDeleteId] = useState(null);
//   const [openConfirmation, setOpenConfirmation] = useState(false);

//   // gets rows that matches search and location input 
//   const filterData = data.filter((item) =>
//     (searchTerm === "" || (
//       item.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (Array.isArray(item.commonName)
//         ? item.commonName.some((name) =>
//           name.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//         : item.commonName.toLowerCase().includes(searchTerm.toLowerCase()))
//     )) &&
//     (location === "" || item.location === RegionMap[location])
//   );

//   useEffect(() => {
//     if (searchTerm === "" && location === "") {
//       setData(SpeciesTestData);
//     } else {
//       const results = filterData.map((item) => ({
//         label: item.scientificName,
//         value: item.scientificName,
//       }));
//       setSearchResults(results);
//     }
//   }, [searchTerm, filterData, location]);

//   // edit species row
//   const startEdit = (id, rowData) => {
//     setEditingId(id);
//     setTempData(rowData);
//     setOpenEditSpeciesDialog(true);
//   };

//   // helper function after saving 
//   const handleFinishEditingRow = () => {
//     setOpenEditSpeciesDialog(false);
//     setEditingId(null);
//   };

//   // saves edited row
//   const handleSave = () => {
//     const updatedData = data.map((item) => {
//       if (item.speciesId === tempData.speciesId) {
//         return { ...tempData };
//       }
//       return item;
//     });

//     setData(updatedData);

//     // Preserve the edited row in the display data
//     const updatedDisplayData = displayData.map((item) => {
//       if (item.speciesId === tempData.speciesId) {
//         return { ...tempData };
//       }
//       return item;
//     });
//     setDisplayData(updatedDisplayData);

//     // TODO: update the database with the updatedData
//     handleFinishEditingRow();
//   };

//   // delete row with Confirmation before deletion
//   const handleDeleteRow = (speciesId) => {
//     setDeleteId(speciesId);
//     setOpenConfirmation(true);
//     console.log("id to delete: ", deleteId);
//   };

//   // Confirm delete
//   const handleConfirmDelete = () => {
//     if (deleteId) {
//       setDisplayData((prev) =>
//         prev.filter((item) => item.speciesId !== deleteId));
//       // TODO: need to delete in from database
//     }
//     setOpenConfirmation(false);
//   };
//   // helper function when search input changes
//   const handleSearchInputChange = (field, value) => {
//     setTempData((prev) => ({ ...prev, [field]: value }));
//   };

//   // search species
//   const handleSearch = (searchInput) => {
//     if (searchInput === "") {
//       setDisplayData(data);
//     } else {
//       const terms = searchInput.toLowerCase().split(" ");
//       const results = data.filter((item) => {
//         const scientificNameMatch = terms.every((term) =>
//           item.scientificName.toLowerCase().includes(term)
//         );

//         const commonNameMatch = Array.isArray(item.commonName)
//           ? item.commonName.some((name) =>
//             terms.every((term) => name.toLowerCase().includes(term))
//           )
//           : terms.every((term) => item.commonName.toLowerCase().includes(term));

//         return scientificNameMatch || commonNameMatch;
//       });

//       setDisplayData(results);
//     }
//   };

//   // search location
//   const handleLocationSearch = (locationInput) => {
//     setLocation(locationInput);

//     if (locationInput === "") {
//       setDisplayData(data);
//     } else {
//       const results = data.filter(
//         (item) => item.location === RegionMap[locationInput]
//       );
//       setDisplayData(results);
//     }
//   };

//   // add species
//   const handleAddSpecies = (newSpeciesData) => {
//     // Generate a unique speciesId for the new species
//     const newSpeciesId = displayData.length + 1;

//     // Create a new species object with the generated speciesId
//     const newSpecies = {
//       speciesId: newSpeciesId,
//       ...newSpeciesData,
//     };

//     setDisplayData([...displayData, newSpecies]);
//     setOpenAddSpeciesDialog(false);
//     console.log("speciesId: ", newSpecies.speciesId);

//     // TODO: update the database with the new entry

//   };


//   // return (
//   return (
//     <ThemeProvider theme={Theme}>
//       <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
//         {/* title */}
//         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
//           <Typography variant="h4" sx={{ textAlign: 'center' }}>
//             Invasive Species List
//           </Typography>
//         </Box>

//         {/* location and search bars*/}
//         <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
//           <LocationFilterComponent
//             handleLocationSearch={handleLocationSearch}
//             location={location}
//             setLocation={setLocation}
//           />

//           <SearchComponent
//             handleSearch={handleSearch}
//             searchResults={searchResults}
//             searchTerm={searchTerm}
//             setSearchTerm={setSearchTerm}
//           />
//         </div>

//         {/* button to add species */}
//         <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
//           {/* <ThemeProvider theme={Theme}> */}
//           <Button variant="contained" onClick={() => setOpenAddSpeciesDialog(true)} startIcon={<AddCircleOutlineIcon />}>
//             Add Species
//           </Button>
//           {/* </ThemeProvider> */}
//         </div>

//         {/* table */}
//         <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
//           <DataGrid
//             columns={[
//               { field: 'scientificName', headerName: 'Scientific Name', width: 150 },
//               { field: 'commonName', headerName: 'Common Name(s)', width: 150 },
//               { field: 'description', headerName: 'Description', width: 300 },
//               { field: 'alternatives', headerName: 'Alternative Species', width: 150 },
//               { field: 'links', headerName: 'Resources', width: 150 },
//               {
//                 field: 'actions',
//                 headerName: 'Actions',
//                 width: 150,
//                 renderCell: (params) => (
//                   <>
//                     <Tooltip title="Edit">
//                       <IconButton onClick={() => startEdit(params.row.speciesId, params.row)}>
//                         <EditIcon />
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Delete">
//                       <IconButton onClick={() => handleDeleteRow(params.row.speciesId)}>
//                         <DeleteIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </>
//                 ),
//               },
//             ]}
//             rows={displayData.map((row) => ({ id: row.speciesId, ...row }))}
//             autoHeight
//             checkboxSelection
//             disableSelectionOnClick
//           />
//         </div >

//         {/* Add species dialog */}
//         <AddSpeciesDialog
//           open={openAddSpeciesDialog}
//           handleClose={() => setOpenAddSpeciesDialog(false)}
//           handleAdd={handleAddSpecies}
//           data={displayData}
//         />

//         <EditSpeciesDialog
//           open={openEditSpeciesDialog}
//           tempData={tempData}
//           handleSearchInputChange={handleSearchInputChange}
//           handleFinishEditingRow={handleFinishEditingRow}
//           handleSave={handleSave}
//         />

//         <DeleteDialog
//           open={openConfirmation}
//           handleClose={() => setOpenConfirmation(false)}
//           handleDelete={handleConfirmDelete}
//         />

//       </div >
//     </ThemeProvider>

//   );
// }

// export default SpeciesPage;
