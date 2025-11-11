declare global{
  namespace Express {
    export interface Request {
      userToken?: string;
    }
  }
}

export {};