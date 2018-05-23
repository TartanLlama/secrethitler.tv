export enum ServerEvent { DisplayRegistered, DisplayBoard };

export interface GameState {
  brexitCounter: number;
  nLiberalsPlayed: number;
  nFascistsPlayed: number;
  nDiscarded: number;
  nInDeck: number;
  players: { name: string, vote: boolean, voteHidden: boolean }[];
  president: string;
  chancellor: string; //can be null
};
