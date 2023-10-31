import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

// need something wiht location
const initialData = [
  {
    scientificName: "Hemerocallis fulva",
    commonName: [
      "Orange daylily",
      "Tiger Lillies",
      "Fulvous day-lily"
    ], 
    links: ['http://example.com'],
    description: "It is an herbaceous perennial plant growing from tuberous roots, with stems 40–150 centimetres (16–59 inches) tall. The leaves are linear, .mw-parser-output .frac{white-space:nowrap}.mw-parser-output .frac .num,.mw-parser-output .frac .den{font-size:80%;line-height:0;vertical-align:super}.mw-parser-output .frac .den{vertical-align:sub}.mw-parser-output .sr-only{border:0;clip:rect(0,0,0,0);clip-path:polygon(0px 0px,0px 0px,0px 0px);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}0.5–1.5 metres (1+1⁄2–5 feet) long and 1.5–3 cm (1⁄2–1+1⁄4 in) broad. The flowers are 5–12 cm (2–4+3⁄4 in) across, orange-red, with a pale central line on each tepal; they are produced from early summer through late autumn on scapes of ten through twenty flowers, with the individual flowers opening successively, each one lasting only one day. Its fruit is a three-valved capsule 2–2.5 cm (3⁄4–1 in) long and 1.2–1.5 cm (1⁄2–5⁄8 in) broad which splits open at maturity and releases seeds.\n\nBoth diploid and triploid forms occur in the wild, but most cultivated plants are triploids which rarely produce seeds and primarily reproduce vegetatively by stolons. At least four botanical varieties are recognized, including the typical triploid var. fulva, the diploid, long-flowered var. angustifolia (syn.: var. longituba), the triploid var. Flore Pleno, which has petaloid stamens, and the evergreen var. aurantiaca.",
    alternatives: [
      "lilium_michiganense",
      "echinacea_pallida",
      "rudbeckia_hirta"
    ]
  },
  {
    scientificName: 'abc',
    commonName: 'Rose',
    links: ['http://example.com'],
    description: 'A type of flowering shrub.',
    alternatives: ['Hemerocallis fulva'],
  },
  {
    scientificName: "Gypsophila muralis",
    commonName: [
      "Annual Gypsophila",
      "Low Baby's-breath",
      "Cushion baby's-breath"
    ],
    description: "Psammophiliella muralis is an annual, with erect glabrous (non hairy) stems. It grows up to 30–40 cm (12–16 in) tall, with linear shaped leaves. It blooms between summer and fall, with pink or very occasionally white flowers, which are 3.5–6 cm (1.4–2.4 in) across. Later it has fruit capsules, which are ovoid or ellipsoid, inside are snail-shaped seeds.",
    alternatives: []
  },
  {
    commonName: [
      "Baby's-breath",
      "Old-fashioned Baby's-breath",
      "Tall baby's-breath"
    ],
    scientificName: "Gypsophila paniculata",
    description: "Gypsophila paniculata, the baby's breath, common gypsophila or panicled baby's-breath, is a species of flowering plant in the family Caryophyllaceae, native to central and eastern Europe. It is an herbaceous perennial growing to 1.2 m (4 ft) tall and wide, with mounds of branching stems covered in clouds of tiny white flowers in summer (hence the common name \"baby's breath\"). Another possible source of this name is its scent, which has been described as sour milk, like a baby’s “spit-up”. Its natural habitat is on the Steppes in dry, sandy and stony places, often on calcareous soils (gypsophila = \"chalk-loving\"). Specimens of this plant were first sent to Linnaeus from St. Petersburg by the Swiss-Russian botanist Johann Amman.",
    alternative_plants: [
      "perovskia_atriplicifolia",
      "goniolimon_tataricum",
      "achillea_millefolium_hybrids",
      "anaphalis_margaritacea",
      "limonium_latifolium"
    ]
  }
];

function SpeciesTable() {
  const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const filterData = data.filter(
    (item) =>
      item.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(item.commonName)
        ? item.commonName.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : item.commonName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (searchTerm === '') {
      setData(initialData);
    } else {
      const results = filterData.map((item) => ({
        label: item.scientificName,
        value: item.scientificName,
      }));
      setSearchResults(results);
    }
  }, [searchTerm, filterData]);


  const startEdit = (id, rowData) => {
    setEditingId(id);
    setTempData(rowData);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null); 
  };

  const handleSave = () => {
    setData((prev) =>
      prev.map((item) =>
        item.scientificName === tempData.scientificName ? { ...tempData } : item
      )
    );
    // TODO: update database
    handleClose();
  };

  const handleInputChange = (field, value) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (scientificName) => {
    setData((prev) => prev.filter((item) => item.scientificName !== scientificName));
    // TODO: need to delete in database
  };

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredData([]);
    } else {
      const terms = searchTerm.toLowerCase().split(' ');
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

      setFilteredData(results);
    }
  };

  const displayData = searchTerm === '' ? data : filteredData;


  return (
    <div>
      <div style={{ display: 'flex' }}>
        {/* set location */}
        <Box style={{ flex: 1, marginRight: '10px' }}>
          <Autocomplete
            options={["British Columbia (BC)", "Ontario (ON)"]}
            getOptionLabel={(option) => option}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Set Location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                selectOnFocus
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              />
            )}
          />
        </Box>

        {/* search invasive species */}
        <Box style={{ flex: 3, marginLeft: '10px' }}>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search invasive species"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch();
                }}

                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(e.target.value);
                  }
                }}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              />
            )}
          />
        </Box>
      </div>

      {/* table header */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell >
              <Typography variant="subtitle1" fontWeight="bold">
                Scientific Name
              </Typography>
            </TableCell>
            <TableCell >
              <Typography variant="subtitle1" fontWeight="bold">
                Common Name(s)
              </Typography>
            </TableCell>

            <TableCell >
              <Typography variant="subtitle1" fontWeight="bold">
                Description
              </Typography>
            </TableCell>
            <TableCell >
              <Typography variant="subtitle1" fontWeight="bold">
                Alternative Species
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Links
              </Typography>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>

        {/* display species */}
        <TableBody>
          {displayData && displayData.sort((a, b) => a.scientificName.localeCompare(b.scientificName)).map((row) => (
            <TableRow key={row.scientificName}>
              {editingId === row.scientificName ? (
                <>
                  {/* scientific name */}
                  <TableCell>
                    <TextField
                      value={tempData.scientificName}
                      onChange={(e) =>
                        handleInputChange('scientificName', e.target.value)
                      }
                    />
                  </TableCell>

                  {/* common name */}
                  <TableCell>
                    <TextField
                      value={Array.isArray(tempData.commonName) ? tempData.commonName.join(', ') : tempData.commonName}
                      onChange={(e) =>
                        handleInputChange('commonName', e.target.value)
                      }
                    />
                  </TableCell>


                  {/* decsription */}
                  <TableCell>
                    <TextField
                      value={tempData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                    />
                  </TableCell>

                  {/* alternative plants */}
                  <TableCell>
                    <TextField
                      value={Array.isArray(tempData.alternatives) ? tempData.alternatives.join(', ') : tempData.alternatives}
                      onChange={(e) =>
                        handleInputChange(
                          'alternatives',
                          e.target.value.split(', ')
                        )
                      }
                    />
                  </TableCell>

                  {/* links */}
                  <TableCell>
                    <TextField
                      value={tempData.links?.join(', ')}
                      onChange={(e) =>
                        handleInputChange(
                          'links',
                          e.target.value.split(', ')
                        )
                      }
                    />
                  </TableCell>

                  {/* edit/delete */}
                  <TableCell>
                    <Button onClick={() => startEdit(row.scientificName, row)}>
                      Edit
                    </Button>
                    <Button onClick={() => handleDelete(row.scientificName, row)} sx={{ color: 'brown' }}                      >
                      Delete
                    </Button>
                  </TableCell>
                </>
              ) : (
                  <><TableCell>{row.scientificName}</TableCell>
                    <TableCell>{Array.isArray(row.commonName) ? row.commonName.join(', ') : row.commonName}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{Array.isArray(row.alternatives) ? row.alternatives.join(', ') : row.alternatives}</TableCell>
                    <TableCell>{row.links?.join(', ')}</TableCell>
                    <TableCell>
                    <Button onClick={() => startEdit(row.scientificName, row)}>
                      Edit
                    </Button>
                    <Button onClick={() => handleDelete(row.scientificName, row)} sx={{ color: 'brown' }}                      >
                      Delete
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* edit species */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="div" style={{ fontStyle: 'italic' }}>
            {tempData.scientificName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Common Name (separate by commas)"
            value={Array.isArray(tempData.commonName) ? tempData.commonName.join(', ') : tempData.commonName}
            onChange={(e) => handleInputChange('commonName', e.target.value)}
            sx={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }}
          />

          <TextField
            label="Description"
            multiline
            rows={6}
            value={tempData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            sx={{ width: '100%', height: '200px' }}
          />
          <TextField
            label="Alternative Species (separate by commas)"
            value={
              Array.isArray(tempData.alternatives)
                ? tempData.alternatives.join(', ')
                : tempData.alternatives
            }
            onChange={(e) =>
              handleInputChange('alternatives', e.target.value.split(', '))
            }
            sx={{ width: '100%', marginBottom: '1rem' }}
          />
          <TextField
            label="Links (separate by commas)"
            value={tempData.links?.join(', ')}
            onChange={(e) => handleInputChange('links', e.target.value.split(', '))}
            sx={{ width: '100%', marginBottom: '1rem' }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}

export { initialData, SpeciesTable };
