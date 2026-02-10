import {Chesspiece, PB} from "./PieceTypes";
export class Queen extends Chesspiece {
  constructor(properties?, n?, a?){
    super(properties, n, a);
  }

  private move = () => {
    return {x:"max", y:"max", constraint: PB.omnidirectional};
  };

  public displayName = "Queen";
} 

export default Queen;
