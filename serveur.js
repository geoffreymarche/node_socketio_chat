var express = require('express'),
    app = express(), // utilisation app express
    server = require('http').createServer(app), // creation du server http
    io = require('socket.io').listen(server), // socket.io
    bodyParser = require('body-parser'), // parser les req http
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');
    //fs = require("chai").assert;
app.use( bodyParser.json() );       // encoder en json les body de req http
app.use(bodyParser.urlencoded({     // encoder en json les param d'url de req http
  extended: true
}));
var channel = '';
var username = '';
app.use(express.static(__dirname + '/views'));
// Chargement de la page client.html
app.get('/:channel/:username', function (req, res) {
  channel = ent.encode(req.params.channel);
  username = ent.encode(req.params.username);
  res.sendfile(__dirname + '/client.html');
});
app.get('/api/log/:file',function(req,res) {
  var file = ent.encode(req.params.file);
  if(fs.existsSync("assets/log/"+file+".json")) {
    fs.readFile("assets/log/"+file+".json", function (err, results) {
        var json = JSON.parse(results);
        var retour = {reponse:true,data:json};
        res.send(retour);
    })
  }else{
    var retour = {reponse:false};
    res.send(retour);
  }
})
io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    /*
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        // creation du pseudo
        socket.pseudo = pseudo;
        //creation du cannal
        socket.room = channel;
        // rejoindre le cannal
        socket.join(channel);
        socket.broadcast.to(channel).emit('nouveau_client', pseudo);
    });
    */
    // action au log :
    // creation du pseudo
    socket.pseudo = username;
    //creation du cannal
    socket.room = channel;
    // rejoindre le cannal
    socket.join(channel);
    socket.broadcast.to(channel).emit('nouveau_client', socket.pseudo);
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        message = ent.encode(message);
        var data = {pseudo: socket.pseudo, message: message};
        // creation des logs
        if (fs.existsSync("assets/log/"+socket.room+".json")) {
          // si fichier log existe deja :
          fs.readFile("assets/log/"+socket.room+".json", function (err, results) {
              var json = JSON.parse(results);
              json.message.push(data);
              fs.writeFile("assets/log/"+socket.room+".json", JSON.stringify(json));
          })
        }else {
          // action si non
          var insert = {
            message:[data],
          }
          fs.writeFile("./"+socket.room+".json", JSON.stringify(insert, null, 4));
        }
        // envoi du message
        io.sockets.to(socket.room).emit('message', data);
    });

});

server.listen(8080);
