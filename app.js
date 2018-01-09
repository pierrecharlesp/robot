var http = require('http');
var fs = require('fs');
var xpath = require('xpath')
  , dom = require('xmldom').DOMParser
var express      = require('express');
var path = require('path');
const PORT = process.env.PORT || 5000;

var app = express();
var server = require('http').Server(app);


var botsFile = fs.readFileSync('./bot.xml', {encoding: 'utf-8'});
var bots = new dom().parseFromString(botsFile);

var listBots = xpath.evaluate(
    "/bots/bot",            // xpathExpression
    bots,                        // contextNode
    null,                       // namespaceResolver
    xpath.XPathResult.ANY_TYPE, // resultType
    null                        // result
);

var node = null;
var botsRead= [];
node = listBots.iterateNext();
while (node) {
    //console.log(node.localName + ": " + node.firstChild);
    var tmp_display = xpath.select1( "@display", node).value;
    var tmp_code = xpath.select1( "@code", node).value;
    botsRead.push({display: tmp_display, code: tmp_code});
    //console.log("Node: " + node.toString());
    node = listBots.iterateNext();
}

app.use(express.static(path.join(__dirname, 'public')));

// Loading socket.io
var io = require('socket.io').listen(server);
// When a client connects, we note it in the console
io.sockets.on('connection', function (socket) {
	
    socket.emit('botMessage','Bonjour, sur quelle application souhaitez-vous que je vous aide ?');  
	socket.emit('initialchoices',botsRead );

    socket.on('initialchoice', function (appli) {
		
		//on renvoie à l'expéditeur son message pour qu'il l'affiche
		socket.emit('humanMessage',appli.display );
		// on envoie le texte associé au choix
        var botmessage = xpath.select1("string(/bots/bot[@code='"+ appli.appli +"']/text)", bots);
        socket.emit('botMessage',botmessage);
		
		//on renvoie les choix suivants
		var listChoices = xpath.evaluate(
			"/bots/bot[@code='"+ appli.appli +"']/choices/choice",            // xpathExpression
			bots,                        // contextNode
			null,                       // namespaceResolver
			xpath.XPathResult.ANY_TYPE, // resultType
			null                        // result
		);
		var nodechoices = null;
		var choicesRead= [];
		nodechoices = listChoices.iterateNext();
		while (nodechoices) {
			var tmp_display = xpath.select1( "@text", nodechoices).value;
			var tmp_code = xpath.select1( "@id", nodechoices).value;
			choicesRead.push({display: tmp_display, id: tmp_code});
			nodechoices = listChoices.iterateNext();
		}
		socket.emit('choices',choicesRead );
    });
	
	
	 socket.on('choice', function (appli) {
		//on renvoie à l'expéditeur son message pour qu'il l'affiche
		socket.emit('humanMessage',appli.display );
		// on envoie le texte associé au choix
        var botmessage = xpath.select1("string(//choices/choice[@id='"+ appli.id +"']/text)", bots);
        socket.emit('botMessage',botmessage);
		
		
		//on renvoie les choix suivants
		var listChoices = xpath.evaluate(
			"//choices/choice[@id='"+ appli.id +"']/choices/choice",            // xpathExpression
			bots,                        // contextNode
			null,                       // namespaceResolver
			xpath.XPathResult.ANY_TYPE, // resultType
			null                        // result
		);
		var nodechoices = null;
		var choicesRead= [];
		nodechoices = listChoices.iterateNext();
		while (nodechoices) {
			var tmp_display = xpath.select1( "@text", nodechoices).value;
			var tmp_code = xpath.select1( "@id", nodechoices).value;
			choicesRead.push({display: tmp_display, id: tmp_code});
			nodechoices = listChoices.iterateNext();
		}
		if ( choicesRead.length > 0)
		{
			socket.emit('choices',choicesRead );
		}
		else{
			socket.emit('replay' );
		}
    });
 
 
 
 
});

server.listen(PORT);
