import React, { useState } from 'react';
import { TextField, Chip, Autocomplete } from '@mui/material';

export default function AlternativeSpeciesSelector() {
    const [value, setValue] = useState(['Maria Anders']);
    const options = ["Maria Anders", "Elizabeth Lincoln", "Elizabeth Brown", "Roland Mendel", "Diego Roel", "ASFDS", "QWEQ", "ECDSAGA", "AGREBD", "GREERARA"];

	return (
	<Autocomplete
		fullWidth
		multiple
		value={value}

		onChange={(event, newValue) => {
			setValue(newValue);
		}}
		options={options}
		renderInput={(params) => (
			<TextField {...params} variant="outlined" placeholder="Search" />
		)}
		isOptionEqualToValue={(option, value) => option === value}
		renderTags={(value, getTagProps) =>
			value.map((option, index) => (
				<Chip variant="outlined" label={option} {...getTagProps({ index })} />
			))
		}
	/>
	);
};
