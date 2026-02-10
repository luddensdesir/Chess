import Pawn from "./Pawn";
import Rook from "./Rook";
import Bishop from "./Bishop";
import Knight from "./Knight";
import Queen from "./Queen";
import King from "./King";

//these can be used to determine the behavior of pieces.
//bitworld should not be shared, should be backend only

// Bitboard representation using BigInt for 64-bit integers
interface SegregatedBoards {
  whitePawns: bigint;
  whiteRooks: bigint;
  whiteKnights: bigint;
  whiteBishops: bigint;
  whiteQueens: bigint;
  whiteKing: bigint;
  blackPawns: bigint;
  blackRooks: bigint;
  blackKnights: bigint;
  blackBishops: bigint;
  blackQueens: bigint;
  blackKing: bigint;
  allWhitePieces: bigint;
  allBlackPieces: bigint;
  allPieces: bigint;
}

export interface AttackBoards {
  whitePawnAttacks: bigint;
  whiteKnightAttacks: bigint;
  whiteBishopAttacks: bigint;
  whiteRookAttacks: bigint;
  whiteQueenAttacks: bigint;
  whiteKingAttacks: bigint;
  whiteAllAttacks: bigint;
  blackPawnAttacks: bigint;
  blackKnightAttacks: bigint;
  blackBishopAttacks: bigint;
  blackRookAttacks: bigint;
  blackQueenAttacks: bigint;
  blackKingAttacks: bigint;
  blackAllAttacks: bigint;
}

class Bitboard {
  private static readonly FILE_A: bigint = 0x0101010101010101n;
  private static readonly FILE_H: bigint = 0x8080808080808080n;

  private static readonly ROOK_DIRS: ReadonlyArray<{ dr: number; dc: number }> = [
    { dr: 1, dc: 0 },
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 0, dc: -1 },
  ];

  private static readonly BISHOP_DIRS: ReadonlyArray<{ dr: number; dc: number }> = [
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: -1, dc: -1 },
  ];

  // Initialize bitboards with starting positions
  //https://stackoverflow.com/questions/19516155/chess-bitboard-population
  //https://stackoverflow.com/search?q=chess+bitboard&s=824251a4-8a1f-4c0e-9e09-4cc21c83b15d
  
  constructor(){
    this.updateCombinedBitBoards();
  }



  // Helper functions for bitboard operations
  public squareToIndex = (row: number, col: number): number => (row * 8) + col;
  public indexToSquare = (index: number): {row: number, col: number} => ({
    row: Math.floor(index / 8),
    col: index % 8
  });

  public setBit = (bitboard: bigint, index: number): bigint => bitboard | (1n << BigInt(index));
  public clearBit = (bitboard: bigint, index: number): bigint => bitboard & ~(1n << BigInt(index));
  public getBit = (bitboard: bigint, index: number): boolean => (bitboard & (1n << BigInt(index))) !== 0n;

  private isIndexOnBoard = (index: number): boolean => index >= 0 && index < 64;

  private getColorAtIndex = (index: number): "white" | "black" | null => {
    if (this.getBit(this.boards.allWhitePieces, index)) return "white";
    if (this.getBit(this.boards.allBlackPieces, index)) return "black";
    return null;
  };

  private getPieceKindAtIndex = (
    index: number
  ):
    | { color: "white" | "black"; kind: "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" }
    | null => {
    if (this.getBit(this.boards.whitePawns, index)) return { color: "white", kind: "pawn" };
    if (this.getBit(this.boards.whiteRooks, index)) return { color: "white", kind: "rook" };
    if (this.getBit(this.boards.whiteKnights, index)) return { color: "white", kind: "knight" };
    if (this.getBit(this.boards.whiteBishops, index)) return { color: "white", kind: "bishop" };
    if (this.getBit(this.boards.whiteQueens, index)) return { color: "white", kind: "queen" };
    if (this.getBit(this.boards.whiteKing, index)) return { color: "white", kind: "king" };

    if (this.getBit(this.boards.blackPawns, index)) return { color: "black", kind: "pawn" };
    if (this.getBit(this.boards.blackRooks, index)) return { color: "black", kind: "rook" };
    if (this.getBit(this.boards.blackKnights, index)) return { color: "black", kind: "knight" };
    if (this.getBit(this.boards.blackBishops, index)) return { color: "black", kind: "bishop" };
    if (this.getBit(this.boards.blackQueens, index)) return { color: "black", kind: "queen" };
    if (this.getBit(this.boards.blackKing, index)) return { color: "black", kind: "king" };

    return null;
  };

  private recomputeCombinedOn = (boards: SegregatedBoards): void => {
    boards.allWhitePieces =
      boards.whitePawns |
      boards.whiteRooks |
      boards.whiteKnights |
      boards.whiteBishops |
      boards.whiteQueens |
      boards.whiteKing;
    boards.allBlackPieces =
      boards.blackPawns |
      boards.blackRooks |
      boards.blackKnights |
      boards.blackBishops |
      boards.blackQueens |
      boards.blackKing;
    boards.allPieces = boards.allWhitePieces | boards.allBlackPieces;
  };

  private clearSquareOn = (boards: SegregatedBoards, index: number): void => {
    boards.whitePawns = this.clearBit(boards.whitePawns, index);
    boards.whiteRooks = this.clearBit(boards.whiteRooks, index);
    boards.whiteKnights = this.clearBit(boards.whiteKnights, index);
    boards.whiteBishops = this.clearBit(boards.whiteBishops, index);
    boards.whiteQueens = this.clearBit(boards.whiteQueens, index);
    boards.whiteKing = this.clearBit(boards.whiteKing, index);
    boards.blackPawns = this.clearBit(boards.blackPawns, index);
    boards.blackRooks = this.clearBit(boards.blackRooks, index);
    boards.blackKnights = this.clearBit(boards.blackKnights, index);
    boards.blackBishops = this.clearBit(boards.blackBishops, index);
    boards.blackQueens = this.clearBit(boards.blackQueens, index);
    boards.blackKing = this.clearBit(boards.blackKing, index);
  };

  private computeAllAttacksForBoards = (color: "white" | "black", boards: SegregatedBoards): bigint => {
    const occupancy = boards.allPieces;
    let all = 0n;

    const accumulate = (bb: bigint, fn: (idx: number) => bigint) => {
      this.forEachSetBit(bb, (idx) => {
        all = all | fn(idx);
      });
    };

    if (color === "white") {
      accumulate(boards.whitePawns, (idx) => this.pawnAttacksFrom(idx, "white"));
      accumulate(boards.whiteKnights, (idx) => this.knightAttacksFrom(idx));
      accumulate(boards.whiteBishops, (idx) => this.bishopAttacksFrom(idx, occupancy));
      accumulate(boards.whiteRooks, (idx) => this.rookAttacksFrom(idx, occupancy));
      accumulate(boards.whiteQueens, (idx) => this.queenAttacksFrom(idx, occupancy));
      accumulate(boards.whiteKing, (idx) => this.kingAttacksFrom(idx));
      return all;
    }

    accumulate(boards.blackPawns, (idx) => this.pawnAttacksFrom(idx, "black"));
    accumulate(boards.blackKnights, (idx) => this.knightAttacksFrom(idx));
    accumulate(boards.blackBishops, (idx) => this.bishopAttacksFrom(idx, occupancy));
    accumulate(boards.blackRooks, (idx) => this.rookAttacksFrom(idx, occupancy));
    accumulate(boards.blackQueens, (idx) => this.queenAttacksFrom(idx, occupancy));
    accumulate(boards.blackKing, (idx) => this.kingAttacksFrom(idx));
    return all;
  };

  private getPseudoLegalMoveMask = (
    fromIndex: number,
    piece: { color: "white" | "black"; kind: "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" }
  ): bigint => {
    const occupancy = this.boards.allPieces;
    const friendly = piece.color === "white" ? this.boards.allWhitePieces : this.boards.allBlackPieces;
    const enemy = piece.color === "white" ? this.boards.allBlackPieces : this.boards.allWhitePieces;

    if (piece.kind === "pawn") {
      const { row, col } = this.indexToSquare(fromIndex);
      const forward = piece.color === "white" ? 1 : -1;
      const startRow = piece.color === "white" ? 1 : 6;

      let moves = 0n;
      const oneRow = row + forward;
      if (oneRow >= 0 && oneRow < 8) {
        const oneIdx = this.squareToIndex(oneRow, col);
        if (!this.getBit(occupancy, oneIdx)) {
          moves = moves | (1n << BigInt(oneIdx));

          const twoRow = row + 2 * forward;
          if (row === startRow && twoRow >= 0 && twoRow < 8) {
            const twoIdx = this.squareToIndex(twoRow, col);
            if (!this.getBit(occupancy, twoIdx)) {
              moves = moves | (1n << BigInt(twoIdx));
            }
          }
        }
      }

      const captures = this.pawnAttacksFrom(fromIndex, piece.color) & enemy;
      return (moves | captures) & ~friendly;
    }

    let attacks = 0n;
    switch (piece.kind) {
      case "rook":
        attacks = this.rookAttacksFrom(fromIndex, occupancy);
        break;
      case "knight":
        attacks = this.knightAttacksFrom(fromIndex);
        break;
      case "bishop":
        attacks = this.bishopAttacksFrom(fromIndex, occupancy);
        break;
      case "queen":
        attacks = this.queenAttacksFrom(fromIndex, occupancy);
        break;
      case "king":
        attacks = this.kingAttacksFrom(fromIndex);
        break;
    }

    return attacks & ~friendly;
  };

  private getPinRestrictionMaskForPiece = (color: "white" | "black", pieceIndex: number): bigint | null => {
    const kingBoard = color === "white" ? this.boards.whiteKing : this.boards.blackKing;
    const kingIndex = this.bitScanForwardIndex(kingBoard);
    if (kingIndex === null) return null;

    const friendlyPieces = color === "white" ? this.boards.allWhitePieces : this.boards.allBlackPieces;
    const enemyPieces = color === "white" ? this.boards.allBlackPieces : this.boards.allWhitePieces;

    const isEnemySliderOn = (idx: number, kind: "rookLike" | "bishopLike"): boolean => {
      if (color === "white") {
        if (kind === "rookLike") {
          return this.getBit(this.boards.blackRooks, idx) || this.getBit(this.boards.blackQueens, idx);
        }
        return this.getBit(this.boards.blackBishops, idx) || this.getBit(this.boards.blackQueens, idx);
      }

      if (kind === "rookLike") {
        return this.getBit(this.boards.whiteRooks, idx) || this.getBit(this.boards.whiteQueens, idx);
      }
      return this.getBit(this.boards.whiteBishops, idx) || this.getBit(this.boards.whiteQueens, idx);
    };

    const kingSquare = this.indexToSquare(kingIndex);
    const directions: Array<{ dr: number; dc: number; type: "rookLike" | "bishopLike" }> = [
      ...Bitboard.ROOK_DIRS.map((d) => ({ ...d, type: "rookLike" as const })),
      ...Bitboard.BISHOP_DIRS.map((d) => ({ ...d, type: "bishopLike" as const })),
    ];

    for (const dir of directions) {
      let row = kingSquare.row + dir.dr;
      let col = kingSquare.col + dir.dc;
      let seenCandidate = false;
      let lineMask = 0n;

      while (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const idx = this.squareToIndex(row, col);
        lineMask = lineMask | (1n << BigInt(idx));

        const occupied = this.getBit(this.boards.allPieces, idx);
        if (!occupied) {
          row += dir.dr;
          col += dir.dc;
          continue;
        }

        if (!seenCandidate) {
          if (idx !== pieceIndex) {
            // First blocker is not the candidate piece.
            break;
          }

          if (!this.getBit(friendlyPieces, idx)) {
            // Candidate index isn't actually friendly (shouldn't happen).
            break;
          }

          seenCandidate = true;
          row += dir.dr;
          col += dir.dc;
          continue;
        }

        // After the candidate piece, look for an enemy slider.
        if (this.getBit(enemyPieces, idx) && isEnemySliderOn(idx, dir.type)) {
          return lineMask;
        }

        break;
      }
    }

    return null;
  };

  private bitScanForwardIndex = (bitboard: bigint): number | null => {
    if (bitboard === 0n) return null;
    for (let i = 0; i < 64; i++) {
      if ((bitboard & (1n << BigInt(i))) !== 0n) return i;
    }
    return null;
  };

  private forEachSetBit = (bitboard: bigint, fn: (index: number) => void): void => {
    let bb = bitboard;
    while (bb !== 0n) {
      const idx = this.bitScanForwardIndex(bb);
      if (idx === null) break;
      fn(idx);
      bb = bb & (bb - 1n);
    }
  };

  public boards: SegregatedBoards = {
    whitePawns: 0x000000000000FF00n,    // White pawns on rank 2
    whiteRooks: 0x0000000000000081n,    // White rooks on a1 and h1
    whiteKnights: 0x0000000000000042n,  // White knights on b1 and g1
    whiteBishops: 0x0000000000000024n,  // White bishops on c1 and f1
    whiteKing: 0x0000000000000008n,   // White queen on d1
    whiteQueens: 0x0000000000000010n,     // White king on e1
    blackPawns: 0x00FF000000000000n,    // Black pawns on rank 7
    blackRooks: 0x8100000000000000n,    // Black rooks on a8 and h8
    blackKnights: 0x4200000000000000n,  // Black knights on b8 and g8
    blackBishops: 0x2400000000000000n,  // Black bishops on c8 and f8
    blackKing: 0x0800000000000000n,   // Black queen on d8
    blackQueens: 0x1000000000000000n,     // Black king on e8

    allWhitePieces: 0x000000000000FFFFn,
    allBlackPieces: 0xFFFF000000000000n,
    allPieces: 0xFFFF00000000FFFFn
  };

  public initialBitBoard: SegregatedBoards = {...this.boards};

  public attackBoards: AttackBoards = {
    whitePawnAttacks: 0n,
    whiteKnightAttacks: 0n,
    whiteBishopAttacks: 0n,
    whiteRookAttacks: 0n,
    whiteQueenAttacks: 0n,
    whiteKingAttacks: 0n,
    whiteAllAttacks: 0n,
    blackPawnAttacks: 0n,
    blackKnightAttacks: 0n,
    blackBishopAttacks: 0n,
    blackRookAttacks: 0n,
    blackQueenAttacks: 0n,
    blackKingAttacks: 0n,
    blackAllAttacks: 0n,
  };

  private rayAttacksFrom = (fromIndex: number, dr: number, dc: number, occupancy: bigint): bigint => {
    let attacks = 0n;
    const start = this.indexToSquare(fromIndex);
    let row = start.row + dr;
    let col = start.col + dc;

    while (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const idx = this.squareToIndex(row, col);
      attacks = attacks | (1n << BigInt(idx));
      if (this.getBit(occupancy, idx)) break;
      row += dr;
      col += dc;
    }

    return attacks;
  };

  private rookAttacksFrom = (fromIndex: number, occupancy: bigint): bigint => {
    return (
      this.rayAttacksFrom(fromIndex, 1, 0, occupancy) |
      this.rayAttacksFrom(fromIndex, -1, 0, occupancy) |
      this.rayAttacksFrom(fromIndex, 0, 1, occupancy) |
      this.rayAttacksFrom(fromIndex, 0, -1, occupancy)
    );
  };

  private bishopAttacksFrom = (fromIndex: number, occupancy: bigint): bigint => {
    return (
      this.rayAttacksFrom(fromIndex, 1, 1, occupancy) |
      this.rayAttacksFrom(fromIndex, 1, -1, occupancy) |
      this.rayAttacksFrom(fromIndex, -1, 1, occupancy) |
      this.rayAttacksFrom(fromIndex, -1, -1, occupancy)
    );
  };

  private queenAttacksFrom = (fromIndex: number, occupancy: bigint): bigint => {
    return this.rookAttacksFrom(fromIndex, occupancy) | this.bishopAttacksFrom(fromIndex, occupancy);
  };

  private knightAttacksFrom = (fromIndex: number): bigint => {
    const { row, col } = this.indexToSquare(fromIndex);
    const deltas = [
      { dr: 2, dc: 1 },
      { dr: 2, dc: -1 },
      { dr: -2, dc: 1 },
      { dr: -2, dc: -1 },
      { dr: 1, dc: 2 },
      { dr: 1, dc: -2 },
      { dr: -1, dc: 2 },
      { dr: -1, dc: -2 },
    ];

    let attacks = 0n;
    for (const d of deltas) {
      const r = row + d.dr;
      const c = col + d.dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
      const idx = this.squareToIndex(r, c);
      attacks = attacks | (1n << BigInt(idx));
    }
    return attacks;
  };

  private kingAttacksFrom = (fromIndex: number): bigint => {
    const { row, col } = this.indexToSquare(fromIndex);
    let attacks = 0n;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
        const idx = this.squareToIndex(r, c);
        attacks = attacks | (1n << BigInt(idx));
      }
    }
    return attacks;
  };

  private pawnAttacksFrom = (fromIndex: number, color: "white" | "black"): bigint => {
    const { row, col } = this.indexToSquare(fromIndex);

    // In this codebase's coordinate system: white starts on rows 0/1 and moves toward increasing row.
    const forward = color === "white" ? 1 : -1;

    let attacks = 0n;
    const r = row + forward;
    if (r < 0 || r >= 8) return 0n;

    const left = col - 1;
    const right = col + 1;

    if (left >= 0) attacks = attacks | (1n << BigInt(this.squareToIndex(r, left)));
    if (right < 8) attacks = attacks | (1n << BigInt(this.squareToIndex(r, right)));

    return attacks;
  };

  public updateAttackBoards = (): void => {
    const occupancy = this.boards.allPieces;

    let whitePawnAttacks = 0n;
    let whiteKnightAttacks = 0n;
    let whiteBishopAttacks = 0n;
    let whiteRookAttacks = 0n;
    let whiteQueenAttacks = 0n;
    let whiteKingAttacks = 0n;

    let blackPawnAttacks = 0n;
    let blackKnightAttacks = 0n;
    let blackBishopAttacks = 0n;
    let blackRookAttacks = 0n;
    let blackQueenAttacks = 0n;
    let blackKingAttacks = 0n;

    this.forEachSetBit(this.boards.whitePawns, (idx) => {
      whitePawnAttacks = whitePawnAttacks | this.pawnAttacksFrom(idx, "white");
    });

    this.forEachSetBit(this.boards.whiteKnights, (idx) => {
      whiteKnightAttacks = whiteKnightAttacks | this.knightAttacksFrom(idx);
    });

    this.forEachSetBit(this.boards.whiteBishops, (idx) => {
      whiteBishopAttacks = whiteBishopAttacks | this.bishopAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.whiteRooks, (idx) => {
      whiteRookAttacks = whiteRookAttacks | this.rookAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.whiteQueens, (idx) => {
      whiteQueenAttacks = whiteQueenAttacks | this.queenAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.whiteKing, (idx) => {
      whiteKingAttacks = whiteKingAttacks | this.kingAttacksFrom(idx);
    });

    this.forEachSetBit(this.boards.blackPawns, (idx) => {
      blackPawnAttacks = blackPawnAttacks | this.pawnAttacksFrom(idx, "black");
    });

    this.forEachSetBit(this.boards.blackKnights, (idx) => {
      blackKnightAttacks = blackKnightAttacks | this.knightAttacksFrom(idx);
    });

    this.forEachSetBit(this.boards.blackBishops, (idx) => {
      blackBishopAttacks = blackBishopAttacks | this.bishopAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.blackRooks, (idx) => {
      blackRookAttacks = blackRookAttacks | this.rookAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.blackQueens, (idx) => {
      blackQueenAttacks = blackQueenAttacks | this.queenAttacksFrom(idx, occupancy);
    });

    this.forEachSetBit(this.boards.blackKing, (idx) => {
      blackKingAttacks = blackKingAttacks | this.kingAttacksFrom(idx);
    });

    const whiteAllAttacks =
      whitePawnAttacks |
      whiteKnightAttacks |
      whiteBishopAttacks |
      whiteRookAttacks |
      whiteQueenAttacks |
      whiteKingAttacks;

    const blackAllAttacks =
      blackPawnAttacks |
      blackKnightAttacks |
      blackBishopAttacks |
      blackRookAttacks |
      blackQueenAttacks |
      blackKingAttacks;

    this.attackBoards = {
      whitePawnAttacks,
      whiteKnightAttacks,
      whiteBishopAttacks,
      whiteRookAttacks,
      whiteQueenAttacks,
      whiteKingAttacks,
      whiteAllAttacks,
      blackPawnAttacks,
      blackKnightAttacks,
      blackBishopAttacks,
      blackRookAttacks,
      blackQueenAttacks,
      blackKingAttacks,
      blackAllAttacks,
    };
  };

  // Convert bitboard back to string array for compatibility
  public boardsToStringArray = (): Array<string[]> => {
    const result: Array<string[]> = Array(8).fill(null).map(() => Array(8).fill(""));
    
    for (let i = 0; i < 64; i++) {
      const {row, col} = this.indexToSquare(i);
      
      if (this.getBit(this.boards.whitePawns, i)) result[row][col] = "pawn white";
      else if (this.getBit(this.boards.whiteRooks, i)) result[row][col] = "rook white";
      else if (this.getBit(this.boards.whiteKnights, i)) result[row][col] = "knight white";
      else if (this.getBit(this.boards.whiteBishops, i)) result[row][col] = "bishop white";
      else if (this.getBit(this.boards.whiteQueens, i)) result[row][col] = "queen white";
      else if (this.getBit(this.boards.whiteKing, i)) result[row][col] = "king white";
      else if (this.getBit(this.boards.blackPawns, i)) result[row][col] = "pawn black";
      else if (this.getBit(this.boards.blackRooks, i)) result[row][col] = "rook black";
      else if (this.getBit(this.boards.blackKnights, i)) result[row][col] = "knight black";
      else if (this.getBit(this.boards.blackBishops, i)) result[row][col] = "bishop black";
      else if (this.getBit(this.boards.blackQueens, i)) result[row][col] = "queen black";
      else if (this.getBit(this.boards.blackKing, i)) result[row][col] = "king black";
    }
    
    return result;
  };

  // Convert bitboard back to string array for compatibility
  public attacksToStringArray = (): Array<Array<string[]>> => {
    //works, but squares where attacks are ended on square where ally exists
    
    const result: Array<Array<string[]>> = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null).map(() => []));

    for (let i = 0; i < 64; i++) {
      const { row, col } = this.indexToSquare(i);
      const attackers = result[row][col];

      if (this.getBit(this.attackBoards.whitePawnAttacks, i)) attackers.push("pawn white");
      if (this.getBit(this.attackBoards.whiteRookAttacks, i)) attackers.push("rook white");
      if (this.getBit(this.attackBoards.whiteKnightAttacks, i)) attackers.push("knight white");
      if (this.getBit(this.attackBoards.whiteBishopAttacks, i)) attackers.push("bishop white");
      if (this.getBit(this.attackBoards.whiteQueenAttacks, i)) attackers.push("queen white");
      if (this.getBit(this.attackBoards.whiteKingAttacks, i)) attackers.push("king white");

      if (this.getBit(this.attackBoards.blackPawnAttacks, i)) attackers.push("pawn black");
      if (this.getBit(this.attackBoards.blackRookAttacks, i)) attackers.push("rook black");
      if (this.getBit(this.attackBoards.blackKnightAttacks, i)) attackers.push("knight black");
      if (this.getBit(this.attackBoards.blackBishopAttacks, i)) attackers.push("bishop black");
      if (this.getBit(this.attackBoards.blackQueenAttacks, i)) attackers.push("queen black");
      if (this.getBit(this.attackBoards.blackKingAttacks, i)) attackers.push("king black");
    }

    return result;
  };


  

  // Update all combined bitboards
  public updateCombinedBitBoards = () => {
    this.boards.allWhitePieces = this.boards.whitePawns | this.boards.whiteRooks | this.boards.whiteKnights | 
                              this.boards.whiteBishops | this.boards.whiteQueens | this.boards.whiteKing;
    this.boards.allBlackPieces = this.boards.blackPawns | this.boards.blackRooks | this.boards.blackKnights | 
                              this.boards.blackBishops | this.boards.blackQueens | this.boards.blackKing;
    this.boards.allPieces = this.boards.allWhitePieces | this.boards.allBlackPieces;

    this.updateAttackBoards();
  };

  // Additional bitboard helper functions
  public getPieceAtSquare = (row: number, col: number): string => {
    const index = this.squareToIndex(row, col);

    switch (true) {
      case this.getBit(this.boards.whitePawns, index):
        return "pawn white";
      case this.getBit(this.boards.whiteRooks, index):
        return "rook white";
      case this.getBit(this.boards.whiteKnights, index):
        return "knight white";
      case this.getBit(this.boards.whiteBishops, index):
        return "bishop white";
      case this.getBit(this.boards.whiteQueens, index):
        return "queen white";
      case this.getBit(this.boards.whiteKing, index):
        return "king white";
      case this.getBit(this.boards.blackPawns, index):
        return "pawn black";
      case this.getBit(this.boards.blackRooks, index):
        return "rook black";
      case this.getBit(this.boards.blackKnights, index):
        return "knight black";
      case this.getBit(this.boards.blackBishops, index):
        return "bishop black";
      case this.getBit(this.boards.blackQueens, index):
        return "queen black";
      case this.getBit(this.boards.blackKing, index):
        return "king black";
      default:
        return "empty";
    }
  };

  public movePieceInBitBoard = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const fromIndex = this.squareToIndex(fromRow, fromCol);
    const toIndex = this.squareToIndex(toRow, toCol);
    if (!this.isIndexOnBoard(fromIndex) || !this.isIndexOnBoard(toIndex)) return false;

    const movingPiece = this.getPieceKindAtIndex(fromIndex);
    if (!movingPiece) return false;

    const fromColor = movingPiece.color;
    const toColor = this.getColorAtIndex(toIndex);
    if (toColor !== null && toColor === fromColor) return false; // cannot capture ally

    const pseudoMoves = this.getPseudoLegalMoveMask(fromIndex, movingPiece);
    if (!this.getBit(pseudoMoves, toIndex)) return false;

    // Pin restriction: if pinned, only allow moves on the king line.
    if (movingPiece.kind !== "king") {
      const pinMask = this.getPinRestrictionMaskForPiece(fromColor, fromIndex);
      if (pinMask !== null && !this.getBit(pinMask, toIndex)) return false;
    }

    // Final legality: simulate and ensure own king is not left in check.
    const nextBoards: SegregatedBoards = { ...this.boards };
    this.clearSquareOn(nextBoards, toIndex);

    const applyMoveBit = (key: keyof SegregatedBoards) => {
      // Only meaningful for the piece boards; combined boards are recomputed after.
      nextBoards[key] = this.clearBit(nextBoards[key], fromIndex);
      nextBoards[key] = this.setBit(nextBoards[key], toIndex);
    };

    switch (`${movingPiece.kind} ${movingPiece.color}`) {
      case "pawn white":
        applyMoveBit("whitePawns");
        break;
      case "rook white":
        applyMoveBit("whiteRooks");
        break;
      case "knight white":
        applyMoveBit("whiteKnights");
        break;
      case "bishop white":
        applyMoveBit("whiteBishops");
        break;
      case "queen white":
        applyMoveBit("whiteQueens");
        break;
      case "king white":
        applyMoveBit("whiteKing");
        break;
      case "pawn black":
        applyMoveBit("blackPawns");
        break;
      case "rook black":
        applyMoveBit("blackRooks");
        break;
      case "knight black":
        applyMoveBit("blackKnights");
        break;
      case "bishop black":
        applyMoveBit("blackBishops");
        break;
      case "queen black":
        applyMoveBit("blackQueens");
        break;
      case "king black":
        applyMoveBit("blackKing");
        break;
      default:
        return false;
    }

    this.recomputeCombinedOn(nextBoards);

    const ownKingBoard = fromColor === "white" ? nextBoards.whiteKing : nextBoards.blackKing;
    const ownKingIndex = this.bitScanForwardIndex(ownKingBoard);
    if (ownKingIndex === null) return false;

    const enemyColor = fromColor === "white" ? "black" : "white";
    const enemyAttacks = this.computeAllAttacksForBoards(enemyColor, nextBoards);
    if (this.getBit(enemyAttacks, ownKingIndex)) return false;

    // Commit the move.
    this.clearSquareInBitBoard(toRow, toCol);

    if (movingPiece.color === "white") {
      if (movingPiece.kind === "pawn") this.boards.whitePawns = this.clearBit(this.boards.whitePawns, fromIndex);
      else if (movingPiece.kind === "rook") this.boards.whiteRooks = this.clearBit(this.boards.whiteRooks, fromIndex);
      else if (movingPiece.kind === "knight") this.boards.whiteKnights = this.clearBit(this.boards.whiteKnights, fromIndex);
      else if (movingPiece.kind === "bishop") this.boards.whiteBishops = this.clearBit(this.boards.whiteBishops, fromIndex);
      else if (movingPiece.kind === "queen") this.boards.whiteQueens = this.clearBit(this.boards.whiteQueens, fromIndex);
      else if (movingPiece.kind === "king") this.boards.whiteKing = this.clearBit(this.boards.whiteKing, fromIndex);

      if (movingPiece.kind === "pawn") this.boards.whitePawns = this.setBit(this.boards.whitePawns, toIndex);
      else if (movingPiece.kind === "rook") this.boards.whiteRooks = this.setBit(this.boards.whiteRooks, toIndex);
      else if (movingPiece.kind === "knight") this.boards.whiteKnights = this.setBit(this.boards.whiteKnights, toIndex);
      else if (movingPiece.kind === "bishop") this.boards.whiteBishops = this.setBit(this.boards.whiteBishops, toIndex);
      else if (movingPiece.kind === "queen") this.boards.whiteQueens = this.setBit(this.boards.whiteQueens, toIndex);
      else if (movingPiece.kind === "king") this.boards.whiteKing = this.setBit(this.boards.whiteKing, toIndex);
    } else {
      if (movingPiece.kind === "pawn") this.boards.blackPawns = this.clearBit(this.boards.blackPawns, fromIndex);
      else if (movingPiece.kind === "rook") this.boards.blackRooks = this.clearBit(this.boards.blackRooks, fromIndex);
      else if (movingPiece.kind === "knight") this.boards.blackKnights = this.clearBit(this.boards.blackKnights, fromIndex);
      else if (movingPiece.kind === "bishop") this.boards.blackBishops = this.clearBit(this.boards.blackBishops, fromIndex);
      else if (movingPiece.kind === "queen") this.boards.blackQueens = this.clearBit(this.boards.blackQueens, fromIndex);
      else if (movingPiece.kind === "king") this.boards.blackKing = this.clearBit(this.boards.blackKing, fromIndex);

      if (movingPiece.kind === "pawn") this.boards.blackPawns = this.setBit(this.boards.blackPawns, toIndex);
      else if (movingPiece.kind === "rook") this.boards.blackRooks = this.setBit(this.boards.blackRooks, toIndex);
      else if (movingPiece.kind === "knight") this.boards.blackKnights = this.setBit(this.boards.blackKnights, toIndex);
      else if (movingPiece.kind === "bishop") this.boards.blackBishops = this.setBit(this.boards.blackBishops, toIndex);
      else if (movingPiece.kind === "queen") this.boards.blackQueens = this.setBit(this.boards.blackQueens, toIndex);
      else if (movingPiece.kind === "king") this.boards.blackKing = this.setBit(this.boards.blackKing, toIndex);
    }

    this.updateCombinedBitBoards();
    return true;
  };

  public clearSquareInBitBoard = (row: number, col: number): void => {
    const index = this.squareToIndex(row, col);
    
    this.boards.whitePawns = this.clearBit(this.boards.whitePawns, index);
    this.boards.whiteRooks = this.clearBit(this.boards.whiteRooks, index);
    this.boards.whiteKnights = this.clearBit(this.boards.whiteKnights, index);
    this.boards.whiteBishops = this.clearBit(this.boards.whiteBishops, index);
    this.boards.whiteQueens = this.clearBit(this.boards.whiteQueens, index);
    this.boards.whiteKing = this.clearBit(this.boards.whiteKing, index);
    this.boards.blackPawns = this.clearBit(this.boards.blackPawns, index);
    this.boards.blackRooks = this.clearBit(this.boards.blackRooks, index);
    this.boards.blackKnights = this.clearBit(this.boards.blackKnights, index);
    this.boards.blackBishops = this.clearBit(this.boards.blackBishops, index);
    this.boards.blackQueens = this.clearBit(this.boards.blackQueens, index);
    this.boards.blackKing = this.clearBit(this.boards.blackKing, index);

    //why isnt' updateCombinedBitBoards called here?
    //because this is called from movePieceInBitBoard which calls update after
  };

  public resetBitBoards = () => {
    this.boards = {...this.initialBitBoard};
    this.updateCombinedBitBoards();
  };

  public getBitBoards = () => this.boards;

  public getAttackBoards = () => this.attackBoards;

  public setBitBoards = (newBitBoard: SegregatedBoards) => {
    this.boards = newBitBoard;
    this.updateCombinedBitBoards();
  };

  private id: string;
  private name: string;
}




  // // public getPinnedPieces = (color: "white" | "black"): bigint => {
  // //   const friendlyPieces = color === "white" ? this.boards.allWhitePieces : this.boards.allBlackPieces;
  // //   const enemyPieces = color === "white" ? this.boards.allBlackPieces : this.boards.allWhitePieces;
  // //   const kingBoard = color === "white" ? this.boards.whiteKing : this.boards.blackKing;
  // //   const kingIndex = this.bitScanForwardIndex(kingBoard);

  // //   if (kingIndex === null) return 0n;

  // //   let pinnedMask = 0n;

  // //   const kingSquare = this.indexToSquare(kingIndex);

  // //   const directions: Array<{ dr: number; dc: number; type: "rookLike" | "bishopLike" }> = [
  // //     { dr: 1, dc: 0, type: "rookLike" },
  // //     { dr: -1, dc: 0, type: "rookLike" },
  // //     { dr: 0, dc: 1, type: "rookLike" },
  // //     { dr: 0, dc: -1, type: "rookLike" },
  // //     { dr: 1, dc: 1, type: "bishopLike" },
  // //     { dr: 1, dc: -1, type: "bishopLike" },
  // //     { dr: -1, dc: 1, type: "bishopLike" },
  // //     { dr: -1, dc: -1, type: "bishopLike" },
  // //   ];

  // //   const isEnemySliderOn = (index: number, kind: "rookLike" | "bishopLike"): boolean => {
  // //     if (color === "white") {
  // //       if (kind === "rookLike") return this.getBit(this.boards.blackRooks, index) || this.getBit(this.boards.blackQueens, index);
  // //       return this.getBit(this.boards.blackBishops, index) || this.getBit(this.boards.blackQueens, index);
  // //     }

  // //     if (kind === "rookLike") return this.getBit(this.boards.whiteRooks, index) || this.getBit(this.boards.whiteQueens, index);
  // //     return this.getBit(this.boards.whiteBishops, index) || this.getBit(this.boards.whiteQueens, index);
  // //   };

  // //   for (const dir of directions) {
  // //     let row = kingSquare.row + dir.dr;
  // //     let col = kingSquare.col + dir.dc;

  // //     let blockerIndex: number | null = null;

  // //     while (row >= 0 && row < 8 && col >= 0 && col < 8) {
  // //       const idx = this.squareToIndex(row, col);
  // //       const occupied = this.getBit(this.boards.allPieces, idx);

  // //       if (!occupied) {
  // //         row += dir.dr;
  // //         col += dir.dc;
  // //         continue;
  // //       }

  // //       if (blockerIndex === null) {
  // //         if (this.getBit(friendlyPieces, idx)) {
  // //           blockerIndex = idx;
  // //           row += dir.dr;
  // //           col += dir.dc;
  // //           continue;
  // //         }

  // //         // First encountered piece is enemy: cannot be a pin (needs friendly blocker).
  // //         break;
  // //       }

  // //       // Second encountered piece (after friendly blocker)
  // //       if (this.getBit(enemyPieces, idx) && isEnemySliderOn(idx, dir.type)) {
  // //         pinnedMask = pinnedMask | (1n << BigInt(blockerIndex));
  // //       }

  // //       break;
  // //     }
  // //   }

  // //   return pinnedMask;
  // // };

  // public hasAnyPinnedPiece = (color: "white" | "black"): boolean => {
  //   return this.getPinnedPieces(color) !== 0n;
  // };



const Bitworld = () => {
  const returnNewBitboard = () => {
    const bitboard = new Bitboard();
    return bitboard;
  }; 

  return { 
    returnNewBitboard,
  };
};

export { Bitworld };
Bitworld.displayName = "Bitworld";
