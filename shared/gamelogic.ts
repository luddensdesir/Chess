import { v4 } from "uuid";
import { Chesspiece, PB} from "./PieceTypes";
import { Bitworld } from "./bitworld";
// import castleTest from "./boardStates/testBoards";
import _ from "lodash";
const util = require('util');

  /*
    new Error().stack.indexOf("movePiece") != -1
  */

//pawn promotion
//cant castle out of check or through check BUT THE ROOK CAN MOVE THROUGH AN ATTACKED SQUARE
//endgame if you get checkmated, can capture, but make the wrong move and fail tocapture, you lose
//checkmate isn't properly calculated when the king can't move into a square that the other king is attacking

//stalemate
//draw by repetition or perepetual check
//draw by 50 move rule
//draw by agreement
//draw by time
//draw by forfeit
//draw by resignation
//draw by adjudication
//draw by insufficient mating material

// interface PinnedMoves{
//   pinner: Chesspiece;
//   moves: Array<Coords>;
// }

enum opp{
  black = "white",
  white = "black"
}

enum orientation{
  black = "down",
  white = "up"
}
interface Range{
  x: string|number;
  y: string|number;
}
interface Coords{
  x: string|number;
  y: string|number;
  illegal?:boolean;
  blocked?: boolean;
  kingLocation?: Coords;
  pinnedPositions?: Array<Coords>;
  pinnedPiece?: Chesspiece;
}

let whiteKing: Chesspiece;
let blackKing: Chesspiece;

// let whiteChecked = false;
// let blackChecked = false;


const Gamelogic = () => {

  let boardID = v4();

  //need a session or gameid id when creating a new game
  
  const GRIDWIDTH = 8;
  
  const blackAttacking: Array<Array<Array<Coords>>> = [ 
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ];

  const whiteAttacking: Array<Array<Array<Coords>>> = [ 
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ];

  const validMoves: Array<Array<Array<Coords>>> = [ 
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ];

  let initialPositions: Array<string[]> = [ 
  ["rook white", "knight white", "bishop white", "king white", "queen white", "bishop white", "knight white", "rook white"],
  ["pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black"],
  ["rook black", "knight black", "bishop black", "king black", "queen black", "bishop black", "knight black", "rook black"],
  ]; 

  let basicPositions: Array<string[]> = [ 
  ["rook white", "knight white", "bishop white", "king white", "queen white", "bishop white", "knight white", "rook white"],
  ["pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white", "pawn white"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black", "pawn black"],
  ["rook black", "knight black", "bishop black", "king black", "queen black", "bishop black", "knight black", "rook black"],
  ];
 


  const board = Bitworld().returnNewBitboard();
  
  //string length can't be non-zero and not a valid chess piece name.
  //if it is a single space " " it will cause issues
  let capturedWhite: Array<string> = [];
  
  let capturedBlack: Array<string> = [];
  
  function clone(instance: Chesspiece): Chesspiece {
    const clone = _.cloneDeep(instance);
    return clone;
  }

  const getCheckmate = (king) => {
    /*
    let kingPos = king.getBoardPosition();

    let x = kingPos[0];
    let y = kingPos[1];

    let doubleCheck = false;
    let defendedSquares = [];
    //make a function for getting a particular board state. If the state is returned with checkmate being false then it's not checkmate

    let attacker;
    let defender;

    if(king.pieceColor == "black"){
      attacker = whiteAttacking;
      defender = blackAttacking;
    } else if (king.pieceColor == "white"){
      attacker = blackAttacking;
      defender = whiteAttacking;
    }

    //check if it's in check 
    const getSpaceOccupancy = (j, k) => {
      if(k < 0 || k > GRIDWIDTH - 1 || j < 0 || j > GRIDWIDTH - 1){
        return true;
      }

      //if the space is occupied but the piece is an enemy piece and can be taken because another piece is not attacking
      //return false;

      let color = king.pieceColor;
      
      if(constructedPositions[j][k]){
        let positionDefended = false;
        if(constructedPositions[j][k].pieceColor != color){
          for(let i = 0; i < attacker[j][k].length; i++){
            if(!(attacker[j][k][i].x == j && attacker[j][k][i].y == k)){
              positionDefended = true;
            }
          }
        } 

        if(positionDefended == true){
          return true;
        } else {
          return false;
        }
      }

      //add a check if black is attacking
      if(basicPositions[j][k] !== "" || attacker[j][k].length){
        return true;
      }
    };

    

    //if the position isn't the king's position and the attacker isn't attacking the king's position
    if(attacker[x][y] && attacker[x][y].length){
      for(let i = 0; i < attacker[x][y].length; i++){
        const curPos = attacker[x][y][i];

        if(curPos.blocked != undefined && curPos.blocked == false){
          // console.log(curPos.pinnedPositions);
          for(let j = 0; j < curPos.pinnedPositions.length; j++){
            const position = curPos.pinnedPositions[j];
            if(!(position.x == x && position.y == y)){
              for(let k = 0; k < defender[position.x][position.y].length; k++){
                const defendingPiece = defender[position.x][position.y][k];
                
                defendedSquares.push({attackedPosition: {x:position.x, y:position.y}, defendingPiece: defendingPiece} );
              }
            }

          }

        }

        //put all pinned positions into this array
        
        let checkBlocked = true;
        if(attacker[x][y].length >= 2){
            if(attacker[x][y][i].blocked == false){
            if(!checkBlocked){
              doubleCheck = true;
            }
            checkBlocked = false;
          } 
        }
      } 

      for(let i = 0; i < defendedSquares.length; i++){
        for(let j = 0; j < defendedSquares[i].length; j++){
          let piece = getPieceByCoords( {x: defendedSquares[i][j].x, y: defendedSquares[i][j].y} );
          
          if(piece.pieceType!= "king"){
          }
        }
      }

      defendedSquares = defendedSquares.filter((val)=>{
        if(!(val.defendingPiece.x == x && val.defendingPiece.y==y)){
          return true;
        }
      });


      if(defendedSquares.length == 0){
        console.log("possible checkmate");
      } else {
        console.log("defender exists");
      }
    }

    //do not worry about blocking attacks. The king has to move

    if(
      getSpaceOccupancy(x + 1, y + 1) && 
      getSpaceOccupancy(x + 1, y) &&
      getSpaceOccupancy(x + 1, y - 1) && 
      getSpaceOccupancy(x, y - 1) &&
      getSpaceOccupancy(x - 1, y - 1) && 
      getSpaceOccupancy(x - 1, y) &&
      getSpaceOccupancy(x - 1, y + 1) &&
      getSpaceOccupancy(x, y + 1) &&
      (doubleCheck == true || (doubleCheck == false && (defendedSquares.length == 0)))
      ){
        //check if anything can capture the attacking piece. If not it's checkmate.
        //check if the piece is attacking
        console.log("checkmate!!");
        return true;
    } else {
      */

      return false;

      /*
    }
      */
  };
  
  function setAttackedSquares (projectionOpts?: {piece:Chesspiece, targ:Coords, depth: number}) {
    /*
    let materialWhite = 0;
    let materialBlack = 0;
    
    for(let i = 0; i < GRIDWIDTH; i++){
      for(let k = 0; k < GRIDWIDTH; k++){
        blackAttacking[i][k] = [];
        whiteAttacking[i][k] = [];
      }
    }
    
    for(let i = 0; i < GRIDWIDTH; i++){
      for(let k = 0; k < GRIDWIDTH; k++){
        const input = {x: i, y: k}; 

        basicPositions[i][k];
        validMoves[i][k] = [];

        if(basicPositions[i][k] == "pawn black"){
          if(i + 1 < GRIDWIDTH && k -1 >= 0 && k + 1< GRIDWIDTH){
            blackAttacking[ i + 1 ][ k + 1 ].push({x: i, y: k});
            blackAttacking[ i + 1 ][ k - 1 ].push({x: i, y: k});
          }
          
        } else if(basicPositions[i][k] == "pawn white"){

          if( i - 1 >= 0 && k -1 >= 0 && k + 1 < GRIDWIDTH){
            whiteAttacking[ i -1 ][ k -1 ].push({x: i, y: k});
            whiteAttacking[ i -1 ][ k +1 ].push({x: i, y: k});
          }
        } 

        if(constructedPositions[i][k]){
          if(constructedPositions[i][k].pieceColor == "white"){
            materialWhite += constructedPositions[i][k].getPieceValue();
          } else if (constructedPositions[i][k].pieceColor == "black"){
            materialBlack += constructedPositions[i][k].getPieceValue();
          }
        }
        
        getValidMoves(input, (val, newMoves)=>{ 
          //need to get copy of positions before setting the new ones
          // don't set old positions to null until after the new ones are set or illegal moves won't be detected

          validMoves[i][k].push(val);

          if( basicPositions[i][k].indexOf("pawn") == - 1 && basicPositions[i][k].indexOf("black") != -1){
            blackAttacking[val.x][val.y].push({x: i, y: k, blocked: val.blocked, kingLocation: val.kingLocation, pinnedPositions: val.pinnedPositions, pinnedPiece: val.pinnedItem});
          } else if ( basicPositions[i][k].indexOf("pawn") == - 1 && basicPositions[i][k].indexOf("white") != -1) {
            whiteAttacking[val.x][val.y].push({x: i, y: k, blocked: val.blocked, kingLocation: val.kingLocation, pinnedPositions: val.pinnedPositions, pinnedPiece: val.pinnedItem});
          }

          newMoves.push(val);
          return newMoves;
        }, {noStop: false, pinCheck: false});
        
      }
    } 
 

    //go through all valid moves and see the value they return
    // setAttackedSquares ({piece:Chesspiece, targ:Coords, depth: number});
    */
    let blackCheckMate = getCheckmate(blackKing);
    let whiteCheckMate = getCheckmate(whiteKing);
  }


  const resetGame = () => {
    capturedWhite = [];
    capturedBlack = [];
  
    boardID = v4();

    basicPositions = JSON.parse(JSON.stringify(initialPositions));
    constructedPositions = constructPositions();
    setAttackedSquares();
};

  let constructedPositions = constructPositions();
  setAttackedSquares();

  function constructPositions () {
    const positionGrid: Array<Array<Chesspiece>> = [];
    for(let i = 0; i < GRIDWIDTH; i ++){
      const arr:Array<Chesspiece> = [];
      for(let k = 0; k < GRIDWIDTH; k++){
 
        const pieceName = basicPositions[i][k];
        let piece: Chesspiece;
        pieceName.length ? piece = new Chesspiece(pieceName, i, k) : piece = null;
        arr.push(piece);
        
      }
      positionGrid.push(arr);
    } 
 
    return positionGrid;
  }

  function getPieceByCoords (targetPos:Coords) : Chesspiece{
    return constructedPositions[targetPos.x][targetPos.y];
  }

  function idToCoords (targetID:string){
    const coordinmates = {x: parseInt(targetID[0]), y:parseInt(targetID[2])};
    return coordinmates;
  }

  function getPieceByID (targetID:string) : Chesspiece{
    return constructedPositions[targetID[0]][targetID[2]];
  }

  // const setPieceByCoords = (targetPos:Coords, val : Chesspiece|null)=>{
  //   constructedPositions[targetPos.x][targetPos.y] = val;
  // };

  const getConstructedGrid = () => {
    return constructedPositions;
  };
  
  function getHorseyMoves (positions:Coords[], currentPiece:Chesspiece, operation:Function):Coords[]{
    // const curPos = currentPiece.getBoardPosition();
    // const current = {x:curPos[0], y:curPos[1]};
    // const x = current.x;
    // const y = current.y;
    
    
    // //this is one of the clearest ways of doing this since there are a finate and small number of states.
    // if( x+1 < GRIDWIDTH && y + 2 < GRIDWIDTH){
    //   positions = operation({ x: x+1,  y: y+2 }, positions);
    // }

    // if( x-1 >= 0 && y+2 < GRIDWIDTH){
    //   positions = operation({ x: x-1,  y: y+2 }, positions);
    // }

    // if( x+1 < GRIDWIDTH && y-2 >= 0){
    //   positions = operation({ x: x+1,  y: y-2 }, positions);
    // }

    // if( x-1 >= 0 && y-2 >= 0){
    //   positions = operation({ x: x-1,  y: y-2 }, positions);
    // }

    // if( x-2 >= 0 && y-1 >= 0){
    //   positions = operation({ x: x-2,  y: y-1}, positions);
    // }

    // if( x+2 < GRIDWIDTH && y+1 < GRIDWIDTH ){
    //   positions = operation({ x: x+2,  y: y+1}, positions);
    // }

    // if( x-2 >=0 && y +1 < GRIDWIDTH){
    //   positions = operation({ x: x-2,  y: y+1 }, positions);
    // }

    // if( x+2 < GRIDWIDTH && y -1 >= 0){
    //   positions = operation({ x: x+2,  y: y-1 }, positions);
    // }

    return positions;
  }

  function getPawnMoves (positions:Coords[], currentPiece:Chesspiece, operation:Function):Coords[]{
    /*
     const curPos = currentPiece.getBoardPosition();
     const current = {x:curPos[0], y:curPos[1]};
     const x = current.x;
     const y = current.y;
     let targetPos2 = "";
     let targetPos3 = "";
         if(orientation[currentPiece.pieceColor] == "down" && x+1< GRIDWIDTH){
         targetPos2 = basicPositions[x+1][y];  
         if(x+2 < GRIDWIDTH){
           targetPos3 = basicPositions[x+2][y];  
         } else {
           targetPos3 = basicPositions[x+1][y];  
         }

       const leftPiece = getPieceByCoords({x: x+1, y: y-1});
       const rightPiece = getPieceByCoords({x: x+1, y: y+1});

       if(x == 4){
         //check if 
         const adjacentLeft = getPieceByCoords({x: x, y: y-1});
         const adjacentRight = getPieceByCoords({x: x, y: y+1});

         if(adjacentRight!= null && adjacentRight!= undefined){
           if(adjacentRight.getPassingPawn() == true){
             positions = operation({ y: adjacentRight.getBoardPosition()[1],  x: adjacentRight.getBoardPosition()[0] + 1 }, positions); 
           }
         }
      
         if(adjacentLeft!= null && adjacentLeft!= undefined){
             positions = operation({ y: adjacentLeft.getBoardPosition()[1],  x: adjacentLeft.getBoardPosition()[0] + 1 }, positions); 
         }
       }

       if( leftPiece!== null && leftPiece!= undefined && orientation[leftPiece.pieceColor] == "up"){
         positions = operation({ y: y-1,  x: x+1}, positions); 
       }

       if( rightPiece!== null && rightPiece!= undefined  &&orientation[rightPiece.pieceColor] == "up"){
         positions = operation({ y: y+1,  x: x + 1}, positions); 
       }
    
       if(targetPos2 == ""){
         positions = operation({ y: y,  x: x + 1 }, positions); 
         if(targetPos3 == "" && currentPiece.getNeverMoved() == true ){
           positions = operation({ y: y,  x: x + 2, notAttacking: true}, positions);
         }
       }

       return positions;
     } else if (orientation[currentPiece.pieceColor] == "up" && x-1 >= 0) {
       targetPos2 = basicPositions[x-1][y];
       if(x-2 >= 0){
         targetPos3 = basicPositions[x-2][y];  
       } else {
         targetPos3 = basicPositions[x-1][y];   
       }

       const leftPiece = getPieceByCoords({x: x-1, y: y-1});
       const rightPiece = getPieceByCoords({x: x-1, y: y+1});

       if(x == 3){
         //check if 
         const adjacentLeft = getPieceByCoords({x: x, y: y-1});
         const adjacentRight = getPieceByCoords({x: x, y: y+1});

         if(adjacentRight!= null && adjacentRight!= undefined){
           if(adjacentRight.getPassingPawn() == true){
             positions = operation({ y: adjacentRight.getBoardPosition()[1],  x: adjacentRight.getBoardPosition()[0] - 1 }, positions); 
           }
         }
      
         if(adjacentLeft!= null && adjacentLeft!= undefined){
           if(adjacentLeft.getPassingPawn() == true){
             positions = operation({ y: adjacentLeft.getBoardPosition()[1],  x: adjacentLeft.getBoardPosition()[0] - 1 }, positions); 
           }
         }
       }

       if( leftPiece!== null && leftPiece!= undefined  && orientation[leftPiece.pieceColor] == "down"){
         positions = operation({ y: y-1,  x: x - 1 }, positions); 
       }

       if( rightPiece!== null && rightPiece!= undefined && orientation[rightPiece.pieceColor] == "down"){
         positions = operation({ y: y+1,  x: x - 1}, positions); 
       }
    
       if(targetPos2 == ""){
         positions = operation({ y: y,  x: x - 1 }, positions); 
         if(targetPos3 == "" && currentPiece.getNeverMoved() == true ){
           positions = operation({ y: y,  x: x - 2, notAttacking: true}, positions); 
         }
       }
       return positions;
     }

     */
    return positions;
  }
   



  function getValidLaterals (positions:Coords[], currentPiece:Chesspiece, range:Range, operation:Function, options):Coords[]{

    /*
    let maxRange:string|number = 2;

    if(range.x === range.y){
      if(range.x == "max"){
        maxRange = GRIDWIDTH;
      } else {
        maxRange = range.x;
      }
    } else {
        maxRange = range.x;
    }

    let i:number, j:number, k:number, l: number;
    const curPos = currentPiece.getBoardPosition();
    const current = {x:curPos[0], y:curPos[1]};
    
    k = l = current.x;
    i = j = current.y;
    let iPos:string, kPos:string, jPos:string, lPos:string;
    let kPinned, iPinned, jPinned, lPinned;
    let rightwardHit:boolean, leftwardHit:boolean, downwardHit:boolean, upwardHit:boolean;
    rightwardHit = leftwardHit = downwardHit = upwardHit = false;

    let kBlocked = false;
    let jBlocked = false;
    let iBlocked = false; 
    let lBlocked = false;

    let pinnedPiece: Chesspiece;

    let x = current.x; //duplicate, refactor current
    let y = current.y;
    
    let king = currentPiece.pieceType == "king"? true: false;
    let color = currentPiece.pieceColor;
   
    //check if you are pinned so you can clear being pinned if you are no longer pinned
    //before piece moved check if piece is pinned. After piece moves check if king is in check
      
    //do diagonal and lateral check for king to see if it is under attack + pawn and knight check
    
    //if fpos is true, check if its a king. if it's a king its in check
    //if it's not a king keep looking to see if the king is behind it. if true. piece is pinned.
    //set the pieces behind any piece found to blocked from that attack

      //add the location of the pinned piece to the king's attacked square but make sure to flag blocked or unblocked
      //if the square is being attacked but it is blocked then the piece that is pinned cannot move.
      //when moving any piece check their king to see if they are pinned. if they are pinned they cannot move
      //if current is a king, flag moves into attacked squares as illegal. illegal moves are different from not having a move

    let jPositions = [];
    let kPositions = [];
    let lPositions = [];
    let iPositions = [];

    let kDist = 0;
    let lDist = 0;
    let iDist = 0;
    let jDist = 0;

    while(!rightwardHit || !leftwardHit || !downwardHit || !upwardHit){  
        if(i != current.y && !rightwardHit){ // upward
          let kingLocation = undefined;
          let pinnedPiece = undefined;
    
          if(iDist == 0 && !iBlocked){
            iPos = basicPositions[current.x][i]; 
            iPinned = getPieceByCoords({x: current.x, y: i});
            iPositions.push({x: current.x, y: i});
          }
          
          if(iPos.length || iBlocked){ 
            iPositions.push({x: current.x, y: i});

            if(iDist >= 1){
              iBlocked = true;
            }

            iDist += 1;
     
            if( basicPositions[current.x][i] == "king black"){
              kingLocation = {x: current.x, y: i};
              rightwardHit = true;
              pinnedPiece = iPinned;
            } else if (   basicPositions[current.x][i] == "king white" ){
              kingLocation = {x: current.x, y: i};
              rightwardHit = true;
              pinnedPiece = iPinned;
            } else if ( basicPositions[current.x][i] != "" && basicPositions[current.x][i] != iPos){
              pinnedPiece = iPinned;
              rightwardHit = true;
            }
          }
    
          let illegal = false; 

          if(iPos == "king " + opp[currentPiece.pieceColor]){
            iBlocked = false;
          } 
          
          positions = operation({ x: current.x, y: i, 
                                  blocked: iBlocked, 
                                  kingLocation: kingLocation, 
                                  pinnedPositions: iPositions, 
                                  illegal: illegal, 
                                  pinnedPiece: pinnedPiece}, 
                                  positions);
            
          } else if (i == current.y){
            iPositions.push({x: current.x, y: i});
          }
        i = i+1;


        if(j != current.y && !leftwardHit){ // upward
          let kingLocation = undefined;
          let pinnedPiece = undefined;
    
          if(jDist == 0 && !jBlocked){
            jPos = basicPositions[current.x][j]; 
            jPinned = getPieceByCoords({x: current.x, y: j});
            jPositions.push({x: current.x, y: j});
          }
          
          if(jPos.length || jBlocked){ 
            jPositions.push({x: current.x, y: j});

            if(jDist >= 1){
              jBlocked = true;
            }

            jDist += 1;
     
            if(  basicPositions[current.x][j] == "king black"){
              kingLocation = {x: current.x, y: j};
              leftwardHit = true;
              pinnedPiece = jPinned;
            } else if (  basicPositions[current.x][j] == "king white" ){
              kingLocation = {x: current.x, y: j};
              leftwardHit = true;
              pinnedPiece = jPinned;
            } else if ( basicPositions[current.x][j] != "" && basicPositions[current.x][j] != jPos){
              pinnedPiece = jPinned;
              leftwardHit = true;
            }
          }
    
          let illegal = false; 

          if(jPos == "king " + opp[currentPiece.pieceColor]){
            jBlocked = false;
          } 
          
          positions = operation({ x: current.x, y: j, 
                                  blocked: jBlocked, 
                                  kingLocation: kingLocation, 
                                  pinnedPositions: jPositions, 
                                  illegal: illegal, 
                                  pinnedPiece: pinnedPiece}, 
                                  positions);
            
          } else if (j == current.y){
            jPositions.push({x: current.x, y: j});
          }
        j = j-1;


      if(k != current.x && !downwardHit){ // upward
        let kingLocation = undefined;
        let pinnedPiece = undefined;
  
        if(kDist == 0 && !kBlocked){
          kPos = basicPositions[k][current.y]; 
          kPinned = getPieceByCoords({x: k, y: current.y});
          kPositions.push({x: k, y: current.y});
        }
        
        if(kPos.length || kBlocked){ 
          kPositions.push({x: k, y: current.y});

          if(kDist >= 1){
            kBlocked = true;
          }

          kDist += 1;
   
          if( basicPositions[k][current.y] == "king black"){
            kingLocation = {x: k, y: current.y};
            downwardHit = true;
            pinnedPiece = kPinned;
          } else if (   basicPositions[k][current.y] == "king white" ){
            kingLocation = {x: k, y: current.y};
            downwardHit = true;
            pinnedPiece = kPinned;
          } else if ( basicPositions[k][current.y] != "" && basicPositions[k][current.y] != kPos){
            pinnedPiece = kPinned;
            downwardHit = true;
          }
        } 
  
        let illegal = false; 

        if(kPos == "king " + opp[currentPiece.pieceColor]){
          kBlocked = false;
        }
        
        positions = operation({ x: k, y:current.y, 
                                blocked: kBlocked, 
                                kingLocation: kingLocation, 
                                pinnedPositions: kPositions, 
                                illegal: illegal, 
                                pinnedPiece: pinnedPiece}, 
                                positions);
          
        } else if (k == current.x){
          kPositions.push({x: k, y: current.y});
        }
      k = k+1;



      if(l != current.x && !upwardHit){ // upward
        let kingLocation = undefined;
        let pinnedPiece = undefined;
  
        if(lDist == 0 && !lBlocked){
          lPos = basicPositions[l][current.y]; 
          lPinned = getPieceByCoords({x: l, y: current.y});
          lPositions.push({x: l, y: current.y});
        }
  
        if(lPos.length || lBlocked){ 
          lPositions.push({x: l, y: current.y});

          if(lDist >= 1){
            lBlocked = true;
          }

          lDist += 1;
   
          if( basicPositions[l][current.y] == "king black"){
            kingLocation = {x: l, y: current.y};
            upwardHit = true;
            pinnedPiece = lPinned;
          } else if ( basicPositions[l][current.y] == "king white" ){
            kingLocation = {x: l, y: current.y};
            upwardHit = true;
            pinnedPiece = lPinned;
          } else if ( basicPositions[l][current.y] != "" && basicPositions[l][current.y] != lPos){
            pinnedPiece = lPinned;
            upwardHit = true;
          }
        } 
  
        let illegal = false; 
        
        if(lPos == "king " + opp[currentPiece.pieceColor]){
          lBlocked = false;
        } 
        
        positions = operation({ x: l, y:current.y, 
                                blocked: lBlocked, 
                                kingLocation: kingLocation, 
                                pinnedPositions: lPositions, 
                                illegal: illegal, 
                                pinnedPiece: pinnedPiece}, 
                                positions);
          
        } else if (l == current.x){
          lPositions.push({x: l, y: current.y});
        }
      l = l-1;


      if(i == GRIDWIDTH || Math.abs(i) - parseInt(maxRange + "") == current.y){
        rightwardHit = true;
      }
      if(j == -1 || Math.abs(j) + parseInt(maxRange + "") == current.y){
        leftwardHit = true;
      }
      if(k == GRIDWIDTH || Math.abs(k) - parseInt(maxRange + "") == current.x){
        downwardHit = true;
      }
      if(l == -1 || Math.abs(l) + parseInt(maxRange + "") == current.x ){
        upwardHit = true;
      }
    } 
    */
    return positions;
  }
  
  function getValidDiagonals (positions:Coords[], currentPiece:Chesspiece, range:Range, operation:Function, options):Coords[]{
    /*
    const curPos = currentPiece.getBoardPosition();
    const current = {x:curPos[0], y:curPos[1]};

    const x = current.x;
    const y = current.y;
    let maxRange:string|number = 2;

    if(range.x === range.y){
      if(range.x == "max"){
        maxRange = GRIDWIDTH;
      } else {
        maxRange = range.x;
      }
    } else {
        maxRange = range.x;
    }

  let tl, tr, bl, br = false;

  let kPinned;
  let kBlocked = false;
  let kPositions = [];
  let kPos;
  let kDist = 0; 

  let jPinned;
  let jBlocked = false; 
  let jPositions = []; 
  let jPos; 
  let jDist = 0; 

  let iPinned;
  let iBlocked = false;
  let iPositions = [];
  let iPos;
  let iDist = 0; 

  let lPinned; 
  let lBlocked = false; 
  let lPositions = [];
  let lPos;
  let lDist = 0;


  let king = currentPiece.pieceType == "king"? true: false;
  let color = currentPiece.pieceColor;

  let trace = new Error().stack.indexOf("movePiece") != -1;

  for( let i = 0; i < maxRange; i++){
    let xplus = x+i;
    let xminus = x-i;
    let yplus = y+i;
    let yminus = y-i;
    let pinnedPiece:Chesspiece;

    // bottom left
    if( xplus < GRIDWIDTH && yplus < GRIDWIDTH  && !br && i != 0){
      let kingLocation = undefined;
      let pinnedPiece = undefined;

      if(lDist == 0 && lBlocked == false ){ //check if it's undefined
        lPos = basicPositions[xplus][yplus]; 
        lPinned = getPieceByCoords({x: xplus, y: yplus});
        lPositions.push({x: xplus, y: yplus});
      }

      if(lPos.length || lBlocked){ 
        lPositions.push({x: xplus, y: yplus});
        
        if(lDist >=1 ){
          lBlocked = true; 
        }

        lDist = lDist + 1;

        if(  basicPositions[xplus][yplus] == "king black"){
          kingLocation = {x: xplus, y: yplus};
          br = true;
          pinnedPiece = lPinned;
          } else if ( basicPositions[xplus][yplus] == "king white" ){
        
          kingLocation = {x: xplus, y: yplus};
          br = true;
          pinnedPiece = lPinned;
        } else if ( basicPositions[xplus][yplus] != "" && basicPositions[xplus][yplus] != lPos){
          pinnedPiece = lPinned;
          br = true;
        }
      }

      let illegal = false; 

      if(lPos == "king " + opp[currentPiece.pieceColor]){
        lBlocked = false;
      } 
      
      positions = operation({ x: xplus, y:yplus, 
                              blocked: lBlocked, 
                              kingLocation: kingLocation, 
                              pinnedPositions: lPositions, 
                              illegal: illegal, 
                              pinnedPiece: pinnedPiece}, 
                              positions);
        
      } else if (i == 0){
        lPositions.push({x: xplus, y: yplus});
      }


    // bottom left
    if( xplus < GRIDWIDTH && yminus > -1  && !bl && i != 0){
      let kingLocation = undefined;
      let pinnedPiece = undefined;

      if(iDist == 0 && !iBlocked){
        iPos = basicPositions[xplus][yminus]; 
        iPinned = getPieceByCoords({x: xplus, y: yminus});
        iPositions.push({x: xplus, y: yminus});
      }

      if(iPos.length || iBlocked){ 
        iPositions.push({x: xplus, y: yminus});

        if(iDist >=1 ){
          iBlocked = true; 
        }

        iDist += 1;
 

        if( basicPositions[xplus][yminus] == "king black"){
          kingLocation = {x: xplus, y: yminus};
          bl = true;
          pinnedPiece = iPinned;
          } else if (basicPositions[xplus][yplus] == "king white" ){
          kingLocation = {x: xplus, y: yminus};
          bl = true;
          pinnedPiece = iPinned;
        } else if ( basicPositions[xplus][yminus] != "" && basicPositions[xplus][yminus] != iPos){
          pinnedPiece = iPinned;
          bl = true;
        }
      } 

      let illegal = false; 
      
      if(iPos == "king " + opp[currentPiece.pieceColor]){
        iBlocked = false;
      }  
      
      positions = operation({ x: xplus, y:yminus, 
                              blocked: iBlocked, 
                              kingLocation: kingLocation, 
                              pinnedPositions: iPositions, 
                              illegal: illegal, 
                              pinnedPiece: pinnedPiece}, 
                              positions);
        
      } else if (i == 0){
        iPositions.push({x: xplus, y: yminus});
      }


    // top left
    if( xminus > -1 && yminus > -1  && !tl && i != 0){
      let kingLocation = undefined;
      let pinnedPiece = undefined;

      if(jDist == 0 && !jBlocked){
        jPos = basicPositions[xminus][yminus]; 
        jPinned = getPieceByCoords({x: xminus, y: yminus});
        jPositions.push({x: xminus, y: yminus});
      }

      if(jPos.length || jBlocked){ 
        jPositions.push({x: xminus, y: yminus});

        if(jDist >=1 ){
          jBlocked = true; 
        }

        jDist += 1;
 
        if(basicPositions[xminus][yminus] == "king black"){
          // console.log('jPos = king black');
          kingLocation = {x: xminus, y: yminus};
          tl = true;
          pinnedPiece = jPinned;
          } else if (basicPositions[xminus][yminus] == "king white" ){
          kingLocation = {x: xminus, y: yminus};
          tl = true;
          pinnedPiece = jPinned;
        } else if ( basicPositions[xminus][yminus] != "" && basicPositions[xminus][yminus] != jPos){
          pinnedPiece = jPinned;
          tl = true;
        }
      } 

      let illegal = false; 
      
      if(jPos == "king " + opp[currentPiece.pieceColor]){
        jBlocked = false;
      } 
      
      positions = operation({ x: xminus, y:yminus, 
                              blocked: jBlocked, 
                              kingLocation: kingLocation, 
                              pinnedPositions: jPositions, 
                              illegal: illegal, 
                              pinnedPiece: pinnedPiece}, 
                              positions);
        
      } else if (i == 0){
        jPositions.push({x: xminus, y: yminus});
      }

    // top right
    if( xminus > -1 && yplus < GRIDWIDTH  && !tr && i != 0){
      let kingLocation = undefined;
      let pinnedPiece = undefined;

      if(kDist == 0 && !kBlocked){
        kPos = basicPositions[xminus][yplus]; 
        kPinned = getPieceByCoords({x: xminus, y: yplus});
        kPositions.push({x: xminus, y: yplus});
      }

      if(kPos.length || kBlocked){ 
        kPositions.push({x: xminus, y: yplus});

        if(kDist >=1 ){
          kBlocked = true; 
        }

        kDist += 1;
 
        if(basicPositions[xminus][yplus] == "king black"){
          kingLocation = {x: xminus, y: yplus};
          tr = true;
          pinnedPiece = kPinned;
          } else if (basicPositions[xminus][yplus] == "king white" ){
          kingLocation = {x: xminus, y: yplus};
          tr = true;
          pinnedPiece = kPinned;
        } else if ( basicPositions[xminus][yplus] != "" && basicPositions[xminus][yplus] != kPos){
          pinnedPiece = kPinned;
          tr = true;
        }
      } 
      
      let illegal = false; 
      
      if(kPos == "king " + opp[currentPiece.pieceColor]){
        kBlocked = false;
      } 

      positions = operation({ x: xminus, y:yplus, 
                              blocked: kBlocked, 
                              kingLocation: kingLocation, 
                              pinnedPositions: kPositions, 
                              illegal: illegal, 
                              pinnedPiece: pinnedPiece}, 
                              positions);
        
      } else if (i == 0){
        kPositions.push({x: xminus, y: yplus});
      }
  }

  if(new Error().stack.indexOf("movePiece") != -1){
    // console.log(positions);
  }
  */
  return positions;
}

  //can be called by the room manager without a callback, or within setattackedsquares with a callback to build valid moves
  //TODO: at every major event when get valid moves or set attacked squares is called the heavy lifting should be done by the bitworld and thats where real calculations should take place
  function getValidMoves (location:Coords, operation: Function, options) : Coords[] {
    //CHECK IF THE Sent move and the current move matches.
    //Check if piece is pinned before checking where it can move
    //CHECK IF piece is a king and in check to see if it can move
    //check if there is a double check as well  
    // console.log(pinCheck);

    if(location == undefined || location == null){
      return [];
    }
          
    const currentPiece = getPieceByCoords({x: location.x, y:location.y});

    if(currentPiece==null){
      return [];
    }

    const maxDistance = {x:0, y:0};
    
    // const range = currentPiece.getPieceBehavior().move();
    const range = {"x":2, "y":2, "constraint":""};

    // if(range.x == "max"){
    //   maxDistance.x = basicPositions[0].length;
    // } else {
      maxDistance.x = range.x;
    // }

    // if(range.y == "max"){
    //   maxDistance.y = basicPositions.length;
    // } else {
      maxDistance.y = range.y;
    // }

    let validPositions:Coords[] = []; 

    if(range.constraint === PB.omnidirectional ){
      validPositions = getValidDiagonals(validPositions, currentPiece, range, operation, options);
      validPositions = getValidLaterals(validPositions, currentPiece, range, operation, options);
    } else if (range.constraint === PB.horsey){
      validPositions = getHorseyMoves(validPositions, currentPiece, operation);
    } else if (range.constraint === PB.lateral){
      validPositions = getValidLaterals(validPositions, currentPiece, range, operation, options);
    } else if (range.constraint === PB.forward){
      validPositions = getPawnMoves(validPositions, currentPiece, operation); 
    } else if (range.constraint === PB.diagonal){
      validPositions = getValidDiagonals(validPositions, currentPiece, range, operation, options);
    }

    return validPositions;
  }

  const getPinnedMoves = (moveData)=>{
    const piece = getPieceByID(moveData.location);
    const targetPiece = getPieceByID(moveData.target);

    let moves = validMoves[moveData.location[0]][moveData.location[2]];

    let kingAttacks;
    let pinnedMoves;
    let finalMoves = [];
    let attackerOrigin;
    let filteredMoves = [];
    let checkBlocked = true;
    let doubleCheck = false;

    if(piece.pieceColor == "black"){
      kingAttacks = whiteAttacking[blackKing.getBoardPosition()[0]][blackKing.getBoardPosition()[1]];
    } else {
      kingAttacks = blackAttacking[whiteKing.getBoardPosition()[0]][whiteKing.getBoardPosition()[1]];
    }

    if(kingAttacks){
      //find the pinned piece and get the associated moves
      for(let i = 0; i < kingAttacks.length; i++ ){
        const attackerMoves = validMoves[kingAttacks[i].x][kingAttacks[i].y];
        for(let j = 0; j<attackerMoves.length; j++){
          if(attackerMoves[j].pinnedPiece!=undefined){

            // console.log(attackerMoves[j]);
            
            if(attackerMoves[j].pinnedPiece.getPieceID() == piece.getPieceID()){
              attackerOrigin = {x: kingAttacks[i].x, y: kingAttacks[i].y};
              pinnedMoves = attackerMoves[j].pinnedPositions;
            }
          }
        }
      }
    }

    //if there are pinned moves, check if the target move is in the pinned moves
    if(pinnedMoves && pinnedMoves.length){
      for(let i = 0; i < moves.length; i++){
        for(let j = 0; j < pinnedMoves.length; j++){
          if( moves[i].x == pinnedMoves[j].x && moves[i].y == pinnedMoves[j].y){
            finalMoves.push(moves[i]);
          }
        }
      }

      
      
    //if there are pinnedmoves and no intersections set moves to []
      if(finalMoves.length){
        moves = finalMoves;
      } else {
        return {moves: [], attackerOrigin: undefined};
      }
    }
    
    for(let i = 0; i < kingAttacks.length; i++ ){ 
      if(kingAttacks[i].blocked == undefined || kingAttacks[i].blocked == false ){
        //if it's already set to false then there are two checks on the king and you can't 
        // console.log("check");
        if(checkBlocked == false){
          // console.log("double check");
          doubleCheck = true;
        }
        checkBlocked = false; 
      }

      //check if there is more than one attack on the king. 
      //If there is is at least two that are not blocked, the king has to move or its checkmate

      if(!checkBlocked && kingAttacks!= undefined){
        if(kingAttacks[i].pinnedPositions!=undefined){
          for(let j = 0; j < kingAttacks[i].pinnedPositions.length; j++){
            for(let k = 0; k < moves.length; k++){
              if(kingAttacks[i].pinnedPositions[j].x == moves[k].x &&
                kingAttacks[i].pinnedPositions[j].y == moves[k].y ){
                  filteredMoves.push(moves[k]);
                }
            }
          }
        }
      }
  }

    return {moves: moves, attackerOrigin: attackerOrigin, checkBlocked: checkBlocked, filteredMoves:filteredMoves, doubleCheck:doubleCheck};
  };

  //TODO:ensure that BB is returned here instead of 'basicpositions'. This function should be used every time the board is requested from a client
  const getBasicBoard = () => { 
    const currentBasicPositions = board.boardsToStringArray();
    return currentBasicPositions;
  };

  //TODO:ensure that BB is returned here instead of 'basicpositions'. This function should be used every time the board is requested from a client
  const getAttackedPositions = (): Array<Array<string[]>> => { 
    const attackedPositions = board.attacksToStringArray();
    return attackedPositions;
  };
 
  const movePiece = (moveData):{completed: boolean, newBoard: string[][], gameState: string, captured:{capturedWhite: string[], capturedBlack:string[]}} => {

    // const piece = getPieceByID(moveData.location);
    // const targetPiece = getPieceByID(moveData.target);

    // const newMoveData = getPinnedMoves(moveData); //this function needs to be reworked to use the bitboard calls

    // let moves = newMoveData.moves;
    // const doubleCheck = newMoveData.doubleCheck;
    // const filteredMoves = newMoveData.filteredMoves;

    // const checkBlocked = newMoveData.checkBlocked;
    // const attackerOrigin = newMoveData.attackerOrigin;

    let targetPosAttacks = [];
    let defenders;
    // if(piece.pieceColor == "black"){
    //   targetPosAttacks = whiteAttacking[moveData.target[0]][moveData.target[2]];
    //   defenders = blackAttacking;
    // } else {
    //   targetPosAttacks = blackAttacking[moveData.target[0]][moveData.target[2]];
    //   defenders = whiteAttacking;
    // } 

    const fromx:number = parseInt(moveData.location[0]);
    const fromy:number = parseInt(moveData.location[2]);
    const tox:number = parseInt(moveData.target[0]);
    const toy:number = parseInt(moveData.target[2]);

    const targ1 = board.getPieceAtSquare(fromx, fromy);
    const targ2 = board.getPieceAtSquare(tox, toy);

    //the process for getting valid moves, pinned movies, checking if a piece is pinned to the king should be 100x faster, and easier to do
    //the order of operations should be the same
    //evaluate the success or fail of the move by returning a result
    const moveSucceeded = board.movePieceInBitBoard(fromx, fromy, tox, toy);

    const a = getAttackedPositions();
    console.dir(a);

    // Bitboard move is authoritative for now. If it succeeded, return the updated board so
    // the server can broadcast it and the UI can re-render.
    if (!moveSucceeded) {
      return {
        completed: false,
        newBoard: getBasicBoard(),
        gameState: "",
        captured: { capturedWhite, capturedBlack },
      };
    }

    return {
      completed: true,
      newBoard: getBasicBoard(),
      gameState: "",
      captured: { capturedWhite, capturedBlack },
    };
    
    
    /*
    //checkmate not working
    //castling not working 
    //check any move, if the move is valid 
    
    //king can't move into attacked area
    if(piece.pieceType == "king"){
      
      if( targetPosAttacks.length ){
        let blocked = true;

        for(let i = 0; i < targetPosAttacks.length; i++ ){
           if(targetPosAttacks[i].blocked == undefined || targetPosAttacks[i].blocked == false ){
            blocked = false; 
          }
        }
        if(!blocked){
          setAttackedSquares();
          return {completed: false, newBoard: getBasicBoard(), 
            gameState: "",
            captured: { capturedWhite,
                        capturedBlack
                      }};
         }

      } else {
        moves = validMoves[moveData.location[0]][moveData.location[2]];
      }
    } else if (piece.pieceType != "king"){
      //other pieces can't move if king is in check and they aren't blocking check
  
      if(attackerOrigin && !checkBlocked){
        setAttackedSquares();
        return {completed: false, newBoard: getBasicBoard(), 
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
      }

      if(!doubleCheck && filteredMoves && filteredMoves.length){
        moves = filteredMoves;
      } else if ( doubleCheck ){
        // console.log("double check, prevent all moves");
      }

      //don't allow the move if the king is in check and the piece isn't blocking check or if the target piece is a king
      //don't allow the move if a double check is active
      if(doubleCheck || (filteredMoves!= undefined && filteredMoves.length == 0 && (!checkBlocked || (targetPiece && targetPiece.pieceType == "king")))){
        setAttackedSquares();
        return {completed: false, newBoard: getBasicBoard(), 
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
       }
    }


    //if the target move isn't on the list of valid moves
    let noMoves = true;
    for(let i = 0 ; i < moves.length; i++){
      const x = parseInt(moves[i].x + "");
      const y = parseInt(moves[i].y + "");

      if(x === parseInt(moveData.target[0]) && y === parseInt(moveData.target[2])){
        noMoves = false;
        break;
      } 
    }

    //castling. check for castling into check
    //king can't castle when in check or movement space is under attack
    //king can castle when rook, or rook's movement space is under attack
    if( !noMoves && 
        targetPiece != null && 
        targetPiece.pieceType == "rook" && 
        piece.pieceType == "king" &&
        ((targetPiece.pieceColor == "white" &&
          (targetPiece.getBoardPosition()[0] == 7 && targetPiece.getBoardPosition()[1] == 0 || 
        targetPiece.getBoardPosition()[0] == 7 && targetPiece.getBoardPosition()[1] == 7)) || 
        (targetPiece.pieceColor == "black" && 
          (targetPiece.getBoardPosition()[0] == 0 && targetPiece.getBoardPosition()[1] == 0 ||
          targetPiece.getBoardPosition()[0] == 0 && targetPiece.getBoardPosition()[1] == 7))
        )){

        if(targetPiece.getNeverMoved() == true && piece.getNeverMoved() == true){
          const pieceCoords2 = idToCoords(moveData.location);
          const targetCoords2 = idToCoords(moveData.target);

          const tempBasicPos = basicPositions[targetCoords2.x][targetCoords2.y];
          basicPositions[targetCoords2.x][targetCoords2.y] = basicPositions[pieceCoords2.x][pieceCoords2.y]; 
          basicPositions[pieceCoords2.x][pieceCoords2.y] = tempBasicPos;

          const tempPiece = clone(constructedPositions[targetCoords2.x][targetCoords2.y]); 

          constructedPositions[targetCoords2.x][targetCoords2.y] = clone(constructedPositions[pieceCoords2.x][pieceCoords2.y]);
          constructedPositions[targetCoords2.x][targetCoords2.y].setBoardPosition( targetCoords2.x, targetCoords2.y);
          
          constructedPositions[pieceCoords2.x][pieceCoords2.y] = clone(tempPiece);
          constructedPositions[pieceCoords2.x][pieceCoords2.y].setBoardPosition(pieceCoords2.x, pieceCoords2.y);

          setAttackedSquares();
          return {completed: true, newBoard: getBasicBoard(), 
            gameState: "",
            captured: { capturedWhite,
                        capturedBlack
                      }};
        }
    } 

    //if there are no valid moves
    if(noMoves == true || 
      (targetPiece != null && (piece.pieceColor === targetPiece.pieceColor))){

        setAttackedSquares();
        return {completed: false, newBoard: getBasicBoard(), 
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
    } 

    const pieceCoords = idToCoords(moveData.location);
    const targetCoords = idToCoords(moveData.target);


    //if it's in the same spot
    if(pieceCoords.x === targetCoords.x && pieceCoords.y === targetCoords.y){
        setAttackedSquares();
        return {completed: false, newBoard: getBasicBoard(), 
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
    }

    //king can't move into check

    
    // if(constructedPositions[current.x][current.y].isPinned){ 
    //   return constructedPositions[current.x][current.y].pinnedMoves;
    // }
    

    for(let i = 0; i < defenders[moveData.target[0]][moveData.target[2]].length; i++){
      if(defenders[moveData.target[0]][moveData.target[2]][i].x == moveData.location[0] &&
        defenders[moveData.target[0]][moveData.target[2]][i].y == moveData.location[2]
        ){

          if(defenders[moveData.target[0]][moveData.target[2]][i].blocked == true){
            setAttackedSquares();
            return {completed: false, newBoard: getBasicBoard(), 
              gameState: "",
              captured: { capturedWhite,
                          capturedBlack
                        }};
          }
        }
    }


    //regular moves including en croissant
    if (piece != null || piece != undefined) {
      if (targetPiece != null || targetPiece != undefined) {

        basicPositions[targetCoords.x][targetCoords.y] = basicPositions[pieceCoords.x][pieceCoords.y]; 
        basicPositions[pieceCoords.x][pieceCoords.y] = "";
        
        constructedPositions[targetCoords.x][targetCoords.y].captured = true;
        constructedPositions[targetCoords.x][targetCoords.y] = constructedPositions[pieceCoords.x][pieceCoords.y];
        constructedPositions[pieceCoords.x][pieceCoords.y] = null;
        constructedPositions[targetCoords.x][targetCoords.y].setBoardPosition(targetCoords.x, targetCoords.y);

        setAttackedSquares();
        return {completed: true, newBoard: getBasicBoard(), 
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
      } else { 
        basicPositions[targetCoords.x][targetCoords.y] = basicPositions[pieceCoords.x][pieceCoords.y]; 
        basicPositions[pieceCoords.x][pieceCoords.y] = "";

        constructedPositions[targetCoords.x][targetCoords.y] = constructedPositions[pieceCoords.x][pieceCoords.y];
        constructedPositions[pieceCoords.x][pieceCoords.y] = null;
        constructedPositions[targetCoords.x][targetCoords.y].setBoardPosition(targetCoords.x, targetCoords.y);

        //en passant
        if( 
          constructedPositions[targetCoords.x][targetCoords.y].pieceType == "pawn" &&
          orientation[constructedPositions[targetCoords.x][targetCoords.y].pieceColor] == "down" &&
          constructedPositions[targetCoords.x - 1][targetCoords.y] != null &&
          constructedPositions[targetCoords.x - 1][targetCoords.y].pieceType != null &&
          constructedPositions[targetCoords.x - 1][targetCoords.y].pieceType == "pawn" &&
          constructedPositions[targetCoords.x - 1][targetCoords.y].getPassingPawn() == true
        ){
          constructedPositions[targetCoords.x - 1][targetCoords.y] = null;
          basicPositions[targetCoords.x -1][targetCoords.y] = "";
        }

        if( 
          constructedPositions[targetCoords.x][targetCoords.y].pieceType == "pawn" &&
          orientation[constructedPositions[targetCoords.x][targetCoords.y].pieceColor] == "up" &&
          constructedPositions[targetCoords.x + 1][targetCoords.y] != null &&
          constructedPositions[targetCoords.x + 1][targetCoords.y].pieceType != null &&
          constructedPositions[targetCoords.x + 1][targetCoords.y].pieceType == "pawn" &&
          constructedPositions[targetCoords.x + 1][targetCoords.y].getPassingPawn() == true
        ){
          constructedPositions[targetCoords.x + 1][targetCoords.y] = null;
          basicPositions[targetCoords.x + 1][targetCoords.y] = "";
        }

        setAttackedSquares();
        return {completed: true, newBoard: getBasicBoard(),
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }};
      }
    } else {

        setAttackedSquares();

        */
        return {
          completed: false, newBoard: getBasicBoard(),
          gameState: "",
          captured: { capturedWhite,
                      capturedBlack
                    }
                  };

                  /*
    }
                  */
  };


  return {
    getBasicBoard,
    getConstructedGrid,
    getValidMoves,
    movePiece,
    resetGame,
  };
};

export default Gamelogic;
Gamelogic.displayName = "Gamelogic";
