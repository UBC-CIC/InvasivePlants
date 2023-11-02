import { Autocomplete, Box, TextField } from '@mui/material';

const LocationFilterComponent = ({ handleLocationSearch, location, setLocation }) => {
  return (
    <Box style={{ flex: 1, marginRight: "10px" }}>
      <Autocomplete
        options={["BC", "ON"]}
        getOptionLabel={(option) => option}
        onInputChange={(e, newInputValue) => handleLocationSearch(newInputValue.toLowerCase())}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Filter by Location"
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