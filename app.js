/**
 * Module dependencies.
 */

var cluster = require('cluster');
var express = require('express'),
  user = require('./routes/user'),
  http = require('http'),
  path = require('path');


// Code to run if we're in the master process
if (cluster.isMaster) {

  console.log('is master')
  // Count the machine's CPUs
  var cpuCount = require('os').cpus().length;

  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
    console.log(i,cpuCount)
  }
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
    cluster.fork();
});
  // Code to run if we're in a worker process
} else {
  //var session = require('express-session');
  var app = express();
  var flash = require('connect-flash');
  var bodyParser = require("body-parser");

  // all environments
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(bodyParser.json({
    type: 'application/*+json'
  }));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(flash());

  app.use(express.static(path.join(__dirname, 'public')));

  // app.get('/', user.index);//call for main index page
  app.get('/', user.action);
  app.post('/', user.action);

  app.listen(8080)
}