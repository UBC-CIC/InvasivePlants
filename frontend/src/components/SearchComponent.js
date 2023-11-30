import { Autocomplete, Box, Button, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchComponent = ({ text, handleSearch, searchResults, searchTerm, setSearchTerm }) => {
    return (
        <Box style={{ flex: 3, marginLeft: "10px" }}>
            <Autocomplete
                options={searchResults}
                getOptionLabel={(option) => Array.isArray(option.label) ? option.label.join(', ') : option.label}
                onInputChange={(e, newInputValue) => {
                    handleSearch(newInputValue)
                    setSearchTerm(newInputValue)
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                {text}
                            </div>
                        }
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                        }}
                        style={{ marginTop: "2rem", marginBottom: "1rem" }}
                    />
                )}
            />
        </Box>
    );
};

export default SearchComponent;
