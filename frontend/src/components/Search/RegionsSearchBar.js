import { SearchBar } from "./SearchBar"

export const RegionsSearchBar = ({ size, options, handleSearch, getDataAfterSearch }) => {
    return (
        <SearchBar
            size={size}
            type={"region"}
            options={options}
            handleSearch={handleSearch}
            getDataAfterSearch={getDataAfterSearch}
            text={"Search by region"}
        />
    )
}