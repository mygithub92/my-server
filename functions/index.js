const express = require('express')
const path = require('path')
const port = process.env.PORT || 3000
const app = express()
const rp = require('request-promise');
const request = require('request');
const fs = require('fs');
const download = require('image-downloader');
const admin = require('firebase-admin');
const firebase = require('firebase');
var schedule = require('node-schedule');


// Imports the Google Cloud client library
const Storage = require('@google-cloud/storage');
// Creates a client
const storage = new Storage();
//export GOOGLE_APPLICATION_CREDENTIALS="/Users/David/react/my-app/myapp-45947-firebase-adminsdk-eh7wx-ed0e85c773.json"
/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const bucketName = 'gs://myapp-45947-icons';
const filename = '/Users/David/react/my-app/public/icons/d7711420-de59-4c1f-b4da-e4eb4846d56f.png';

const serviceAccount = require("/Users/David/Downloads/myapp-45947-firebase-adminsdk-eh7wx-78a7f24e2a.json");
var config = {
    apiKey: "AIzaSyDJrPj303CpQXP88XyNUJqjK_YDNHKbaZ4",
    authDomain: "myapp-45947.firebaseapp.com",
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://myapp-45947.firebaseio.com",
    projectId: "myapp-45947",
    storageBucket: "myapp-45947.appspot.com",
    messagingSenderId: "346617754136"
  };
firebase.initializeApp(config);
const database = firebase.database();

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
// serve static assets normally
app.use(express.static(__dirname + '/public'))



let experied = false;
let _timestamp;
let cachedMarketSummary = [];
let cachedMarketDetails = {};

let favouriteMarkets = [];

app.post('/api/market/favourite', (req, res) => {
    let market = req.body.market;
    let favourite = req.body.favourite;
    if (favourite) {
        favouriteMarkets.push(market);
    } else {
        let index = favouriteMarkets.findIndex((element) => element.MarketName === market.MarketName);
        if (index > -1) {
            favouriteMarkets.splice(index, 1);
        }
    }
});

app.get('/api/favourites', (req, res) => {
    res.status(200).send(favouriteMarkets);
});

app.get('/api/markets', (req, res) => {
    const ref = database.ref('markets');
    ref.once("value")
        .then((snapshot) => {
            const result = snapshot.val();
            let markets = [];
            Object.keys(result).forEach(name => markets.push(result[name]));
            console.log(markets);
            res.status(200).send(markets);
        }).catch(e => console.log(e))
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
            res.status(200).send(cachedMarketDetails[marketName]);
        }).catch(e => console.log(e));
    } else {
        console.log('Using cached data for /api/market');
        res.status(200).send(cachedMarketDetails[marketName]);
    }
});

// app.get('/api/icons', (req, res) => {
//     rp('https://bittrex.com/api/v1.1/public/getmarkets')
//         .then(res => {
//             const result = JSON.parse(res);
//             return result.result;
//         }).then(data => {
//             data.forEach(element => {
//                 console.log(element.LogoUrl);
//                 if(element.LogoUrl) {
//                     download.image({
//                         url: element.LogoUrl,
//                         dest: __dirname + '/public/icons/'
//                     }).then(({filename, image}) => {
//                         console.log('File saved to', filename);
//                     }).catch(err => console.log(err))
//                 }
//             })
//         });
// });

// app.get('/api/upload/icons', (req, res) => {
   
//     const path = __dirname + '/public/icons/'
//     fs.readdir(path, (err, files) => {
//         files.forEach(file => {
//             storage
//             .bucket(bucketName)
//             .upload(path + file)
//             .then(() => {
//               console.log(`${filename} uploaded to ${bucketName}.`);
//             })
//             .catch(err => {
//               console.error('ERROR:', err);
//             });
//             // console.log(path + file)
//         });
//     })
// });



app.get('/', (req, res) => {
    res.status(200).send(page());
});

app.listen(port)
console.log("server started on port " + port);

function weeklyUpdate() {
    schedule.scheduleJob({hour: 22, minute: 54, dayOfWeek: 5}, function () {
        firebase.auth().signInWithEmailAndPassword('linlwangster@gmail.com', '12345678').catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
          });

          //var userId = firebase.auth().currentUser.uid;
          firebase.auth().onAuthStateChanged((user) => {
              if(user) {
                  console.log(user.uid);
                  rp('https://bittrex.com/api/v1.1/public/getmarkets')
                    .then(res => {
                        const result = JSON.parse(res);
                        return result.result;
                    }).then(data => {
                        data.forEach((market) => {
                            if(market.LogoUrl) {
                                const index = market.LogoUrl.lastIndexOf('/');
                                localIconUrl = '/icons' + market.LogoUrl.substring(index);
                                console.log(localIconUrl);
                                market.LogoUrl = localIconUrl;
                            }
                            database.ref('markets/' + market.MarketName).set(market);
                        })
                    }).catch(e => console.log(e));
                //   database.ref('markets/' + 'LTC').set({"MarketCurrency":"LTC","BaseCurrency":"BTC","MarketCurrencyLong":"Litecoin","BaseCurrencyLong":"Bitcoin","MinTradeSize":0.01378854,"MarketName":"BTC-LTC","IsActive":true,"Created":"2014-02-13T00:00:00","Notice":null,"IsSponsored":null,"LogoUrl":"https://bittrexblobstorage.blob.core.windows.net/public/6defbc41-582d-47a6-bb2e-d0fa88663524.png"});
              }
          })
          console.log('Weekly resyn started...');
      });

}

weeklyUpdate();