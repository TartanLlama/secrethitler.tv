export enum ServerEvent { DisplayRegistered, DisplayBoard };

export interface GameState {
  brexitCounter: number;
  nLiberalsPlayed: number;
  nFascistsPlayed: number;  
  nDiscarded: number;
  nInDeck: number;  
  players: string[];
  president: number;  //index, can be null
  chancellor: number; //index, can be null
};
