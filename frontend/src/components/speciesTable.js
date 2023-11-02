import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow, Button, Box, TextField, Typography,
} from "@mui/material";
import locationMap from "../functions/locationMap";
import EditSpeciesDialog from "./EditSpeciesDialogComponent";
import LocationFilterComponent from './LocationFilterComponent';
import SearchComponent from './SearchComponent'; 

const initialData = [
  {
    speciesId: "1",
    scientificName: "Hemerocallis fulva",
    commonName: ["Orange daylily", "Tiger Lillies", "Fulvous day-lily"],
    links: ["http://example.com"],
    description:
      "It is an herbaceous perennial plant growing from tuberous roots, with stems 40–150 centimetres (16–59 inches) tall. The leaves are linear, .mw-parser-output .frac{white-space:nowrap}.mw-parser-output .frac .num,.mw-parser-output .frac .den{font-size:80%;line-height:0;vertical-align:super}.mw-parser-output .frac .den{vertical-align:sub}.mw-parser-output .sr-only{border:0;clip:rect(0,0,0,0);clip-path:polygon(0px 0px,0px 0px,0px 0px);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}0.5–1.5 metres (1+1⁄2–5 feet) long and 1.5–3 cm (1⁄2–1+1⁄4 in) broad. The flowers are 5–12 cm (2–4+3⁄4 in) across, orange-red, with a pale central line on each tepal; they are produced from early summer through late autumn on scapes of ten through twenty flowers, with the individual flowers opening successively, each one lasting only one day. Its fruit is a three-valved capsule 2–2.5 cm (3⁄4–1 in) long and 1.2–1.5 cm (1⁄2–5⁄8 in) broad which splits open at maturity and releases seeds.\n\nBoth diploid and triploid forms occur in the wild, but most cultivated plants are triploids which rarely produce seeds and primarily reproduce vegetatively by stolons. At least four botanical varieties are recognized, including the typical triploid var. fulva, the diploid, long-flowered var. angustifolia (syn.: var. longituba), the triploid var. Flore Pleno, which has petaloid stamens, and the evergreen var. aurantiaca.",
    alternatives: [
      "lilium_michiganense",
      "echinacea_pallida",
      "rudbeckia_hirta",
    ],
    location: locationMap["bc"]
  },
  {
    speciesId: "2",
    scientificName: "abc",
    commonName: "Rose",
    links: ["http://example.com"],
    description: "A type of flowering shrub.",
    alternatives: ["Hemerocallis fulva"],
    location: locationMap["bc"]
  },
  {
    speciesId: "3",
    scientificName: "Gypsophila muralis",
    commonName: [
      "Annual Gypsophila",
      "Low Baby's-breath",
      "Cushion baby's-breath",
    ],
    description:
      "Psammophiliella muralis is an annual, with erect glabrous (non hairy) stems. It grows up to 30–40 cm (12–16 in) tall, with linear shaped leaves. It blooms between summer and fall, with pink or very occasionally white flowers, which are 3.5–6 cm (1.4–2.4 in) across. Later it has fruit capsules, which are ovoid or ellipsoid, inside are snail-shaped seeds.",
    alternatives: [],
    location: locationMap["bc"]
  },
  {
    speciesId: "4",
    scientificName: "Gypsophila paniculata",
    commonName: [
      "Baby's-breath",
      "Old-fashioned Baby's-breath",
      "Tall baby's-breath",
    ],
    description:
      'Gypsophila paniculata, the baby\'s breath, common gypsophila or panicled baby\'s-breath, is a species of flowering plant in the family Caryophyllaceae, native to central and eastern Europe. It is an herbaceous perennial growing to 1.2 m (4 ft) tall and wide, with mounds of branching stems covered in clouds of tiny white flowers in summer (hence the common name "baby\'s breath"). Another possible source of this name is its scent, which has been described as sour milk, like a baby’s “spit-up”. Its natural habitat is on the Steppes in dry, sandy and stony places, often on calcareous soils (gypsophila = "chalk-loving"). Specimens of this plant were first sent to Linnaeus from St. Petersburg by the Swiss-Russian botanist Johann Amman.',
    alternative_plants: [
      "perovskia_atriplicifolia",
      "goniolimon_tataricum",
      "achillea_millefolium_hybrids",
      "anaphalis_margaritacea",
      "limonium_latifolium",
    ],
    location: locationMap["on"]
  },
];

// Display the Species table
function SpeciesTable() {
  // states
  const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(initialData.map((item) => ({ label: item.scientificName, value: item.scientificName })));
  const [displayData, setDisplayData] = useState(initialData);
  const [location, setLocation] = useState("");

  // gets rows that matches search and location input 
  const filterData = data.filter((item) =>
    (searchTerm === "" || (
      item.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(item.commonName)
        ? item.commonName.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : item.commonName.toLowerCase().includes(searchTerm.toLowerCase()))
    )) &&
    (location === "" || item.location === locationMap[location])
  );

  useEffect(() => {
    if (searchTerm === "" && location === "") {
      setData(initialData);
    } else {
      const results = filterData.map((item) => ({
        label: item.scientificName,
        value: item.scientificName,
      }));
      setSearchResults(results);
    }
  }, [searchTerm, filterData, location]);

  // edit species row
  const startEdit = (id, rowData) => {
    setEditingId(id);
    setTempData(rowData);
    setOpen(true);
  };

  // helper function after saving 
  const handleFinishEditingRow = () => {
    setOpen(false);
    setEditingId(null);
  };

  // saves edited row
  const handleSave = () => {
    const updatedData = data.map((item) => {
      if (item.speciesId === tempData.speciesId) {
        return { ...tempData };
      }
      return item;
    });

    setData(updatedData);

    // Preserve the edited row in the display data
    const updatedDisplayData = displayData.map((item) => {
      if (item.speciesId === tempData.speciesId) {
        return { ...tempData };
      }
      return item;
    });
    setDisplayData(updatedDisplayData);

    // TODO: update the database with the updatedData
    handleFinishEditingRow();
  };

  // delete row
  const handleDeleteRow = (speciesId) => {
    setDisplayData((prev) =>
      prev.filter((item) => item.speciesId !== speciesId)
    );
    // TODO: need to delete in database
  };

  // helper function when search input changes
  const handleSearchInputChange = (field, value) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  // search species
  const handleSearch = (searchInput) => {
    if (searchInput === "") {
      setDisplayData(data);
    } else {
      const terms = searchInput.toLowerCase().split(" ");
      const results = data.filter((item) => {
        const scientificNameMatch = terms.every((term) =>
          item.scientificName.toLowerCase().includes(term)
        );

        const commonNameMatch = Array.isArray(item.commonName)
          ? item.commonName.some((name) =>
            terms.every((term) => name.toLowerCase().includes(term))
          )
          : terms.every((term) => item.commonName.toLowerCase().includes(term));

        return scientificNameMatch || commonNameMatch;
      });

      setDisplayData(results);
    }
  };

  // search location
  const handleLocationSearch = (locationInput) => {
    setLocation(locationInput);

    if (locationInput === "") {
      setDisplayData(data);
    } else {
      const results = data.filter(
        (item) => item.location === locationMap[locationInput]
      );
      setDisplayData(results);
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* title */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          Invasive Species List
        </Typography>
      </Box>

      {/* location and search bars*/}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <LocationFilterComponent
          handleLocationSearch={handleLocationSearch}
          location={location}
          setLocation={setLocation}
        />

        <SearchComponent
          handleSearch={handleSearch}
          searchResults={searchResults}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* table */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          {/* table header */}
          <TableHead>
            <TableRow>
              <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Scientific Name
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Common Name(s)
                </Typography>
              </TableCell>
              <TableCell style={{ width: "45%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell style={{ width: "10%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Alternative Species
                </Typography>
              </TableCell>
              <TableCell style={{ width: "12%" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resources
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
            {displayData &&
              (location !== ""
                ? displayData
                  .filter((item) => item.location === locationMap[location])
                  .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
                  .map((row) => (
                    <TableRow key={row.speciesId}>
                      {/* editing the row */}
                      {editingId === row.speciesId ? (
                        <>
                          {/* scientific name */}
                          <TableCell>
                            <TextField
                              value={tempData.scientificName}
                              onChange={(e) =>
                                handleSearchInputChange("scientificName", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* common name */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.commonName)
                                  ? tempData.commonName.join(", ")
                                  : tempData.commonName
                              }
                              onChange={(e) =>
                                handleSearchInputChange("commonName", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* decsription */}
                          <TableCell>
                            <TextField
                              value={tempData.description}
                              onChange={(e) =>
                                handleSearchInputChange("description", e.target.value)
                              }
                            />
                          </TableCell>

                          {/* alternative plants */}
                          <TableCell>
                            <TextField
                              value={
                                Array.isArray(tempData.alternatives)
                                  ? tempData.alternatives.join(", ")
                                  : tempData.alternatives
                              }
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "alternatives",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* links */}
                          <TableCell>
                            <TextField
                              value={tempData.links?.join(", ")}
                              onChange={(e) =>
                                handleSearchInputChange(
                                  "links",
                                  e.target.value.split(", ")
                                )
                              }
                            />
                          </TableCell>

                          {/* edit/delete */}
                          <TableCell>
                            <Button onClick={() => startEdit(row.speciesId, row)}>
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteRow(row.speciesId, row)}
                              sx={{ color: "brown" }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{row.scientificName}</TableCell>
                            <TableCell>
                              {Array.isArray(row.commonName)
                                ? row.commonName.join(", ")
                                : row.commonName}
                            </TableCell>
                            <TableCell>{row.description}</TableCell>
                            <TableCell>
                              {Array.isArray(row.alternatives)
                                ? row.alternatives.join(", ")
                                : row.alternatives}
                            </TableCell>
                            <TableCell>{row.links?.join(", ")}</TableCell>
                            <TableCell>
                            <Button onClick={() => startEdit(row.speciesId, row)}>
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteRow(row.speciesId, row)}
                              sx={{ color: "brown" }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
              : displayData
                .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
                .map((row) => (
                  <TableRow key={row.speciesId}>
                    {/* editing the row */}
                    {editingId === row.speciesId ? (
                      <>
                        {/* scientific name */}
                        <TableCell>
                          <TextField
                            value={tempData.scientificName}
                            onChange={(e) =>
                              handleSearchInputChange("scientificName", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* common name */}
                        <TableCell>
                          <TextField
                            value={
                              Array.isArray(tempData.commonName)
                                ? tempData.commonName.join(", ")
                                : tempData.commonName
                            }
                            onChange={(e) =>
                              handleSearchInputChange("commonName", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* decsription */}
                        <TableCell>
                          <TextField
                            value={tempData.description}
                            onChange={(e) =>
                              handleSearchInputChange("description", e.target.value)
                            }
                          />
                        </TableCell>

                        {/* alternative plants */}
                        <TableCell>
                          <TextField
                            value={
                              Array.isArray(tempData.alternatives)
                                ? tempData.alternatives.join(", ")
                                : tempData.alternatives
                            }
                            onChange={(e) =>
                                handleSearchInputChange(
                                  "alternatives",
                                  e.target.value.split(", ")
                                )
                              }
                          />
                        </TableCell>

                        {/* links */}
                        <TableCell>
                          <TextField
                            value={tempData.links?.join(", ")}
                            onChange={(e) =>
                                handleSearchInputChange(
                                  "links",
                                  e.target.value.split(", ")
                                )
                              }
                          />
                        </TableCell>

                        {/* edit/delete */}
                        <TableCell>
                          <Button onClick={() => startEdit(row.speciesId, row)}>
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteRow(row.speciesId, row)}
                            sx={{ color: "brown" }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{row.scientificName}</TableCell>
                        <TableCell>
                          {Array.isArray(row.commonName)
                            ? row.commonName.join(", ")
                            : row.commonName}
                        </TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          {Array.isArray(row.alternatives)
                            ? row.alternatives.join(", ")
                            : row.alternatives}
                        </TableCell>
                        <TableCell>{row.links?.join(", ")}</TableCell>
                        <TableCell>
                          <Button onClick={() => startEdit(row.speciesId, row)}>
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteRow(row.speciesId, row)}
                            sx={{ color: "brown" }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )))}
          </TableBody>
        </Table>
      </div >

      <EditSpeciesDialog
        open={open}
        tempData={tempData}
        handleSearchInputChange={handleSearchInputChange}
        handleFinishEditingRow={handleFinishEditingRow}
        handleSave={handleSave}
      />
    </div >
  );
}

export { initialData, SpeciesTable };
