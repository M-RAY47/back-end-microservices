// server.js
// where node app starts
require('dotenv').config();
//import mongoose and mongoDB
const mongoose = require('mongoose');
// connecting to the database
const bodyParser = require('body-parser');

const dns = require('dns')
const urlParser = require('url');
//import mutlter
const multer = require('multer');
const upload = multer({ dest: 'uploads/'});

mongoose.connect(process.env.MONGOE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
const urlSchema = new Schema({url: {type:'String', required: true}});
const Url = mongoose.model('Url', urlSchema);
// init project
var express = require('express');
var app = express();
 // Create new Schema Person and exercises
const PersonSchema = new Schema(
  {
    username: {type:'String', required: true, unique: true},
    exercises: [
      {
        description: {type:'String'},
        duration: {type:'Number'},
        date: {type: 'String'}
      }
    ]
  }
);
const Person = mongoose.model('Person', PersonSchema);

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
// Add filemetada api router
app.get("/filemetada", function (req, res) {
  res.sendFile(__dirname + '/views/filemetada.html');
});
// your first API endpoint... 
app.get("/timestamp/api/hello", function (req, res) {
  res.json({greeting: 'hello timestamp API'});
});
// /timestamp/api/ response
app.get("/timestamp/api", (req, res) => {
  let myCurrentDate = new Date();
  console.log(myCurrentDate);
  res.json({"unix": myCurrentDate.getTime(), "utc": myCurrentDate.toString()});
})
// /timestamp/api/:timestamp response
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
// /headerparser/api/whoami response
app.get('/headerparser/api/whoami', (req, res)=> {
  res.json({
    "ipaddress": req.ip,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
  })
})

app.use(bodyParser.urlencoded({ extended: false }));
// /headerparser/api/shorturl response
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
// /urlshortener redirection response
app.get("/urlshortener/api/shorturl/:id", (req, res)=> {
  const id= req.params.id;
  Url.findById(id, (err, data)=> {
    if(err){
      res.json({error: "Invalid URL"});
    } else {
      res.redirect(data.url);
    }
  })
})

// add exercice tracker apis
app.post('/exercisetracker/api/users', (req, res) => {
  const newPerson = new Person({username: req.body.username});
  Person.findOne({username: req.body.username},(err, data)=> {
    if(data == null || undefined) {
      newPerson.save((err,data) => {
        if(err) return console.error(err);
        res.json({"username": data.username, "_id": data.id});
      });
      return console.error(err);
    }
    res.json({"username": data.username, "_id": data.id})
  })
});

const defaultDate = ()=> new Date().toDateString();

app.post('/exercisetracker/api/users/:userId/exercises', (req, res)=> {
  const userId = req.params.userId;
  let date = new Date(req.body.date).toDateString();
  if(date == "Invalid Date"){
    date = defaultDate();
    // console.log("New Date: ", date);
  }
  // console.log("Date: ", date);
  const myExercises = {
    description: req.body.description,
    duration : parseInt(req.body.duration),
    date: date || defaultDate()
  };
  Person.findByIdAndUpdate(
    userId, 
    {$push: {exercises: myExercises}},
    {new: true}, (err, updatePerson)=> {
      if(err) {
        return res.send(`Cast to ObjectId failed for value ${userId} at path "_id" for model "Users"`);
      }
      let returnPersonExr = {
        _id: updatePerson.id,
        username: updatePerson.username,
        date: myExercises.date,
        duration: myExercises.duration,
        description: myExercises.description
      };
      res.json(returnPersonExr);
    }
    )
})
//Api to return all the users
app.get('/exercisetracker/api/users', (req, res) => {
  Person.find({},
    {_id: 1, "username": 1},
    (err, person) => {
    if(err) return console.log(err);
    res.send(person);
  })
})

// /api/user exerises numbers
app.get("/exercisetracker/api/users/:userId/logs", (req, res) => {
  const userId = req.params.userId;
  let {from, to, limit}= req.query;
  limit = +limit;
  Person.findById(
    userId, (err, person) => {
      if(err) return res.send("User has no exercises!!!");
        let exercise = person.exercises;
        let personInfo = {
        _id: person.id,
        username: person.username,
        count: exercise.length,
        log: exercise
      }
      if(from){
        const fromDate = new Date(from);
        personInfo.log = exercise.filter(ex => new Date(ex.date)>=fromDate);
        personInfo.count = personInfo.log.length;
      }
      if(to){
        const toDate = new Date(to);
        personInfo.log= exercise.filter(ex => new Date(ex.date)<= toDate);
        personInfo.count = personInfo.log.length;
      }
      if(limit){
        personInfo.log = exercise.slice(0, limit);
        personInfo.count = personInfo.log.length;
      }
      res.send(personInfo);
    }
  )
});

// api for file analysis
app.post("/filemetada/api/fileanalyse",upload.single('upfile'), (req, res)=> {
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  const fileType = req.file.mimetype;
  res.json({
    "name": fileName,
    "type": fileType,
    "size": fileSize
  });
})
let port = process.env.PORT || 3000;
// listen for requests :)
var listener = app.listen(port, ()=> {
  console.log('Your app is listening on port ' + listener.address().port);
});
