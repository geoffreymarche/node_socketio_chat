var app = require('express')(), // utilisation app express
    server = require('http').createServer(app), // creation du server http
    io = require('socket.io').listen(server), // socket.io
    bodyParser = require('body-parser'), // parser les req http
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');
app.use( bodyParser.json() );       // encoder en json les body de req http
app.use(bodyParser.urlencoded({     // encoder en json les param d'url de req http
  extended: true
}));
var channel = '';
// Chargement de la page index.html
app.get('/:channel', function (req, res) {
  channel = ent.encode(req.params.channel);
  res.sendfile(__dirname + '/client.html');
});
io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
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

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        message = ent.encode(message);
        io.sockets.to(socket.room).emit('message', {pseudo: socket.pseudo, message: message});
    });

});

server.listen(8080);
