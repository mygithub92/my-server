const functions = require('firebase-functions');
// const cors = require('cors')({origin: true});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const express = require('express')
const path = require('path')
const port = process.env.PORT || 3000
const app = express()
const rp = require('request-promise');
// serve static assets normally
app.use(express.static(__dirname + '/public'))

let experied = false;
let _timestamp;
let cachedMarketSummary = [];
let cachedMarketDetails = {};

app.get('/api/markets', (req, res) => {
    const now = new Date();
    if (!_timestamp || now.getMilliseconds() - _timestamp.getMilliseconds() > 600000) {
        _timestamp = now;
        experied = true;
        rp('https://bittrex.com/api/v1.1/public/getmarkets')
        .then(res => {
            const result = JSON.parse(res);
            return result.result;
        }).then(data => {
            cachedMarketSummary = data.filter(element => element.IsActive);
            res.status(200).send(cachedMarketSummary);
            return null;
        }).catch(error => console.log(error));
    } else {
        console.log('Using cached data for /api/markets');
        experied = false;
        res.status(200).send(cachedMarketSummary);
    }
});

app.get('/api/market', (req, res) => {
    const marketName = req.query.name;
    const now = new Date();
    if (!cachedMarketDetails[marketName] || experied) {
        rp(`https://bittrex.com/api/v1.1/public/getmarketsummary?market=${marketName}`)
        .then(res => {
            const result = JSON.parse(res);
            return result.result[0];
        }).then(data => {
            if (!cachedMarketDetails[marketName]) {
                cachedMarketDetails[marketName] = {};
                const found = cachedMarketSummary.find((element) => element.MarketName === marketName);
                if (found) {
                    cachedMarketDetails[marketName].LogoUrl = found.LogoUrl;
                }
            }
            // cachedMarketDetails[marketName] = {...cachedMarketDetails[marketName], ...data};
            cachedMarketDetails[marketName] = data;
            res.status(200).send(cachedMarketDetails[marketName]);
            return null;
        })
        .catch(error => console.log(error));
    } else {
        console.log('Using cached data for /api/market');
        res.status(200).send(cachedMarketDetails[marketName]);
    }
});

exports.widgets = functions.https.onRequest(app);