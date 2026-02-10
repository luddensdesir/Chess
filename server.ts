/// <reference path="./types/express.d.ts" />
//https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html

import {config} from "./apiKeys";
import express from "express";
import path from "path";
import colors from "colors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import * as jwtHelper from "./backend/utils/jwtHelper";
import {l, n} from "./backend/utils/misc";
import ejs from "ejs";
import {createServer} from 'http';
import {v4} from 'uuid';
import {initiateWss} from "./backend/sockets/socketConnection";
// import { initiateLogger } from "./backend/logging/logManager";
import { RoomManager as RoomManager2} from "./backend/rooms/roomManager";
const uniqid = require("uniqid");
const winston = require('winston');

import {connection} from "./backend/dataAccess/dbConnection";
import listRoutes from "./backend/list/listRoutes";
import userRoutes from "./backend/users/userRoutes";

const port = 8080;

const WSPORT = 8081;

console.log(`***WS port on ${WSPORT + 1}`);
console.log(`***WS port is ${typeof(WSPORT)}`);

const logConfiguration = {
  'transports': [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/mainLog.txt'
      })
  ]
};

const slogConfiguration = {
  'transports': [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/socketMessages.txt'
      })
  ]
};

const slogger = winston.createLogger(slogConfiguration);
const logger = winston.createLogger(logConfiguration);

const app = express();
const server = createServer();
const wss = initiateWss();

connection(config.dbCreds);

require("@babel/register")({extensions: [".js", ".ts"]});

const curEnv = config.curEnv;
const dev = (curEnv === "development");
require("pretty-error").start();


TODO: //set httponly so that cookies are not accessible via client-side JavaScript
app.use(cookieParser(config.cookieSecret/*, { httpOnly: true }*/)); 
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

ejs.delimiter = "?";
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "build/dist"))); //don't remove this, needed for /dist files
app.use(express.static("build/dist"));

app.use(function(req, res, next) {
  if(dev){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  } 
  
  next();
}); 

app.use(function(req, res, next) {
  const encodedToken = req.body.token ||
    req.query.token ||
    req.headers["x-access-token"] ||
    req.cookies.token;

  !n(encodedToken)? req.userToken = jwtHelper.verifyLoginToken(encodedToken):null;
 
  next();
});


let dirPrefix = "build/";
if(curEnv == "production"){
  dirPrefix = "";
}

app.get("/", (req,res) => {

   const message = {header: req.header, body: req.body, query: req.query, cookies: req.cookies, userToken: req.userToken, curEnv: curEnv, ip: req.socket.remoteAddress};

  //call the logger manager and make it do this instead
   logger.log({
     message: message,
     level: 'info'
   });

  res.render(path.resolve(__dirname, dirPrefix + "dist", "index.ejs"), {
    socketPort: WSPORT
  });
}); 
 
app.use(listRoutes);
app.use(userRoutes);

console.log("starting app...");

//const ip = dev ? "localhost":"0.0.0.0";

app.listen(port, () => {
  console.log(colors.yellow(`Listening to app on ${port} in ${curEnv} mode`));
});

const userIDs = {};
let numPlayers = 0;
const roomManager = new RoomManager2();

const updateAllInRoom = (ws, userIDs, action) => {
  wss.clients.forEach( (client) => {
    if(ws['userid'] != client['userid'] && userIDs.includes(client['userid'])){
      client.send(action);
    }
  });
};

const updateAllExcept = (ws, action) => {
  wss.clients.forEach( (client) => {
    if(ws!=client){
      client.send(action);
    }
  });
};

const updateLocalLists = () => {
  resendPlayerList();
  resendRoomList();
};

const resendRoomList = () => {
  wss.clients.forEach( (ws) => {
    ws.send(JSON.stringify({command: "updateRoomList", rooms: roomManager.getAllRoomIds()}));
  });
};

const resendPlayerList = () => {
  wss.clients.forEach( (ws) => {
    ws.send(JSON.stringify({command: "addUser", users: ws['room'].getPlayers()}));
  }); 
};

wss.on('connection', function connection(ws) {
  const newID = uniqid();
  ws['userid'] =  newID;

  userIDs[newID] = newID;

  numPlayers = numPlayers+1;


  if(numPlayers % 2 == 1){
    ws['room'] = roomManager.createRoom(newID);

  } else { 
    ws['room'] = roomManager.findAvailableMatch(newID);
  } 
   
  updateLocalLists();
  
  ws.binaryType = 'arraybuffer';
  ws.send(JSON.stringify({command: "initUser", newUserID: v4()}));

  ws.onclose = () => {
    setTimeout(() => {
        ws.terminate();
    }, 500);
      
    const curSize = wss.clients.size;
    if(curSize < 2){
      console.log("game reset");
      ws.send(JSON.stringify({command: "resetGame"}));
    }
    
    
    console.log("disconnect user from room " + ws['room'].getRoomID());
    roomManager.removeUserFromRoom(ws['userid'], ws['room'].getRoomID());
    userIDs[ ws['userid']] = null;
    delete userIDs[ ws['userid']];
    numPlayers = numPlayers-1;
    updateLocalLists(); 
  };

  ws.on('message', function message(data) {

    const inputCommands = JSON.parse(data.toString());

    if(inputCommands.command == "getRequestedRoomInfo"){
      //TODO: return players in room here, when mouse hovers
    }

    if(inputCommands.command == "joinRoom"){
      roomManager.moveUserToRoom(ws['room'].getRoomID(), ws['userid'], inputCommands.targetRoomID);
      ws.send(JSON.stringify({command: "returnInitialState", newBoard: roomManager.getBasicBoard(ws['room'].getRoomID(), ws['userid'])}));
    }

    if(inputCommands.command == "renameRoom"){
      roomManager.renameRoom(ws['room'].getRoomID(), inputCommands.userID, inputCommands.newName, (success)=>{
        if(success){
          updateLocalLists();
        } else {
          console.log("rename failed");
        }
      });
      updateLocalLists();
    }

    if(inputCommands.command == "getInitialState"){
      //TODO: //send bitboard either stringified or the actual numerical value
      const initialState = roomManager.getBasicBoard(ws['room'].getRoomID(), ws['userid']);
      ws.send(JSON.stringify({command: "returnInitialState", newBoard: initialState}));
    }

    if(inputCommands.command == "getValidMoves"){
      // const moves = roomManager.getRoomMoves( ws['room'].getRoomID(), ws['userid'], inputCommands.location);
      // ws.send(JSON.stringify({command: "receiveMoves", movelist: moves}));
    }
    
    if(inputCommands.command == "movePiece"){
      const moveTime = new Date(inputCommands.moveTime);
      const moveData = {
              location: inputCommands.location, 
              target: inputCommands.target, 
              moveTime: moveTime
      };
      
      const move = roomManager.movePiece(ws['room'].getRoomID(), ws['userid'], moveData);
      const gameResponse = move.result;
      const users = move.users;

      if(gameResponse.completed == true){ 
        // authoritatively respond with newboard
        ws.send(JSON.stringify({command: "finishMove", completeTime: new Date(), moveID: v4(), newBoard: gameResponse.newBoard, location: inputCommands.location, target: inputCommands.target}));
        
        
        updateAllInRoom(ws, 
          users, 
          JSON.stringify({command: "finishForeignMove", newBoard: gameResponse.newBoard, completeTime: new Date(), moveID: v4(), location: inputCommands.location, target: inputCommands.target}));

      } else {
        //error in moving piece 
        // ws.send(JSON.stringify({command: "finishMove", completeTime: new Date(), moveID: v4(), location: inputCommands.location, target: inputCommands.target}));

        // wss.clients.forEach( (client) => {
        //   if(ws!=client){
        //     client.send(JSON.stringify({command: "finishForeignMove", location: inputCommands.location, target: inputCommands.target}));
        //   }
        // }); {
      }
    }
  });

  ws.send('connection initialized');
});

export {};