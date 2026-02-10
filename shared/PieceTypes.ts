// import Pawn from "./Pawn";
// import Rook from "./Rook";
// import Bishop from "./Bishop";
// import Knight from "./Knight";
// import Queen from "./Queen";
// import King from "./King";

import {v4} from 'uuid';

export enum PT { 
  pawn= 0,
  rook= 1,
  bishop= 2,
  knight= 3,
  queen= 4,
  king= 5
}

export enum PB {
  "forward" = "forward" ,
  "lateral" = "lateral" ,
  "sideways" = "sideways",
  "vertical" = "vertical",
  "diagonal" = "diagonal" ,
  "omnidirectional" = "omnidirectional",
  "horsey" = "horsey"
}

export enum PC { 
  black= 0,
  white= 1,
}

//for fake polymorphism
//wanted to fake this in shared because the frontend doesn't need to know about the behaviors
//but turning all of this into classes would make the bitworld way more organized
// export const getBehaviorFromType = (type:string)=>{
//   if(type == null){
//     return null;
//   }
//   switch(PT[type]){
//     case PT.pawn:
//       return Pawn;
//       break;
//     case PT.rook:
//       return Rook;
//       break;
//     case PT.bishop:
//       return Bishop;
//       break;
//     case PT.knight:
//       return Knight;
//       break;
//     case PT.queen:
//       return Queen;
//       break;
//     case PT.king:
//       return King;
//       break;
//   }
// };


export class Chesspiece {
  //TODO: fix this so that it's a ghetto abstract class and cannot be instantiated directly
  constructor(properties?, n?, a?){
    if(properties !== undefined && properties !== null){
      const pieceInfo = properties.length != 0? properties.split(" "): [null, null];
 
      this.boardPosition = [n, a];
      this.lastPosition = [n, a];
      this.pieceType =  pieceInfo[0];
      this.pieceColor = pieceInfo[1];
      // this.move = getBehaviorFromType(this.pieceType);
      
      this.captured = false;
      this.inCheck = false;
      this.neverMoved = true;
      this.passingPawn = false;
      this.setKingPos();
      // this.setPieceValue(this.pieceType);
    }
  }

  //use this to make bots
  // private setPieceValue = (val)=>{
  //   val = val.toLowerCase();
  //   if(val== "pawn"){
  //     this.value = 1;
  //   } else if (val== "knight"){
  //     this.value = 3;
  //   } else if (val== "bishop"){
  //     this.value = 3;
  //   } else if (val== "rook"){
  //     this.value = 5;
  //   } else if (val== "queen"){
  //     this.value = 9;
  //   } else if (val== "king"){
  //     this.value = 9001;
  //   }
  // };

  public getPieceValue = ()=>{
    return this.value;
  };
  
  public getBoardPosition=()=>{
    return this.boardPosition;
  }

  public setLastPosition = (x, y)=>{
    this.lastPosition[0] = parseInt(x);
    this.lastPosition[1] = parseInt(y);
  }

  private setKingPos = ()=>{
    if(this.pieceType == "king"){
      if(this.pieceColor == "white"){
        // whiteKing = this;
      } else if (this.pieceColor == "black"){
        // blackKing = this;
      }
    }
  }

  public setBoardPosition = (x, y)=>{
    if((this.neverMoved == true) 
      && (Math.abs(x - this.lastPosition[0]) == 2)
      && (this.pieceType == "pawn")
      ){
        this.setPassingPawn(true);
    } else {
      this.passingPawn = false;
    }

    this.setKingPos();


    //TODO: make sure pawn can only en passant immediately after the opponent moves next turn
    this.setNeverMoved(false);
    this.setLastPosition(this.boardPosition[0], this.boardPosition[1]);
    this.boardPosition[0] = parseInt(x);
    this.boardPosition[1] = parseInt(y);
  }

  public getBoardPositionClassID=()=>{
    return this.boardPosition[0] + " " + this.boardPosition[1];
  }

  // public getPieceBehavior=()=>{
  //   return this.move;
  // }

  public setNeverMoved=(newVal)=>{
    this.neverMoved = newVal;
  }
  public setPassingPawn=(newVal)=>{
    this.passingPawn = newVal;
  }

  public getNeverMoved=()=>{
    return this.neverMoved;
  }

  public getPassingPawn=()=>{
    return this.passingPawn;
  }

  public getPieceID=()=>{
    return this.id;
  }
  
  private value:number;
  public name = "";
  public  captured:boolean;
  // public pinnedMoves: Array<PinnedMoves>;
  private inCheck:boolean;
  public isPinned:boolean;
  public pinningPiece: boolean;
  private passingPawn: boolean;
  private neverMoved = true;
  public pieceType: string;
  public pieceColor: string;
  // private move;
  private lastMoveTime = new Date();
  private lastPosition: Array<number>;
  private boardPosition: Array<number>;
  readonly id: string = v4();
}