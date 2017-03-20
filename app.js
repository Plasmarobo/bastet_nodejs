var https = require('https');
var http = require('http');
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
      "content": "Lighting Updated."
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
 "bright",
 "high",
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
  "brightness" : 0,
  "mood" : 1,
  "updated_at" : Date.now(),
};


function intentMoodHandler(mood) {
  if (moodMap.includes(mood)) {
    console.log("Setting mood to " + mood);
    sendMoodInfo(moodMap.indexOf(mood));
    return true;
  } else {
    console.log("Unknown " + mood);
    return false;
  }
};

function intentBrightnessLevelHandler(brightness) {
  if (brightnessLevelMap.includes(brightness)) {
    console.log("Setting brightness to " + brightness);
    sendBrightnessInfo(brightnessLevelMap.indexOf(brightness));
    return true;
  } else if (intentBrightnessChangeHandler(brightness)) {
    console.log("Setting brightness " + brightness);
    return true;
  } else {
    console.log("Unknown brightness " + brightness);
    return false;  
  }
};

function intentBrightnessChangeHandler(change) {
   var index = brightnessLevelMap.findIndex(function(elem, index, arr) { return elem === change; });
   if (index == -1)
     return false;
   if (brightnessChangeMapDown.includes(change)) {
     index -= 1;
  } else if (brightnessChangeMapUp.includes(change)) {
    index += 1;
  }
  if (index >= 0 && index < brightnessLevelMap.length) {
    clientStatus["brightness"] = index;
    clientStatus["updated_at"] = Date.now();
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
      var jsonObj = null;
      try { 
        jsonObj = JSON.parse(body);
        if (jsonObj.request.type == "IntentRequest") {
          console.log("Got IntentRequest");
          switch(jsonObj.request.intent.name) {
          case "SetMood":
            var setMood = intentMoodHandler(jsonObj.request.intent.slots.mood.value);
            if (setMood) {
              changeAlexaResponse(alexaResponse, "Bastet has updated the mood to " + moodMap[clientStatus["mood"]]);
            } else {
              changeAlexaResponse(alexaResponse, "Bastet did not understand what mood you wanted.");
            }
            break;
          case "Lights":
            var setBrightness = intentBrightnessLevelHandler(jsonObj.request.intent.slots.brightness.value);
            if (setBrightness) {
              changeAlexaResponse(alexaResponse, brightnessLevelMap[clientStatus["brightness"]]);
            } else {
              changeAlexaResponse(alexaResponse, "Bastet did not understand that brightness level.");
            }
            break;
          default:
            changeAlexaResponse(alexaResponse, "Bastet did not understand your request");
            break;
          }
          res.writeHead(200);
          res.end(JSON.stringify(alexaResponse));
          return;
        } else if (jsonObj.request.type == "StateSync") {
          console.log("Client Sync:\n");
          //clientStatus["mood"] = jsonObj.mood;
          //clientStatus["brightness"] = jsonObj.brightness;
          clientStatus["updated_at"] = Date.now();
          console.log(JSON.stringify(clientStatus) + "\n");
          res.writeHead(200);
          res.end(JSON.stringify(clientStatus));
          return;
        } else {
          res.writeHead(400);
          res.end("{error:\"bad request\"}");
        }
      } catch(e) {
        console.log(e);
        res.writeHead(400);
        res.end("{error:\"malformed json\"}");
      }
    });
  }
};

var server = https.createServer(options, handleResponse).listen(443);
var server2 = http.createServer(handleResponse).listen(80);

function sendMoodInfo(mood) {
  clientStatus["mood"] = mood;
  clientStatus["updated_at"] = Date.now();
};

function sendBrightnessInfo(brightness) {
  clientStatus["brightness"] = brightness;
  clientStatus["updated_at"] = Date.now();
};

