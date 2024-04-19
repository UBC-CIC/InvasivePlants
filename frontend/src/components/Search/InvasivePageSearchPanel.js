import { RegionsSearchBar } from "./RegionsSearchBar"
import { InvasiveSpeciesSearchBar } from "./InvasiveSpeciesSearchBar"
import { SearchButton } from "./SearchButton"
export const InvasivePageSearchPanel = ({ props }) => {
    return (
        <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
            <RegionsSearchBar
                size={1}
                options={props.searchDropdownRegionsOptions}
                handleSearch={props.handleLocationSearch}
                getDataAfterSearch={props.handleGetInvasiveSpeciesAfterSearch}
            />

            <InvasiveSpeciesSearchBar
                options={props.searchDropdownSpeciesOptions}
                setSearchInput={props.setSearchInput}
                handleSearch={props.handleSearch}
                getDataAfterSearch={props.handleGetInvasiveSpeciesAfterSearch}
            />

            <SearchButton getDataAfterSearch={props.handleGetInvasiveSpeciesAfterSearch} />
        </div>
    )
}