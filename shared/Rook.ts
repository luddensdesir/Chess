import {Chesspiece, PB} from "./PieceTypes";
 export class Rook extends Chesspiece {
  constructor(properties?, n?, a?){
    super(properties, n, a);
  }

  private move = () => {
    return {x:"max", y:"max", constraint: PB.lateral};
  };

  public displayName = "Rook";
} 

export default Rook;
