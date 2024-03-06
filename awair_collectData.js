const express = require('express');
const fs = require('fs');
const path = require('path');
const plotly = require('plotly.js-basic-dist');

const app = express();
const port = 3000;

app.get('/plot', (req, res) => {
    // Assuming csvRows is available globally and contains your CSV data
    // For the sake of example, let's convert it to JSON; you'd replace this with actual logic
    // to read from your CSV data structure
    let jsonData = csvRows.map(row => {
        const columns = row.split(',');
        return {
            timestamp: columns[1],
            temperature: columns[5] // Assuming temperature is in the 6th column
        };
    });

    // Filter out the header row if present
    jsonData = jsonData.filter((item, index) => index > 0);

    const data = [{
        x: jsonData.map(item => item.timestamp),
        y: jsonData.map(item => item.temperature),
        type: 'scatter'
    }];

    const graphOptions = {filename: 'date-axes', fileopt: 'overwrite'};
    // This is where you'd typically use Plotly to generate a plot image or URL.
    // However, Plotly's Node library mainly works with their cloud service for generating plots,
    // so we'll adjust our approach below.

    // Serve an HTML page with embedded Plotly graph
    res.send(`
        <html>
            <head>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
                <div id="plot"></div>
                <script>
                    var data = ${JSON.stringify(data)};
                    
                    Plotly.newPlot('plot', data);
                </script>
            </body>
        </html>
    `);
});

app.listen(port, () => console.log(`Server listening at http://localhost:${port}/plot`));
