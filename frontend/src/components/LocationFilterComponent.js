import { Autocomplete, Box, TextField } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// TextField that displays a dropdown of locations
const LocationFilterComponent = ({ text, handleLocationSearch, inputData, location, setLocation }) => {
  const options = Object.values(inputData);

  return (
    <Box style={{ flex: 1, marginRight: "10px" }}>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option} 
        onInputChange={(e, newInputValue) => {
          handleLocationSearch(newInputValue.toLowerCase());
        }}
        onChange={(e, selectedValue) => {
          // Find the key associated with the selected value
          const selectedKey = Object.keys(inputData).find(
            (key) => inputData[key] === selectedValue
          );
          setLocation(selectedKey);
        }}
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