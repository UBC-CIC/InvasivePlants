import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { webscrapeBCInvasive, webscrapeONInvasive, webscrapeWikipedia } from '../functions/webscrape';
import { webscrapeInvasiveSpecies, getInvasiveSpeciesScientificNamesBC, getInvasiveSpeciesScientificNamesON } from '../functions/pipeline';

// const FormData = require('form-data');

function PlantNet() {
    const fs = require('fs');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [location, setLocation] = useState('BC');
    const [selectedFile, setSelectedFile] = useState(null);
    const [modelResult, setModelResult] = useState(undefined);
    const [modelObjResult, setModelResultObj] = useState([]);
    const [invasiveListBC, setInvasiveListBC] = useState([]);

    const [speciesInfo, setSpeciesInfo] = useState([]);

    const [numImages, setNumImages] = useState(0);


    const formRef = useRef(null);

    // Handler for file input change
    // const handleFileChange = (event) => {
    //     console.log("event.target.files[0: ", typeof event.target.files[0], event.target.files[0]);
    //     setSelectedFile(event.target.files[0]);
    // };

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

            if (image.name) {
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

    // Handler for form submission
    // const handleUpload = () => {
    //     if (selectedFile) {
    //         let form = new FormData();

    //         form.append('organs', 'auto');
    //         form.append('images', selectedFile);

    //         const project = 'all';
    //         const url = 'https://my-api.plantnet.org/v2/identify/' + project + `?api-key=${process.env.REACT_APP_PLANTNET_API_KEY}`;
    //         axios.post(url, form, {
    //             headers: {
    //                 // 'accept': 'application/json',
    //                 'Content-Type': `multipart/form-data`
    //             }
    //         })
    //             .then((response) => {
    //                 console.log('File uploaded successfully:', response.data);
    //                 // Handle success, e.g., show a success message to the user.

    //                 setModelResult(JSON.stringify(response.data, null, 2));
    //             })
    //             .catch((error) => {
    //                 console.error('Error uploading file:', error);
    //                 // Handle error, e.g., show an error message to the user.
    //             });
    //     }
    // };

    // const handleUpload1 = () => {
    //     // Define the API endpoint and request data
    //     const apiUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.REACT_APP_PLANTNET_API_KEY}`;
    //     const formData = new FormData();

    //     // Add form data fields
    //     formData.append('images', new Blob([selectedFile], { type: 'image/jpeg' }));
    //     formData.append('organs', 'auto');

    //     // Create headers
    //     const headers = {
    //         'accept': 'application/json',
    //         'Content-Type': 'multipart/form-data'
    //     };

    //     // Make the Axios POST request
    //     axios.post(apiUrl, formData, { headers })
    //         .then(response => {
    //             console.log('Response:', response.data);
    //         })
    //         .catch(error => {
    //             console.error('Error:', error);
    //         });
    // };

    const handleLanguageSelection = (event) => {
        console.log("event.target.value: ", event.target.value)
        setSelectedLanguage(event.target.value);
    }

    // const getSpeciesInfo = async (results) => {
    //     let speciesInfoArray = [];
    //     const promises = results.map(async (res) => {
    //         let scientificName = res.species.scientificNameWithoutAuthor;
    //         let score = res.score;
    //         let info = await webscrapeWikipedia(scientificName, score);
    //         speciesInfoArray.push(info);
    //         console.log(speciesInfoArray.length);
    //     });
    //     await Promise.all(promises);
    //     return speciesInfoArray;
    // };

    // only first three results
    const getSpeciesInfo = async (results) => {
        let speciesInfoArray = [];
        const limit = Math.min(results.length, 3);

        for (let i = 0; i < limit; i++) {
            let res = results[i];
            let scientificName = res.species.scientificNameWithoutAuthor;
            let score = res.score;
            let info = await webscrapeWikipedia(scientificName, score);
            speciesInfoArray.push(info);
            console.log(speciesInfoArray.length);
        }
        // console.log("all species: ", speciesInfoArray)
        return speciesInfoArray;
    };

    useEffect(() => {
        // Run BC Invasive webscraping script
        // webscrapeBCInvasive();
        // webscrapeONInvasive();
        // webscrapeInvasiveSpecies();

        // get species info
        const fetchData = async () => {
            try {
                const speciesInfoArray = await getSpeciesInfo(modelObjResult.results);
                setSpeciesInfo(speciesInfoArray);
                console.log("species info: ", speciesInfo)

                if (speciesInfo.length === 3) {
                    const data = JSON.stringify(speciesInfoArray, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });

                    const fileName = 'speciesData.json';

                    saveAs(blob, fileName);
                    return;
                }
            } catch (error) {
                console.error("Error fetching or processing data:", error);
            }
        };
        fetchData();
    }, [modelObjResult.results, speciesInfo]);





    // useEffect(() => {
    //     // Run BC Invasive webscraping script
    //     // webscrapeBCInvasive();
    //     // webscrapeONInvasive();
    //     // webscrapeInvasiveSpecies();

    //     // webscrape wikipedia by getting the "scientificNameWithoutAuthor" for each result returned by API
    //     const getSpeciesInfo = async () => {
    //         if (modelObjResult && modelObjResult.results) {
    //             // console.log("length: ", modelObjResult.results.length)
    //             let speciesInfoArray = [];
    //             for (let res of modelObjResult.results) {
    //                 let scientificName = res.species.scientificNameWithoutAuthor;
    //                 let score = res.score;
    //                 // TODO: check based on user location
    //                 // let isInvasive = invasiveListBC.includes(scientificName)
    //                 // TODO: if invasive, include alternative plants
    //                 let info = await webscrapeWikipedia(scientificName, score);
    //                 speciesInfoArray.push(info);
    //                 console.log(speciesInfoArray.length)
    //             }

    //             // Create a JSON file
    //             if (speciesInfoArray.length === modelObjResult.results.length) {
    //                 setSpeciesInfo(speciesInfoArray);
    //                 console.log("species info: ", speciesInfo)

    //                 const data = JSON.stringify(speciesInfoArray, null, 2);
    //                 const blob = new Blob([data], { type: 'application/json' });

    //                 const fileName = 'speciesData.json';

    //                 // Check if the file exists and delete it if it does
    //                 const existingFile = localStorage.getItem(fileName);
    //                 if (existingFile) {
    //                     localStorage.removeItem(fileName);
    //                     console.log('Existing file deleted');
    //                 }

    //                 saveAs(blob, fileName);
    //                 return;
    //             }
    //         }
    //     };
    //     getSpeciesInfo();
    // }, [modelObjResult, invasiveListBC, speciesInfo]);




    // const filePath = './data/speciesData.json';

    // useEffect(() => {
    //     const getSpeciesInfo = async () => {
    //         if (modelObjResult && modelObjResult.results) {
    //             let speciesInfoArray = [];
    //             for (let res of modelObjResult.results) {
    //                 let scientificName = res.species.scientificNameWithoutAuthor;
    //                 let score = res.score;
    //                 let info = await webscrapeWikipedia(scientificName, score);
    //                 speciesInfoArray.push(info);
    //             }
    //             setSpeciesInfo(speciesInfoArray);
    //         };
    //     }

    //     getSpeciesInfo();

    //     // Create a JSON file
    //     if (speciesInfo) {
    //         const data = JSON.stringify(speciesInfo, null, 2);

    //         fs.writeFile(filePath, data, (err) => {
    //             if (err) {
    //                 console.error('Error writing file', err);
    //             } else {
    //                 console.log('File written successfully');
    //             }
    //         });
    //     }
    // }, [modelObjResult, speciesInfo]);


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
            </div>

            <div>
                {numImages < 4 && <button onClick={() => { setNumImages(numImages + 1) }}>Add more organ</button>}
            </div>
            <form ref={formRef} onSubmit={handleSubmit}>
                {numImages >= 0 &&
                    <div>
                        <input type="file" accept="image/*" name="images0" />

                        <select name="organs0">
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                }

                {numImages >= 1 &&
                    <div>
                        <input type="file" accept="image/*" name="images1" />

                        <select name="organs1">
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                }

                {numImages >= 2 &&
                    <div>
                        <input type="file" accept="image/*" name="images2" />

                        <select name="organs2">
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                }

                {numImages >= 3 &&
                    <div>
                        <input type="file" accept="image/*" name="images3" />

                        <select name="organs3">
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                }

                {numImages >= 4 &&
                    <div>
                        <input type="file" accept="image/*" name="images4" />

                        <select name="organs4">
                            <option value="auto">-- Choose an organ --</option>
                            <option value="flower">Flower</option>
                            <option value="fruit">Fruit</option>
                            <option value="leaf">Leaf</option>
                            <option value="bark">Bark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                }

                <button type="submit">Submit</button>
                {/* <button onClick={handleUpload}>Upload</button> */}
            </form>



            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {selectedFile && <img src={URL.createObjectURL(selectedFile)} style={{
                    maxWidth: '500px',
                    padding: '2%'
                }} />}

                {modelResult && <React.Fragment>
                    <pre style={{ textAlign: 'left' }}>{modelResult}</pre>
                </React.Fragment>}
            </div>
        </React.Fragment>
    );
}

// module.exports = typeof window.self == 'object' ? window.self.FormData : window.FormData;
const FormDataExport = typeof window.self === 'object' ? window.self.FormData : window.FormData;

export { FormDataExport, PlantNet };