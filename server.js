// server.js
// where your node app starts
require('dotenv').config();
//import mongoose and mongoDB
const mongoose = require('mongoose');
// connecting to the database
const bodyParser = require('body-parser');

const dns = require('dns')
const urlParser = require('url');

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
  const date = new Date(req.body.date).toDateString();
  console.log(date);
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
  // const userId = req.params.userId;
  const {userId, from, to, limit}= req.query;
  Person.findById(
    userId, (err, person) => {
      if(err) {return console.log(err);}
      else if(from && to) {
        Person.find({userId}, {date: {$gte: new Date(from), $lte: new Date(to)}}).select(["_id", "description", "duration", "date"]).limit(+limit).exec((err, data)=> {
          let customeData = data.map(exer =>{
            let dateFormatted= new Date(exer.date).toDateString();
            return {id: exer.id, description: exer.description, duration: exer.duration, date: exer.dateFormatted
            }
         })
        })
        let exercise = person.exercises;
        let personInfo = {
        _id: person.id,
        username: person.username,
        count: person.exercises.length,
        log: exercise
      }
      res.send(personInfo);
    }
  )
})

let port = process.env.PORT || 3000;
// listen for requests :)
var listener = app.listen(port, ()=> {
  console.log('Your app is listening on port ' + listener.address().port);
});
