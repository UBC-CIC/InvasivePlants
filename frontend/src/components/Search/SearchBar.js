import { Box, Autocomplete, TextField } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { handleKeyPress } from "../../functions/pageDisplayUtils";

// Search bars
export const SearchBar = ({ size, type, options, setSearchInput = null, handleSearch, getDataAfterSearch, text }) => {
    return (
        <Box style={{ flex: size, marginLeft: "10px" }}>
            <Autocomplete
                options={options}
                getOptionLabel={(option) => {
                    if (type === "species") {
                        return `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                    } else if (type === "region") {
                        return `${option.region_fullname} (${option.region_code_name})`
                    } else {
                        return option
                    }
                }}
                onInputChange={(e, newInputValue) => {
                    if (setSearchInput) {
                        setSearchInput(newInputValue);
                    }

                    handleSearch(newInputValue.toLowerCase());
                }}
                clearOnBlur={false}
                onKeyDown={(event) => handleKeyPress(event, getDataAfterSearch)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                {text}
                            </div>
                        }
                        style={{ marginTop: "2rem", marginBottom: "1rem" }}
                    />
                )}
            />
        </Box>
    )
}