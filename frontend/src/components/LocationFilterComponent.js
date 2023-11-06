import { Autocomplete, Box, TextField } from '@mui/material';
import RegionsTestData from '../test_data/regionsTestData';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const LocationFilterComponent = ({ handleLocationSearch, location, setLocation }) => {
  return (
    <Box style={{ flex: 1, marginRight: "10px" }}>
      <Autocomplete
        options={RegionsTestData.map((data) => data.regionCode)}
        getOptionLabel={(option) => option}
        onInputChange={(e, newInputValue) => handleLocationSearch(newInputValue.toLowerCase())}
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ marginRight: '0.5rem' }} />
                Filter by Region
              </div>
            }
            value={location}
            onChange={(e) => {
              setLocation(e.target.value.toLowerCase());
            }}
            style={{ marginTop: "2rem", marginBottom: "1rem" }}
          />
        )}
      />
    </Box>
  );
};

export default LocationFilterComponent;