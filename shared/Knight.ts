import {Chesspiece, PB} from "./PieceTypes";



export class Knight extends Chesspiece {
  constructor(properties?, n?, a?){
    super(properties, n, a);
  }

  private move = () => {
    return {x:3, y:1, constraint: PB.horsey};
  };
  public displayName = "Knight";
} 

export default Knight;
