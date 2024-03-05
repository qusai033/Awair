const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const app = express();
const port = 3000;

// API and device configuration
const FROM = new Date('19 February 2024 14:00');
const TO = new Date('19 February 2024 15:00');
const LIMIT = 120;
const DEVICE_ID = "28563";
const API_KEY = "UfwaYhhnQJDJ1GoX37GHDy6CmPstQGyl";
const ORG_ID = "10994";
let sensorData = []; // Array to store sensor data for plotting

// CSV setup
const csvWriter = createObjectCsvWriter({
    path: 'sensor_data.csv',
    header: [
        {id: 'timestamp', title: 'TIMESTAMP'},
        {id: 'lux', title: 'LUX'},
        // Add all other sensor headers here
    ],
    append: true, // Append data if file exists
});

// Function to fetch and parse data
async function fetchData() {
    const url = `https://developer-apis.awair.is/v1/orgs/${ORG_ID}/devices/awair-omni/${DEVICE_ID}/air-data/raw?from=${FROM.toISOString()}&to=${TO.toISOString()}&limit=${LIMIT}&desc=false&fahrenheit=false`;
    const requestOptions = {
        method: 'GET',
        headers: { "Authorization": `Bearer ${API_KEY}` },
    };

    try {
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        processSensorData(data);
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

// Process and store the fetched data
function processSensorData(data) {
    data.data.forEach(entry => {
        const { timestamp, sensors } = entry;
        const sensorValues = { timestamp };
        sensors.forEach(sensor => {
            sensorValues[sensor.comp] = sensor.value;
        });
        sensorData.push(sensorValues);
    });
    // Save the fetched data to a CSV file
    csvWriter
        .writeRecords(sensorData)
        .then(() => console.log('Data was added to the CSV file successfully.'));
}

// Serve a web page with the Plotly graph
app.get('/', (req, res) => {
    // Assuming data fetching is done and sensorData is populated
    fetchData().then(() => {
        const timestamps = sensorData.map(data => data.timestamp);
        const temperatures = sensorData.map(data => data.temp);
        // Map other sensor values as needed

        const plotlySrc = 'https://cdn.plot.ly/plotly-latest.min.js';
        const htmlContent = `
            <html>
                <head>
                    <script src="${plotlySrc}"></script>
                </head>
                <body>
                    <div id="plot"></div>
                    <script>
                        var data = [{
                            x: ${JSON.stringify(timestamps)},
                            y: ${JSON.stringify(temperatures)},
                            type: 'scatter',
                            name: 'Temperature'
                        }];
                        // Include other data series as needed
                        Plotly.newPlot('plot', data);
                    </script>
                </body>
            </html>
        `;
        res.send(htmlContent);
    });
});

app.listen(port, () => console.log(`Server listening on port ${port}! Access the plot at http://localhost:${port}`));
