import React, { useState, useCallback, useEffect, useRef } from 'react';

// Import components
import { webscrapeInvasiveSpecies } from '../../functions/pipeline';
import { dataPipelineForDB } from '../../functions/pipeline';
import { getAlternativePlantsForDB } from '../../functions/alternativePlants';


export default function DownloadWebscrap() {
    const saveToFile = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename; // 'webscrapedInvasive.json';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    useEffect(() => {
        const getData = async () => {
            const data = await dataPipelineForDB();
            saveToFile(data.regions_tb, "regions_tb.json");
            saveToFile(data.invasive_species_tb, "invasive_species_tb.json");
            saveToFile(data.alternative_species_tb, "alternative_species_tb.json");
            saveToFile(data.flaggedSpecies, "flaggedSpecies.json");
            
            console.log("Data ready!");

        }

        getData();
    }, []);

    return (
        <p>Webscrape and prapare a file.</p>
    );
}
