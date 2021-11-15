// server.js
// where your node app starts
require('dotenv').config();
//import mongoose and mongoDB
const mongoose = require('mongoose');
// connecting to the database
const bodyParser = require('body-parser');

const dns = require('dns')
const urlParser = require('url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const mongoose1 = mongoose.connect(process.env.MONGOE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
const urlSchema = new Schema({url: {type:'String', required: true}});
const Url = mongoose.model('Url', urlSchema);
// init project
var express = require('express');
var app = express();

const Schema1 = mongoose1.Schema
const PersonSchema = new Schema1({username: {type:'String', required: true, unique: true}})
const Person = mongoose1.model('Person', PersonSchema);
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/headerparser", function (req, res) {
  res.sendFile(__dirname + '/views/headerparser.html');
});

app.get("/urlshortener", function (req, res) {
  res.sendFile(__dirname + '/views/urlshortener.html');
});
// Add exercise Tracker api routers
app.get("/exercisetracker", function (req, res) {
  res.sendFile(__dirname + '/views/exercisetracker.html');
});
// your first API endpoint... 
app.get("/timestamp/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/timestamp/api", (req, res) => {
  let myCurrentDate = new Date();
  console.log(myCurrentDate);
  res.json({"unix": myCurrentDate.getTime(), "utc": myCurrentDate.toString()});
})

app.get("/timestamp/api/:timestamp", (req, res)=> {
  let timeStamp = req.params.timestamp;
  let stamp = parseInt(timeStamp);
  console.log("stampValue:", stamp, "   ", "timestampValue:", timeStamp);
  if(stamp > 10000) {
    // let theDate = parseInt(stamp);
    let unixDate = new Date(stamp);
    console.log("I am in the stamp loop!!!")
    res.json({unix: unixDate.getTime(), utc: unixDate.toUTCString()});
    return;
  }
  let myDate = new Date(timeStamp);
  if(myDate.toString() == "Invalid Date") {
    res.json({error: "Invalid Date"});
    return;
  }else{
    res.json({unix: myDate.getTime(), utc: myDate.toUTCString()});
  }
})

app.get('/headerparser/api/whoami', (req, res)=> {
  res.json({
    "ipaddress": req.ip,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
  })
})

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/urlshortener/api/shorturl", (req, res)=> {
  const bodyUrl = req.body.url;
  console.log(bodyUrl);
  const checkUrl = dns.lookup(urlParser.parse(bodyUrl).hostname, (err, address)=> {
    if(!address) {
      res.json({error: "Invalid URL"});
      return;
    }else{
      const url = new Url({url: bodyUrl});
      url.save((err, data)=> {
        res.json({
          original_url : data.url, short_url : data.id
        })
      })
    }
  })
  console.log("Url checking:",checkUrl);
})

app.get("/urlshortener/api/shorturl/:id", (req, res)=> {
  const id= req.params.id;
  Url.findById(id, (err, data)=> {
    if(!data){
      res.json({error: "Invalid URL"});
    } else {
      res.redirect(data.url);
    }
  })
})

// add exercice tracker apis
app.post('/exercisetracker/api/users', (req, res) => {
  res.json({
    username: "fcc_test",
    _id: "5fb5853f734231456ccb3b05"
  })
})

app.get('/exercisetracker/api/users', (req, res) => {
  res.json({
    _id: "549562",
    "username": "fcc_test...",
    "__v": 0
  })
})

let port = process.env.PORT || 3000;
// listen for requests :)
var listener = app.listen(port, ()=> {
  console.log('Your app is listening on port ' + listener.address().port);
});
