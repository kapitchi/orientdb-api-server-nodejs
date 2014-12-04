var express = require('express');
var app = express();
var Oriento = require('oriento');
var bodyParser = require('body-parser');

var config = require('./config/local.json');

var server = Oriento({
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password
});

var db = server.use({
  name: config.database,
  username: 'admin',
  password: 'admin'
});

app.use(bodyParser.json());

function sendException(res, e) {
  //TODO application/problem+json
  res.json({
    type: 'http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html',
    detail: e.message,
    status: e.code,
    title: e.name
  });
}

function sanitizeRid(rid) {
  if(rid[0] !== '#') {
    rid = '#' + rid;
  }
  
  return rid;
}

function extractRid(req) {
  if(req.params.rid) {
    return sanitizeRid(req.params.rid);
  }
  
  if(!req.body['@rid']) {
    throw "Can't extract rid";
  }
  
  return sanitizeRid(req.body['@rid']);
}

function filterDocument(doc) {
  
  delete doc._allow;
  delete doc._allowRead;
  delete doc._allowUpdate;
  delete doc._allowDelete;
  
  delete doc['@rid'];

  return doc;
}

function filterDocumentUpdate(doc) {
  return filterDocument(doc);
}

function filterDocumentCreate(doc) {
  return filterDocument(doc);
}

app.get('/document/:rid', function(req, res){

  var rid = extractRid(req);
  
  db.record.get(rid).then(function(data) {
    res.json(data);
  }).catch(function(e) {
    sendException(res, e);
  })

});

app.post('/document', function(req, res) {
  var doc = filterDocumentCreate(req.body);
  
  db.record.create(doc).then(function(data) {
    res.json(data);
  }).catch(function(e) {
    sendException(res, e);
  });
});

app.put('/document/:rid?', function(req, res){

  var rid = extractRid(req);
  
  var doc = filterDocumentUpdate(req.body);
  doc['@rid'] = rid;
  
  db.record.update(doc).then(function(data) {
    res.json(data);
  }).catch(function(e) {
    sendException(res, e);
  });

});

app.delete('/document/:rid?', function(req, res){

  var rid = extractRid(req);

  db.record.delete(rid).then(function(data) {
    res.json(data);
  }).catch(function(e) {
    sendException(res, e);
  })

});

app.get('/query/:query', function(req, res) {
  var limit = req.query.limit || -1;
  var fetchPlan = req.query.fetchPlan || '';
  
  delete req.query.limit;
  delete req.query.fetchPlan;
  
  db.query(req.params.query, {
    params: req.query,
    fetchPlan: fetchPlan,
    limit: limit
  }).then(function(data) {
    res.json(data);
  }).catch(function(e) {
    sendException(res, e);
  });
})

app.listen(config.appPort);

console.log('Server running at http://127.0.0.1:' + config.appPort + '/');