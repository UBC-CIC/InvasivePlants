import { Autocomplete, Box, TextField } from '@mui/material';

const SearchComponent = ({ handleSearch, searchResults, searchTerm, setSearchTerm }) => {
    return (
        <Box style={{ flex: 3, marginLeft: "10px" }}>
            <Autocomplete
                options={searchResults}
                getOptionLabel={(option) => option.label}
                onInputChange={(e, newInputValue) => handleSearch(newInputValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search invasive species (common or scientific name)"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // handleSearch();
                        }}
                        style={{ marginTop: "2rem", marginBottom: "1rem" }}
                    />
                )}
            />
        </Box>
    );
};

export default SearchComponent;
