/*
Purpose:
    If you're okay with exporting data at 5-minute intervals, it's easier to use the 
    Awair Dashboard > Export Data feature. Select your time interval and download a
    .zip file with a CSV.    

    However, if you want data at 10-second intervals, you'll need to use this file.
    The Awair Omni API's getRaw() method only allows you to access 1 hour of data 
    at a time. This file allows you to access data at 10-sec intervals for any length of 
    time as a CSV.

Usage: 
    * Set your Device ID, API Key, and Organization ID using your unique Awair credentials.
    * Set the variables FROM and TO to indicate the time interval you want to collect data.
    * Set the variable LIMIT to indicate the number of time intervals you want to collect
      in 1 hour. The maximum value is 360.
        * LIMIT = 360 : 10-second intervals 
        * LIMIT = 120 : 30-second intervals
    * Set your device ID, API Key, and organization ID.
    * In your CSV file, 360 lines corresponds to 1 hour. 

Notes:
    * The CSV file will be saved with timestamps in Arizona time.
    * The 'timestamp' value in the CSV file will be in UTC/GMT time.
    * The Awair server stops returning data if you make too many fetch requests in 1 
      minute. Therefore, this file waits 1 minute after collecting 10 hours' worth of data.
*/


const FROM = new Date('19 February 2024 14:00');
const TO =  new Date('19 February 2024 15:00');
const LIMIT = 120; 

const DEVICE_ID = "28563";
const API_KEY = "UfwaYhhnQJDJ1GoX37GHDy6CmPstQGyl";
const ORG_ID = "10994";

const https = require('follow-redirects').https;
const fs = require('fs');
csvRows = [];
var indexFromTen = 1;


/*
    Converts JSON data into a 2D array and adds the <= 1 hour of data to csvRows.
*/
function parseData(data) {
    let json = JSON.parse(data);
    let lux=0; let voc=0; let temp=0; let co2=0; let humid=0; let spl_a=0; let pm10_est=0; let pm25=0; // sensors data
    let i_temp = 0; let i_co2 = 0; let i_humid = 0; let i_voc = 0; let i_pm10_est = 0; let i_pm25 = 0; // indices data
    let curRow = [DEVICE_ID];
    if (json["code"] && json["code"] == 8) {
        throw new Error('Awair API responded that there were "Too many requests during the past 1 minute". Shorten your time interval, wait a minute, and try again.');
    }

    for (let i = 1; i < json["data"].length; i++) {
        let cur = json["data"][i];
        curRow.push(cur.timestamp);
        curRow.push(cur.score);
        for (let j = 0; j < 9; j++) { // There are 9 sensor outputs
            let comp = cur.sensors[j].comp;
            if (comp == "lux") {
                lux = cur.sensors[j].value;
            } else if (comp == "voc") {
                voc = cur.sensors[j].value;
            } else if (comp == "temp") {
                temp = cur.sensors[j].value;
            } else if (comp == "co2") {
                co2 = cur.sensors[j].value;
            } else if (comp == "humid") {
                humid = cur.sensors[j].value;
            } else if (comp == "spl_a") {
                spl_a = cur.sensors[j].value;
            } else if (comp == "pm10_est") {
                pm10_est = cur.sensors[j].value;
            } else if (comp == "pm25") {
                pm25 = cur.sensors[j].value;
            } 
        }
        curRow.push(lux); curRow.push(voc);
        curRow.push(temp); curRow.push(co2);
        curRow.push(humid); curRow.push(spl_a);
        curRow.push(pm10_est); curRow.push(pm25);
        csvRows.push(curRow);

        for (let j = 0; j < 6; j++) {
            let comp = cur.indices[j].comp; 
            if (comp == "temp") {
                i_temp = cur.indices[j].value;
            } else if (comp == "co2") {
                i_co2 = cur.indices[j].value;
            } else if (comp == "humid") {
                i_humid = cur.indices[j].value;
            } else if (comp == "voc") {
                i_spl_a = cur.indices[j].value;
            } else if (comp == "pm10_est") {
                i_pm10_est = cur.indices[j].value;
            } else if (comp == "pm25") {
                i_pm25 = cur.indices[j].value;
            } 
        }
        curRow.push(i_temp); curRow.push(i_co2);
        curRow.push(i_humid); curRow.push(i_voc);
        curRow.push(i_pm10_est); curRow.push(i_pm25);

        curRow = [DEVICE_ID];
    }
}

/*
    Creates the header for the CSV. 
*/
function csvHeadermaker() {
    const headers = ['deviceID', 'timestamp', 'score', 'lux', 'voc', 'temp', 'co2', 'humid', 
                        'spl_a', 'pm10_est', 'pm25', 'indices.temp', 'indices.co2', 'indices.humid', 
                        'indices.voc', 'indices.pm10_est', 'indices.pm25'];
    csvRows.push(headers.join(','));
}

/*
    After all data is fetched and parsed, this creates a CSV with the given name.
*/
function makeCSV(name) {
    var csvData = csvRows.join('\n');
    var fileName = name + ".csv";
    fs.writeFileSync(fileName, csvData, 'utf-8');
    console.log('Successfully created file: ' + fileName);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
    Fetches <= 1 hour of data.
*/
function getRaw(start, end, final) {
    var myHeaders = new Headers();
    myHeaders.append("x-api-key", API_KEY);
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };
    fetch('https://developer-apis.awair.is/v1/orgs/' + ORG_ID + '/devices/awair-omni/' + DEVICE_ID + '/air-data/raw?from=' + start.toISOString() + '&to=' + end.toISOString() + '&limit=' + LIMIT + '&desc=false&fahrenheit=false', requestOptions)
    .then(response => response.text())
    .then(result => {
        parseData(result);
    })
    .then(async () => {
        if (final) {
            var curDate = new Date(Date.now());
            var fromStr = (start.getUTCMonth() + 1) + "_" + (start.getUTCDate()) + "_" + start.getUTCFullYear() + 
                            "_" + (start.getUTCHours()-7) + "_" + start.getUTCMinutes();
            var toStr = (end.getUTCMonth() + 1) + "_" + (end.getUTCDate()) + "_" + end.getUTCFullYear() + "_" + 
                            (end.getUTCHours()-7) + "_" + end.getUTCMinutes();
            var curStr = (curDate.getUTCMonth() + 1) + "_" + (curDate.getUTCDate()) + "_" + curDate.getUTCFullYear() + 
                            "_" + (curDate.getUTCHours()-7) + "_" + curDate.getUTCMinutes();
            var fileName = fromStr + "___to___" + toStr + "___on___" + curStr;
            makeCSV(fileName);
        } else {
            if (indexFromTen >= 10) {
                indexFromTen = 1;
                console.log("Waiting 1 minute so we don't overwhelm the Awair server...");
                await sleep(60000);
                getNextData();
            } else {
                indexFromTen++;
                getNextData();
            } 
        }
        
    })
    .catch(error => console.log('error', error));
    
}


// Determine the number of hours in the time interval:
var minutes = Math.ceil((Math.abs(TO - FROM)/1000)/60);
var numHours = Math.ceil(minutes/60);
csvHeadermaker();

/*
    Fetches and saves data between times FROM and TO as a CSV.
*/
var startTime = FROM;
var endTime = new Date(startTime.getTime() + 60*60000); // 1 hour after start time
var iteration = 0
var final = false; // Indicates whether this is the last time getNextData() will be called
function getNextData() {
    if (iteration < numHours-1){
        getRaw(startTime, endTime, final);
        console.log('Iteration ' + iteration + ' completed. Start: ' + startTime + ' End: ' + endTime);
        startTime = endTime;
        endTime = new Date(startTime.getTime() + 60*60000);
        iteration = iteration + 1;
    }
    else {
        console.log('Iteration ' + iteration + ' completed. Start: ' + startTime + ' End: ' + endTime);
        final = true
        getRaw(startTime, TO, final);
    }
}
getNextData()


