var https = require('https');
var websocket = require('nodejs-websocket');
var fs = require('fs');

var options = {
  key: fs.readFileSync('certificates/private-key.pem'),
  cert: fs.readFileSync('certificates/cert.pem'),
  rejectUnauthorized: false,
  requestCert: false,
  agent: false,
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
    "shouldEndSession": true,
  }
  
};

var moodMap = [
  "sexy",
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
  "fun",
];

var brightnessLevelMap = [
 "off",
 "dark",
 "dim",
 "normal",
 "on",
 "light",
 "bright",
 "maximum",
];

var brightnessChangeMapDown = [
  "down",
  "dim",
  "dimmer",
  "darker",
  "lower",
];
var brightnessChangeMapUp = [
  "up",
  "lighter",
  "brighter",
  "higher",
];


var clientStatus = { 
  "brightness" : "light",
  "mood" : "light",
};


function intentMoodHandler(mood) {
  if (moodMap.includes(mood)) {
    console.log("Setting mood to " + mood);
    sendMoodInfo(mood);
    return true;
  } else {
    console.log("Could not set mood " + mood);
    return false;
  }
};

function intentBrightnessLevelHandler(brightness) {
  if (brightnessLevelMap.includes(brightness)) {
    console.log("Setting brightness to " + brightness);
    sendBrightnessInfo(brightness);
    return true;
  } else {
    console.log("Could not set brightness " + brightness);
    return false;  
  }
};

function intentBrightnessChangeHandler(change) {
   var index = brightnessLevelMap.findIndex(function(elem, index, arr) { return elem === clientStatus["brightness"] });
   if (brightnessChangeMapDown.includes(change)) {
     index -= 1;
  } else if (brightnessChangeMapUp.includes(change)) {
    index += 1;
  }
  if (index >= 0 && index < brightnessLevelMap.length) {
    clientStatus["brightness"] = brightnessLevelMap[index];
    sendBrightnessInfo(clientStatus["brightness"]);
    return true;
  }
  return false;
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
        console.log("Got IntentRequest");
        switch(jsonObj.request.intent.name) {
        case "SetMood":
          var setMood = intentMoodHandler(jsonObj.request.intent.slots.mood.value);
          if (setMood) {
            changeAlexaResponse(alexaResponse, "Bastet has updated the mood to " + jsonObj.request.intent.slots.mood.value);
          } else {
            changeAlexaResponse(alexaResponse, "Bastet has not granted your request.");
          }
          break;
        case "Lights":
          
          if (intentBrightnessLevelHandler(jsonObj.request.intent.slots.brightness.value)) {
            changeAlexaResponse(alexaResponse, "Bastet has updated the lights");
          } else if (intentBrightnessChangeHandler(jsonObj.request.intent.slots.change.value)) {
            changeAlexaResponse(alexaResponse, "Bastet has updated the lights");
          } else {
            changeAlexaResponse(alexaResponse, "Bastet could not update the lights");
          }
          break;
        default:
          break;
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify(alexaResponse));
    });
  }
};

var server = https.createServer(options, handleResponse).listen(443);

function sendMoodInfo(mood) {
  clientStatus["mood"] = mood;
};

function sendBrightnessInfo(brightness) {
  clientStatus["brightness"] = brightness;
};

var socket_server = websocket.createServer(function (conn) {
  conn.on("error", (err) => console.log("Caught Error\n" + err.stack));
  conn.on("text", function (str) {
    console.log("Client Request: " + str );
    var jsonObj = JSON.parse(str);
    switch(jsonObj.type) {
      case "get":
        conn.sendText(JSON.stringify(clientStatus));
        break;
      case "set":
        clientStatus["mood"] = jsonObj.mood;
        clientStatus["brightness"] = jsonObj.brightness;
        console.log("Client sent update");
        break;
      default:
        conn.sendText(JSON.stringify(clientStatus));
        break;
    }
  });
}).listen(80);

