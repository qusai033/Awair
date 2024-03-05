const express = require('express');
const app = express();
const port = 3000;

// Assuming sensorData is an array where you push your sensor readings
let sensorData = [];

// Your existing code to fetch and store sensor data into sensorData

// Serve a web page with the Plotly graph
app.get('/', (req, res) => {
    // Generate HTML content with embedded Plotly graph
    const plotlySrc = 'https://cdn.plot.ly/plotly-latest.min.js';
    let timestamps = sensorData.map(data => data.timestamp);
    let temperatures = sensorData.map(data => data.temp);
    // Map other sensor values...

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

app.listen(port, () => console.log(`Server listening on port ${port}! Access the plot at http://localhost:${port}`));
