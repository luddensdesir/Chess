const uniqid = require("uniqid");
import Gamelogic from '../../shared/gamelogic';
import Player from "../players/player";

//TODO: add room renaming
//TODO: display all players in room next to room
//TODO: this is in two places
//TODO: return user only users in room
//TODO: add spectator option
//TODO: add game reset option
//TODO: add queue for spectate option
//TODO: create list of rooms with players and spectators
//TODO: identify room owner to players
//TODO: enable inviting of players
//TODO: add friendlist support
//TODO: add basic chat
//TODO: keep track ofusers that joined and left game so they can't rejoin the same game unless invited
//TODO: don't allow room or username less than 4 characters
//TODO: when the new name is 0 length the wrong name gets changed
//TODO: try to remove gamelogic dependency from room manager

type userString = string;
type roomString = string;

class Room{
  constructor(userID:userString){
    this.ownerID = userID;
    this.gameID = uniqid();
    this.name = this.gameID;
    this.players = [];
    this.spectators = [];
    this.players.push(userID);
    this.game = Gamelogic();
    this.shuttingDown = false;
  }

  addPlayer = (playerID) => {
    this.players.push(playerID);
  }

  addSpectator = (playerID) => {
    this.spectators.push(playerID);
  }

  //check if remaining player is not owner. if not owner set owner to someone else
  closeRoom = () => { 
    this.shuttingDown = true;
  }

  removePlayer = (playerID) => {
    for(let i = 0; i < this.players.length;i++){
      if(this.players[i] == playerID){
        this.players.splice(i, 1);
      }
    }

    if(this.players.length == 0){
      this.closeRoom();
    }
  }

  removeSpectator = (playerID) => {
    for(let i = 0; i < this.spectators.length;i++){
      if(this.spectators[i] == playerID){
        this.spectators.splice(i, 1);
      }
    }
  }

  getBasicBoard = () => {
    return this.game.getBasicBoard();
  }

  getConstructedGrid = () => {
    return this.game.getConstructedGrid();
  }

  getValidMoves = (location) => {
    return this.game.getValidMoves(location, (val, newMoves)=>{

      newMoves.push(val);
      return newMoves;
    }, {noStop: false, pinCheck: true});
  }

  movePiece = (moveData) => {
    return this.game.movePiece(moveData);
  }

  resetGame = () => {
    this.game.resetGame();
  }

  getRoomID = () :roomString => {
    return this.gameID;
  }
  setRoomID = () :roomString => {
    return this.gameID;
  }

  getOwnerID = () :userString => {
    return this.ownerID;
  }

  setOwnerID = (newID) => {
    this.ownerID = newID;
  }

  setName = (newName) => {
    this.name = newName;
  }
  getName = () => {
    return this.name;
  }

  getAllOccupants = () => {};

  getSpectators = () => {
    return this.spectators;
  };
  
  getPlayers = () => {
    return this.players;
  }

  ownerID:userString;
  gameID:roomString;
  players = [];
  spectators = [];
  game = null; 
  shuttingDown = false; //disallow new players joining
  public = true;
  membersOnly = false;
  ranked = false;
  name = "";
}
class RoomManager{
  //TODO: periodically check for empty rooms and delete them
  constructor(){
    this.rooms = {};  
  }

  findAvailableMatch = (userID:userString):roomString =>{
    const room = this.searchRooms(userID);
    
    if(room == null){
      this.addUserAsSpectator(room, userID);
    } else {
      this.addUserToRoom(room, userID);
    } 
    return room;
  }


  searchRooms = (userID) => {
    for (const roomID in this.rooms) {
      const room = this.rooms[roomID];

      if (room.players.length < 2) {
       return room;
      }
    }
    return null;
  }

  removeUserFromRoom = (userID:userString, roomID:roomString) => {
    const room = this.rooms[roomID];

    if (room) {
        console.log("removing player");
      room.removePlayer(userID);

      if(room.players.length == 0){
        console.log("room is empty, deleting");

        delete this.rooms[roomID];
        this.numRooms = this.numRooms-1;
      }
    } else {
      return false;
    }
  }

  moveUserToRoom = (currentRoomID, userID, targetRoomID) => {
    this.removeUserFromRoom(currentRoomID, userID);

    const room = this.rooms[targetRoomID];
    if (room) {
      this.addUserToRoom(room, userID);
    }
  }

  addUserToRoom = (room, userID:userString) => {
    if (room) {
      if (room.players.length < 2) {
        room.addPlayer(userID);

        // console.log(room);

        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  addUserAsSpectator = (roomID:roomString, userID:userString):boolean => {
    const room = this.rooms[roomID];
    if (room) {
      room.addSpectator(userID);
      return true;
    } else {
      return false;
    }
  }

  getOtherRoomOccupants =()=>{
    // this.getRoomOccupants(ignoreIndex);
  }

  getRoomOccupants = (ignoreIndex)=> {
    
  }
  
  movePiece = (roomID, userID, moveData) => {
    return {result: this.rooms[roomID].movePiece(moveData), users: this.rooms[roomID].players};
  };

  getRoomMoves = (roomID, userID, location) => {
    return this.rooms[roomID].getValidMoves(location);
  };

  getConstructedGrid = (roomID, userID) => {
  };

  getBasicBoard = (roomID, userID) => {
    return this.rooms[roomID].getBasicBoard();
  };

  getAllRoomIds = () => {
    const roomIDs:any = []; 
    for(const i in this.rooms){
      roomIDs.push(this.rooms[i].getName());
    }
    return roomIDs;
  }

  renameRoom = (targetRoom, userID, newName, cb) => {

    console.log(targetRoom, userID, newName);
    
    this.rooms[targetRoom].setOwnerID("Q34352532%#%@#");

    if(this.rooms[targetRoom].getOwnerID() == userID){
      this.rooms[targetRoom].setName(newName);
      cb(true);
    } else {
      cb(false);
    }
  }

  createRoom = (playerID) => {
    let pid;
  
    if(pid == undefined || pid == null){
      pid = playerID;
    } else {
      pid = null;
    }
    
    const room = new Room( pid );

    this.rooms[room.getRoomID()] = room;
    this.numRooms = this.numRooms+1;

    return room;
  };

  rooms = {};
  numRooms = 0;
}

export {
  RoomManager,
};