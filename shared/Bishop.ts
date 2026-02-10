import {Chesspiece, PB} from "./PieceTypes";
 export class Bishop extends Chesspiece {
  constructor(properties?, n?, a?){
    super(properties, n, a);
  }

  private move = () => {
    return {x:"max", y:"max", constraint: PB.diagonal};
  };

  public displayName = "Bishop";
} 

export default Bishop;
