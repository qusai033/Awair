// Import necessary modules
const fs = require('fs');
const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed: npm install node-fetch
const express = require('express');
const plotly = require('plotly')('username', 'apiKey'); // You need to replace 'username' and 'apiKey' with your Plotly credentials

// Configuration
const DEVICE_ID = "28563";
const API_KEY = "your_api_key_here";
const ORG_ID = "10994";
const FROM = new Date('2024-02-19T14:00:00Z');
const TO = new Date('2024-02-19T15:00:00Z');
const LIMIT = 120; // Adjust based on your requirements

// Set up Express
const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    try {
        const sensorData = await fetchSensorData();
        const plotUrl = await generatePlot(sensorData);
        res.redirect(plotUrl);
    } catch (error) {
        console.error('Error generating plot:', error);
        res.send("Error generating plot. Check the server logs for more information.");
    }
});

async function fetchSensorData() {
    const url = `https://developer-apis.awair.is/v1/orgs/${ORG_ID}/devices/awair-omni/${DEVICE_ID}/air-data/raw?from=${FROM.toISOString()}&to=${TO.toISOString()}&limit=${LIMIT}&desc=false&fahrenheit=false`;
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data; // Assuming 'data.data' contains the array of sensor readings
}

async function generatePlot(sensorData) {
    // Transform sensorData into the format expected by Plotly
    const timestamps = sensorData.map(entry => entry.timestamp);
    const values = sensorData.map(entry => entry.value); // Adjust this line based on how your data structure is formed

    const trace1 = {
        x: timestamps,
        y: values,
        type: "scatter"
    };

    const figure = { 'data': [trace1] };

    const imgOpts = {
        format: 'png',
        width: 1000,
        height: 500
    };

    return new Promise((resolve, reject) => {
        plotly.getImage(figure, imgOpts, function (error, imageStream) {
            if (error) return reject(error);

            const fileName = "plot.png";
            const fileStream = fs.createWriteStream(fileName);
            imageStream.pipe(fileStream);
            resolve(`/plots/${fileName}`); // Adjust serving path as necessary
        });
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
