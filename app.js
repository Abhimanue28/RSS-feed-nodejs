const express = require('express')
const app = express();

app.set('view engine','pug')
var mongo = require('mongodb');
var dbo = undefined;

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/database";

let Parser = require('rss-parser');
let parser = new Parser();

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
    dbo = db.db("database");
    dbo.createCollection("rss-list", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
  });
  dbo.createCollection("updates-list", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
  });
});


app.get('/',function(req,res){
    res.render('index')
})

app.get('/table/',function(req,res){
  dbo.collection("rss-list").find({}).toArray(function(err, result) {
    if (err) throw err;
    data = result;
    res.render('table',data);
  });
})

app.get('/form/', function(req,res){
    const id = {'url':req.query.link};
    dbo.collection("rss-list").insertOne(id, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
      });
    res.redirect('/table/');
    
})

app.get('/sync/',function(req,res){
  dbo.collection("rss-list").find({}).toArray(function(err, result) {
    if (err) throw err;
    dbo.collection("updates-list").remove({});
    result.forEach(element => {
        (async () => {
          let feed = await parser.parseURL(element.url);
          const id = {'url':req.query.link};
            dbo.collection("updates-list").insertOne({'channel':feed.title,
            'description':feed.items[0].title,
            'link':feed.items[0].link}, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            }); 
        })();   
    });
  }); 
  res.redirect('/updates/');
})

app.get('/updates/',function(req,res){
  dbo.collection("updates-list").find({}).toArray(function(err, result) {
    if (err) throw err;
    data = result.reverse();
    res.render('updates',data);
  });
})

app.listen(9000)