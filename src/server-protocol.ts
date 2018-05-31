export enum ServerEvent { DisplayRegistered, DisplayBoard };

export interface Player {
  name: string;
  vote: boolean;
  voteHidden: boolean;
  dead: boolean;
};

export interface GameState {
  brexitCounter: number;
  nLiberalsPlayed: number;
  nFascistsPlayed: number;
  nDiscarded: number;
  nInDeck: number;
  players: Player[];
  president: string;
  lastPresident: string; //can be null
  chancellor: string; //can be null
  lastChancellor: string; //can be null  
};
