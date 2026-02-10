import {Chesspiece, PB} from "./PieceTypes";
export class Pawn extends Chesspiece {
  constructor(properties?, n?, a?){
    super(properties, n, a);
  }

  private move = () => {
    return {x: 1, y: 0, constraint: PB.forward };
  };

  public displayName = "Pawn";
} 

export default Pawn;
