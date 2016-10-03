var https = require('https');
var websocket = require('nodejs-websocket');
var fs = require('fs');

var options = {
  ca: fs.readFileSync('certificates/server_csr.pem'),
  key: fs.readFileSync('certificates/server_key.pem'),
  cert: fs.readFileSync('certificates/server_crt.pem'),
};

var alexaResponse = {
  "version" : "0.1",
  "sessionAttributes": {},
  "response": {
    "outputSpeech": {
      "type": "PlainText",
    },
    "card": {
      "type": "Simple",
      "title": "Bastet",
      "content": "Bastet will grant your wish."
    },
    "reprompt": {
      "outputSpeech": {
        "type": "PlainText",
        "text": "Bastet Cannot.",
      }
    },
  "shouldEndSession": true
};

var moodMap = {
  "sex",
  "light",
  "rain",
  "random",
  "happy",
  "sad",
  "angry",
  "win",
  "pumped",
  "bored",
  "pretty",
  "cold",
  "hot",
  "wet",
  "dry",
  "windy",
  "calm",
  "crazy",
  "dark",
  "devious",
  "musical",
  "lazy",
  "sleepy",
  "frustrated",
  "excited",
  "groovy",
  "love",
  "fun"
};

var currentMood = "light";

function intentMoodHandler(mood) {
  sendMoodInfo(mood);
  return true;
};

function changeAlexaResponse(currentResponse,newPhrase) {
  currentResponse.response.outputSpeech.text = newPhrase;
  return currentResponse;
};

function handleResponse(req,res) {
  var result;
  if (req.method == "POST") {
    body = "";
    req.on('data', function (chunk) {
      body += chunk.toString();
    });

    req.on('end', function () {
      var jsonObj = JSON.parse(body);
      if (jsonObj.request.type == "IntentRequest") {
        var setMood = intentMoodHandler(json.request.intent.slots.mood.value);
        if (setMood) {
          changeAlexaResponse(alexaResponse, "Bastet has updated the mood to " + jsonObj.request.intent.slots.mood.value);
        } else {
          changeAlexaResponse(alexaResponse, "Bastet has not granted your request.");
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify(alexaResponse));
    });
  }
};

var server = https.createServer(options, handleResponse).listen(443);

var sendMoodInfo(mood) {
  currentMood = "light";
};

var socket_server = websocket.createServer(function (conn) {
  conn.on("text", function (str) {
    switch(str) {
      case "getMood":
        conn.sendText(currentMood);
        break;
      case "setMood":
        currentMood = str;
        break;
     default:
        break;
  });
}).listen(8001);

      
