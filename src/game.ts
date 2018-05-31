module.paths.push('js')

import * as Nes from 'nes'
import * as ClientProtocol from 'client-protocol'

let playing: boolean = false;

export interface registration {
    socket: Nes.Socket;
    name: string;
}

let registrations: registration[] = []

export enum RegistrationResult {
  Success, NameAlreadyUsed, NoSpace
};

export function register_player(reg: registration): RegistrationResult {
    if (registrations.length == 10) {
        return RegistrationResult.NoSpace;
    }

    if (registrations.find((p) => { return p.name === reg.name })) {
        return RegistrationResult.NameAlreadyUsed;
    }
    
    registrations.push(reg);
    return RegistrationResult.Success;
}

export interface player {
    socket: Nes.Socket;
    name: string;
    role: Role;
    vote: boolean;
    voteHidden: boolean;
    dead: boolean;
    beenInvestigated: boolean;
}

let players: player[] = [];

 function initialise_roles(roles: Role[]) {

}

export function investigate(name: string): Role {
  const role = players.find((p) => { return name === p.name; }).role;
  return role == Role.Hitler ? Role.Fascist : role;
}

export function getPlayerNames(): string[] {
  //use shuffled order if it's available
  if (players.length === registrations.length) {
    return players.map((x)=>x.name);
  }

  return registrations.map((x)=>x.name);
}

export function getChancellorSocket(): Nes.Socket {
  return players[chancellor_index].socket;
}

export function getChancellorName(): string {
  return players[chancellor_index].name;
}

export function getPresidentSocket(): Nes.Socket {
  return players[president_index].socket;
}

enum State { Registration, Playing, GameOver}
let state: State = State.Registration;

enum Role {Liberal, Fascist, Hitler}

let role_distributions = {
    5: [ Role.Hitler, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal],
    6: [ Role.Hitler, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    7: [ Role.Hitler, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    8: [ Role.Hitler, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    9: [ Role.Hitler, Role.Fascist, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    10: [ Role.Hitler, Role.Fascist, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var president_index = null;
var last_president_index = null;
var chancellor_index = null;
var last_chancellor_index = null;

export type GameActionResults = { [playerName: string] : ClientProtocol.Payload };

export function startGame(): GameActionResults {
    if (registrations.length > 4 && registrations.length <= 10) {
        state = State.Playing;
        const roles = shuffle(role_distributions[registrations.length]);
        players = registrations.map((reg,i) => {
            return { socket: reg.socket,
                     name: reg.name,
                     role: roles[i],
                     vote: null,
                     voteHidden: null,
                     dead: false,
                     beenInvestigated: false };
        });

        shuffle(players);
        president_index = 0;

        return players.reduce((results, player) => {
            const otherRoles = (()=> {
              if (player.role === Role.Fascist
                  || ((players.length === 5 || players.length == 6) && player.role === Role.Hitler)) {
                return players.filter((p) => { return (p.role == Role.Fascist || p.role == Role.Hitler) && p !== player; })
                              .map((p) => { return { name: p.name, role: p.role }; });
              }                              
              return [];
            })();

            results[player.name] = {event: ClientProtocol.ClientEvent.StartGame,
                                    role: player.role, otherRoles: otherRoles};
            return results;
        }, {});
    }
    
    return {};
}

var ready_to_play: player[] = [];
var brexit_counter = 0;

export function startRound(): GameActionResults {
    last_chancellor_index = chancellor_index;
    chancellor_index = null;
    let president = players[president_index];
    let chancellorCandidates = players.filter((p,idx) =>
      {
        return !p.dead
            && idx !== president_index
            && idx !== last_chancellor_index
            && (players.length === 5 || idx !== last_president_index);
      });

    let results = {};
    results[president.name] = {event: ClientProtocol.ClientEvent.NotifyPresident,
                               otherPlayers: chancellorCandidates.map((p)=>{return p.name;})};

    return players.filter((p,idx) => { return idx !== president_index && !p.dead; })
                  .reduce((results, p) => {
                      results[p.name] = {
                        event: ClientProtocol.ClientEvent.NotifyNotPresident,
                        president: president.name
                      };
                      return results;
                  }, results);
}

export function playerReady(sock: Nes.Socket): GameActionResults  {
    let player = players.find((p) => { return p.socket === sock; });
    ready_to_play.push(player);

    if (ready_to_play.length === players.length) {
        president_index = 0;
        return startRound();
    }

    return null;
 }

export function advancePresident(brexit: boolean) {
  last_president_index = brexit ? null : president_index;

  do {
    president_index = (president_index + 1) % players.length;
  } while(players[president_index].dead);
}

export function selectPresident(name): GameActionResults {
    last_president_index = president_index;
    president_index = players.findIndex((p) => { return p.name === name; });
    return startRound();
}


export function selectChancellor(name): GameActionResults  {
    chancellor_index = players.findIndex((p) => { return p.name === name; });
    return players.filter((p) => { return !p.dead; })
                  .reduce((results, player) => {
                     results[player.name] = {
                       event: ClientProtocol.ClientEvent.StartVote,
                       president: players[president_index].name,
                       chancellor: players[chancellor_index].name,
                       brexit: brexit_counter == 2
                     }
                     return results;
                   }, {});
 }

var yes_votes = 0;
var n_votes = 0;

var liberals_played = 0;
var fascists_played = 0;
var deck: ClientProtocol.Card[];
var discard_pile: ClientProtocol.Card[] = new Array(13).fill(ClientProtocol.Card.Fascist).concat(new Array(6).fill(ClientProtocol.Card.Liberal));

function initDeck() {
   deck = discard_pile;
   discard_pile = [];
   shuffle(deck);
}

initDeck();

function peekThree(): ClientProtocol.Card[] {
    if (deck.length < 3) {
      initDeck();
    }

    return deck.slice(-3);
}


function drawThree(): ClientProtocol.Card[] {
    if (deck.length < 3) {
      initDeck();
    }

    return [deck.pop(), deck.pop(), deck.pop()];
}

function drawCard(): ClientProtocol.Card {
    if (deck.length < 3) {
      initDeck();
    }

    return deck.pop();
}

function liberalVictory(): GameActionResults  {
  return players.reduce((results, p) => {
           results[p.name] = {event: ClientProtocol.ClientEvent.LiberalVictory};
           return results;
         }, {});
}

function fascistVictory(): GameActionResults  {
  return players.reduce((results, p) => {
           results[p.name] = {event: ClientProtocol.ClientEvent.FascistVictory};
           return results;
         }, {});
}

function investigationPower (sock: Nes.Socket): GameActionResults  {
  const targets = players.filter((p) => {
    return !(p.socket === sock || p.beenInvestigated);
  }).map((p) => { return p.name; });
  let result = {};
  result[players.find((p) => { return p.socket === sock; }).name] = { event: ClientProtocol.ClientEvent.InvestigationPower, targets: targets };
  return result;
}

function selectPresidentPower (sock: Nes.Socket): GameActionResults  {
  const targets = players.filter((p) => {
    return !(p.socket === sock);
  }).map((p) => { return p.name; });
  let result = {};
  result[players.find((p) => { return p.socket === sock; }).name] = { event: ClientProtocol.ClientEvent.SelectPresidentPower, targets: targets };
  return result;
}

function peekCardPower (sock: Nes.Socket): GameActionResults  {
  let result = {};
  result[players.find((p) => { return p.socket === sock; }).name] = { event: ClientProtocol.ClientEvent.PeekPower, cards: peekThree() };
  return result;
}

export function kill (name: string): GameActionResults  {
  let killed = players.find((p) => { return name === p.name; });
  killed.dead = true;

  advancePresident(false);
  let results = startRound();
  results[killed.name] = { event: ClientProtocol.ClientEvent.Dead };

  return results;
}

function killPower (sock: Nes.Socket): GameActionResults  {
  const targets = players.filter((p) => {
    return !(p.socket === sock || p.dead);
  }).map((p) => { return p.name; });

  let result = {};
  result[players.find((p) => { return p.socket === sock; }).name] = { event: ClientProtocol.ClientEvent.KillPower, targets: targets };
  return result;
}

export function playCard (card: ClientProtocol.Card, brexit: boolean): GameActionResults  {
  if (card === ClientProtocol.Card.Liberal) {
     liberals_played += 1;

     if (liberals_played == 5) {
       liberalVictory();
     }
  }
  else {
    fascists_played += 1;

    if (!brexit) {
      let p = players[president_index].socket;
      switch (fascists_played) {
      case 1: {
         if (players.length > 8) {
           return investigationPower(p);
         }
      }
      case 2: {
         if (players.length > 6) {
           return investigationPower(p);
         }
         break;
      }
      case 3: {
         if (players.length > 6) {
           return selectPresidentPower(p);
         }
         return peekCardPower(p);
      }
      case 4: {
         return killPower(p);
      }
      case 5: {
         return killPower(p);
      }
      case 6: {
        return fascistVictory();
      }
      }
    }
  }
  return null;
}

export function discardCard (card: ClientProtocol.Card) {
  discard_pile.push(card);
}

export function vote(socket: Nes.Socket, vote: boolean): GameActionResults  {
    let player = players.find((p) => { return p.socket === socket; });
    player.vote = vote;
    player.voteHidden = true;

    if (vote) yes_votes += 1;
    n_votes += 1;

    const alive_players: number = players.reduce((acc, p) => { return acc + (p.dead ? 0 : 1); }, 0);

    if (n_votes == alive_players) {
        //reveal votes
        players.map((p) => { p.voteHidden = false; });

        if (players[chancellor_index].role == Role.Hitler && fascists_played >= 3) {
          fascistVictory();
          return;
        }

        if (yes_votes > alive_players / 2) {
            yes_votes = 0;
            n_votes = 0;

            let nonActive = players.filter((p,idx) => {
                return !(idx == president_index || idx == chancellor_index || p.dead);
            });

            let results = {};

            results[players[president_index].name] = {
                                   event: ClientProtocol.ClientEvent.NotifyPresidentCards,
                                   cards: drawThree()
                                };
            results[players[chancellor_index].name] = {event: ClientProtocol.ClientEvent.NotifyWaitForCards};
            nonActive.map((p) => { results[p.name] = {event: ClientProtocol.ClientEvent.NotifyWaitForPlay}; });
            brexit_counter = 0;
            return results;
        }
        else {
            if (brexit_counter == 2) {
                brexit_counter = 0;
                playCard(drawCard(), true);
            }
            else {
                brexit_counter += 1;
            }
            yes_votes = 0;
            n_votes = 0;
            advancePresident(true);
            return startRound();
        }
    }
}

export function getState() {
  return {
           brexitCounter: brexit_counter,
           nLiberalsPlayed: liberals_played,
           nFascistsPlayed: fascists_played,
           nDiscarded: discard_pile.length,
           nInDeck: deck.length,
           players: players.map((p) => {
             return { name: p.name, vote: p.vote, voteHidden: p.voteHidden, dead: p.dead };
           }),
           president: players[president_index].name,
           lastPresident: last_president_index == null ? null : players[last_president_index].name,
           chancellor: chancellor_index == null ? null : players[chancellor_index].name,
           lastChancellor: last_chancellor_index == null ? null : players[last_chancellor_index].name
         };
}
