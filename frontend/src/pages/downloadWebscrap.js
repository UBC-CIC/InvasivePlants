import React, { useState, useCallback, useEffect, useRef } from 'react';

// Import components
import { webscrapeInvasiveSpecies } from '../functions/pipeline';

export default function DownloadWebscrap(){
    const saveToFile = (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'webscrapedInvasive.json';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    useEffect(() => {
        const getData = async () => {
            const data = await webscrapeInvasiveSpecies();
            saveToFile(data);

            console.log("Data ready!");
        }

        getData();
    },[]);

    return(
        <p>Webscrape and prapare a file.</p>
    );
}
