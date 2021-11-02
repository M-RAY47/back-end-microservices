// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

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


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api", (req, res) => {
  let myCurrentDate = new Date();
  console.log(myCurrentDate);
  res.json({"unix": myCurrentDate.getTime(), "utc": myCurrentDate.toString()});
})

app.get("/api/:timestamp", (req, res)=> {
  let timestamp = req.params.timestamp;
  let stamp = parseInt(timestamp);
  if(stamp > 10000) {
    let theDate = parseInt(stamp);
    let unixDate = new Date(theDate);
    res.json({unix: unixDate.getTime(), utc: unixDate.toUTCString()});
    return;
  }
  let myDate = new Date(timestamp);
  if(myDate == "Invalid Date") {
    res.json({error: "Invalid Date"});
    return;
  }else{
    res.json({unix: myDate.getTime(), utc: myDate.toUTCString()});
  }
})


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
