import React, { ReactElement, Component, useEffect, useState } from "react";
import { v4 } from "uuid";
import {Chesspiece} from "./PieceTypes";
// import RCP from "react-chess-pieces";

interface PieceProps{
  pieceType: string;
  pieceColor: string;
  boardPosition: string;
}

const Piece = (props) => {
  // let Piece: React.ElementType = getPieceFromType(props.pieceType, props.pieceColor); 
  // let outline:string;
  // let color:string;
  // let pos:string = props.boardPosition;
  // let underAttack:boolean = false;
  // let protectingKing:boolean = false;
  // let isChecking:boolean = false;
  // let direction:string = "";

  // if(props.pieceColor == "white"){
  //   outline = "#000";
  //   color = "#fff";
  //   direction = "up";
  // } else {
  //   outline = "#fff";
  //   color = "#000";
  //   direction = "down";
  // }
  
  // return (
  //   <div id = "test" className = "piece" onDragStart = {(e)=>{ e.dataTransfer.setData("movingpiece", pos); }}
  //                            onDragEnd = {(e)=>{}}   
  //                            draggable="true">

  //     <Piece  direction = {direction} outline = {outline} color = {color} />
  //   </div>
  // );
};

export default Piece;

Piece.displayName = "Piece";
