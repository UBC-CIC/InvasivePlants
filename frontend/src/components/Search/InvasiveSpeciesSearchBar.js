import { SearchBar } from "./SearchBar"

export const InvasiveSpeciesSearchBar = ({ options, setSearchInput, handleSearch, getDataAfterSearch }) => {
    return (
        <SearchBar
            size={3}
            type={"species"}
            options={options}
            setSearchInput={setSearchInput}
            handleSearch={handleSearch}
            getDataAfterSearch={getDataAfterSearch}
            text={"Search invasive species"}
        />
    )
}