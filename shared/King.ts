import {Chesspiece, PB} from "./PieceTypes";

const move = () => {
  return {x:2, y:2, constraint: PB.omnidirectional};
};

const King = (p)=> {
};

King.displayName = "King";
King.move = move;
export default King;
