import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
} from '@mui/material';

const initialData = [
  {
    id: 1,
    commonName: 'Rose',
    scientificName: 'Rosa',
    links: ['http://example.com'],
    description: 'A type of flowering shrub.',
    alternative: ['2'],
  },
  {
    id: 2,
    commonName: 'Rose',
    scientificName: 'Rosa',
    links: ['http://example.com'],
    description: 'A type of flowering shrub.',
    alternative: ['2'],
  },
  // Add more data as needed
];

export default function SpeciesTable({data, setData}) {
//   const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState(null);

  const startEdit = (id, rowData) => {
    setEditingId(id);
    setTempData(rowData);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempData(null);
  };

  const submitEdit = () => {
    setData((prev) => {
      return prev.map((item) => (item.id === editingId ? tempData : item));
    });
    console.log(tempData);
    setEditingId(null);
    setTempData(null);
  };

  const handleInputChange = (field, value) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Common Name</TableCell>
          <TableCell>Scientific Name</TableCell>
          <TableCell>Links</TableCell>
          <TableCell>Description</TableCell>
          {/* <TableCell>Alternative</TableCell> */}
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data && data[0].invasiveSpeciesList.map((row) => (
          <TableRow key={row.id}>
            {editingId === row.id ? (
              <>
                <TableCell>
                  <TextField
                    value={tempData.commonName}
                    onChange={(e) => handleInputChange('commonName', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={tempData.scientificName}
                    onChange={(e) => handleInputChange('scientificName', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={tempData.links.join(', ')}
                    onChange={(e) => handleInputChange('links', e.target.value.split(', '))}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={tempData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </TableCell>
                {/* <TableCell>
                  <TextField
                    value={tempData.alternative.join(', ')}
                    onChange={(e) => handleInputChange('alternative', e.target.value.split(', '))}
                  />
                </TableCell> */}
                <TableCell>
                  <Button onClick={cancelEdit}>Cancel</Button>
                  <Button onClick={submitEdit}>Submit</Button>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>{row.commonName}</TableCell>
                <TableCell>{row.scientificName}</TableCell>
                <TableCell>{row.links.join(', ')}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.alternative.join(', ')}</TableCell>
                <TableCell>
                  <Button onClick={() => startEdit(row.id, row)}>Edit</Button>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};