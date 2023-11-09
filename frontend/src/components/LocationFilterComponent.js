import { Autocomplete, Box, TextField } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const LocationFilterComponent = ({ text, mapTo, handleLocationSearch, inputData, location, setLocation }) => {
  return (
    <Box style={{ flex: 1, marginRight: "10px" }}>
      <Autocomplete
        if
        options={Array.from(new Set(inputData.map((data) => data[mapTo])))}
        getOptionLabel={(option) => option}
        onInputChange={(e, newInputValue) => handleLocationSearch(newInputValue.toLowerCase())}
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ marginRight: '0.5rem' }} />
                {text}
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