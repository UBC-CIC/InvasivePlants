import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { webscrapeBCInvasive, webscrapeONInvasive, webscrapeWikipedia } from '../functions/webscrape';
import { webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI, testDataPipeline } from '../functions/pipeline';

// const FormData = require('form-data');
import { speciesDataToJSON } from '../functions/speciesToJSON';
import { getONPlants, mapInvasiveToAlternativeBC, mapInvasiveToAlternativeON } from '../functions/alternativePlants';

function PlantNet() {
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [selectedLocation, setSelectedLocation] = useState('ON');
    const [selectedFile, setSelectedFile] = useState(null);
    const [modelResult, setModelResult] = useState(undefined);
    const [modelObjResult, setModelResultObj] = useState([]);
    const [numImages, setNumImages] = useState(0);
    const [isFileSaved, setIsFileSaved] = useState(false);
    const formRef = useRef(null);

    // Handle for submiting the form
    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(formRef.current);
        const formDataPlantNet = new FormData();
        let acceptedImage = 0;

        // Add all organ into one
        for (let i = 0; i <= numImages; i++) {
            const image = formData.get('images' + i.toString());
            const organ = formData.get('organs' + i.toString());

            if (image && image.name) {
                formDataPlantNet.append('organs', organ);
                formDataPlantNet.append('images', image);

                console.log("organs: ", organ, "images:", image);
                acceptedImage++;
            }
        }

        // Submit form to Pl@ntNet API
        const project = 'all';
        const url = 'https://my-api.plantnet.org/v2/identify/' + project + `?api-key=${process.env.REACT_APP_PLANTNET_API_KEY}&include-related-images=true&lang=${selectedLanguage}`;
        axios.post(url, formDataPlantNet, {
            headers: {
                'Content-Type': `multipart/form-data`
            }
        })
            .then((response) => {
                // Handle success, e.g., show a success message to the user.
                console.log('File uploaded successfully: ', response.data);
                setModelResultObj(response.data);
                setModelResult(JSON.stringify(response.data, null, 2));
            })
            .catch((error) => {
                const keyWord = "not found";
                if (error.response.status === 404 && error.response.data.message.toString().includes(keyWord)) {
                    setModelResult(error.response.data.message.toString());
                }
                console.error('Error uploading file:', error);
                // Handle error, e.g., show an error message to the user.
            });
    }

    const handleLanguageSelection = (event) => {
        console.log("language: ", event.target.value)
        setSelectedLanguage(event.target.value);
    }

    const handleLocationSelection = (event) => {
        console.log("location: ", event.target.value)
        setSelectedLocation(event.target.value);
    }

    // get top 3 results
    const getSpeciesResultInfo = useCallback(async (results) => {
        let speciesInfoArray = [];
        let count = 0;

        for (let i = 0; i < results.length; i++) {
            if (count < 3) {
                let res = results[i];
                let commonName = res.species.commonNames;
                let scientificName = res.species.scientificNameWithoutAuthor;
                let score = res.score;
                let info = await speciesDataToJSON(commonName, scientificName, score, selectedLocation);
                speciesInfoArray.push(info);
                count++;
                console.log(speciesInfoArray.length);
            } else {
                break;
            }
        }
        return speciesInfoArray;
    }, [selectedLocation]);


    useEffect(() => {
        
        testDataPipeline();


        const fetchData = async () => {
            try {
                if (!isFileSaved && modelObjResult && modelObjResult.results) {
                    const speciesInfoArray = await getSpeciesResultInfo(modelObjResult.results);
                    console.log("species info: ", speciesInfoArray);

                    if (speciesInfoArray.length === Math.min(modelObjResult.results.length, 3)) {
                        const data = JSON.stringify(speciesInfoArray, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });

                        const fileName = 'speciesData.json';

                        saveAs(blob, fileName);
                        setIsFileSaved(true);
                    }
                }
            } catch (error) {
                console.log("error getting species info: ", error);
            }
        };
        fetchData();
    }, [isFileSaved, modelObjResult, getSpeciesResultInfo, selectedLocation]);


    return (
        <React.Fragment>
            <p>Experiment on Pl@ntNet</p>
            <h1>Image Upload</h1>
            <div>
                <select onChange={handleLanguageSelection}>
                    <option value="en">-- Choose a language --</option>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                </select>

                <select onChange={handleLocationSelection}>
                    <option>-- Choose a Location --</option>
                    <option>BC</option>
                    <option>ON</option>
                </select>
            </div>

            <div>
                {numImages < 4 && <button onClick={() => { setNumImages(numImages + 1) }}>Add more organ</button>}
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
                {[...Array(numImages).keys()].map((index) => (
                    <div key={index}>
                        <input type="file" accept="image/*" name={`images${index}`} />

                        <select name={`organs${index}`}>
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                ))}
                <button type="submit">Submit</button>
            </form>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="" style={{
                    maxWidth: '500px',
                    padding: '2%'
                }} />}

                {modelResult && (
                    <pre style={{ textAlign: 'left' }}>{modelResult}</pre>
                )}
            </div>
        </React.Fragment>
    );
};

const FormDataExport = typeof window.self === 'object' ? window.self.FormData : window.FormData;

export { FormDataExport, PlantNet };