module.paths.push('js')

import * as Nes from 'nes'
import * as ClientProtocol from 'client-protocol'

export interface registration {
    socket: Nes.Socket;
    name: string;
}

let registrations: registration[] = []

export function register_player(reg: registration): boolean {
    if (registrations.length < 10) {
        registrations.push(reg);
        return true;
    }
    return false;
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

export function startGame(): boolean {
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
        players.map((player) => {
            const otherRoles = (()=> {
              if (player.role === Role.Fascist
                  || ((players.length === 5 || players.length == 6) && player.role === Role.Hitler)) {
                return players.filter((p) => { return (p.role == Role.Fascist || p.role == Role.Hitler) && p !== player; })
                              .map((p) => { return { name: p.name, role: p.role }; });
              }                              
              return [];
            })();
            console.log({event: ClientProtocol.ClientEvent.StartGame,
                                role: player.role, otherRoles: otherRoles});
            player.socket.send({event: ClientProtocol.ClientEvent.StartGame,
                                role: player.role, otherRoles: otherRoles});
        });
        shuffle(players);
        president_index = 0;
        return true;
    }
    return false;
}

var ready_to_play: player[] = [];
var brexit_counter = 0;

export function startRound() {
    last_chancellor_index = chancellor_index;
    chancellor_index = null;
    let president = players[president_index];
    let chancellorCandidates = players.filter((p,idx) =>
      {
        return idx !== president_index
            && idx !== last_chancellor_index
            && (players.length === 5 || idx !== last_president_index);
      });
    president.socket.send({event: ClientProtocol.ClientEvent.NotifyPresident,
                           otherPlayers: chancellorCandidates.map((p)=>{return p.name;})});

    players.filter((p,idx) => { return idx !== president_index; })
           .map((p) => {
        p.socket.send({event: ClientProtocol.ClientEvent.NotifyNotPresident, president: president.name});
    });
}

export function playerReady(sock: Nes.Socket) {
    let player = players.find((p) => { return p.socket === sock; });
    ready_to_play.push(player);

    if (ready_to_play.length === players.length) {
        president_index = 0;
        startRound();
    }
 }

export function advancePresident() {
  last_president_index = president_index;
  president_index = (president_index + 1) % players.length;
}

export function selectChancellor(name) {
    chancellor_index = players.findIndex((p) => { return p.name === name; });
    players.map((player) => {
        player.socket.send({event: ClientProtocol.ClientEvent.StartVote,
                            president: players[president_index].name,
                            chancellor: players[chancellor_index].name,
                            brexit: brexit_counter == 2});
    });
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

function liberalVictory() {
  players.map((p) => {
    p.socket.send({event: ClientProtocol.ClientEvent.LiberalVictory});
  });
}

function fascistVictory() {
  players.map((p) => {
    p.socket.send({event: ClientProtocol.ClientEvent.FascistVictory});
  });         
}

function investigationPower (sock: Nes.Socket) {
  const targets = players.filter((p) => {
    return !(p.socket === sock || p.beenInvestigated);
  }).map((p) => { return p.name; });
  sock.send({ event: ClientProtocol.ClientEvent.InvestigationPower, targets: targets });
}

function selectPresidentPower (sock: Nes.Socket) {
  sock.send({ event: ClientProtocol.ClientEvent.SelectPresidentPower });
}

function peekCardPower (sock: Nes.Socket) {
  sock.send({ event: ClientProtocol.ClientEvent.PeekCardPower, cards: peekThree() });
}

function killPower (sock: Nes.Socket) {
  const targets = players.filter((p) => {
    return !(p.socket === sock || p.dead);
  }).map((p) => { return { name: p.name, role: p.role }; });

  sock.send({ event: ClientProtocol.ClientEvent.PeekCardPower, targets: targets });  
}

export function playCard (card: ClientProtocol.Card, brexit: boolean) {
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
         if (players.length > 4) {
           investigationPower(p);
           return true;
         }
         break;
      }
      case 2: {
         if (players.length > 6) {
           investigationPower(p);
           return true;
         }
         break;
      }
      case 3: {
         if (players.length > 6) {
           selectPresidentPower(p);
           return true;
         }
         peekCardPower(p);
         return true;
      }
      case 4: {
         killPower(p);
         return true;
      }
      case 5: {
         killPower(p);
         return true;
      }
      case 6: {
        fascistVictory();
      }
      }
    }
  }
  return false;
}

export function discardCard (card: ClientProtocol.Card) {
  discard_pile.push(card);
}

export function vote(socket: Nes.Socket, vote: boolean) {
    let player = players.find((p) => { return p.socket === socket; });
    player.vote = vote;
    player.voteHidden = true;

    if (vote) yes_votes += 1;
    n_votes += 1;
    if (n_votes == players.length) {
        //reveal votes
        players.map((p) => { p.voteHidden = false; });

        if (players[chancellor_index].role == Role.Hitler && fascists_played >= 3) {
          fascistVictory();
          return;
        }

        if (yes_votes > players.length / 2) {
            yes_votes = 0;
            n_votes = 0;

            let nonActive = players.filter((p,idx) => { return idx !== president_index && idx !== chancellor_index; });
            players[president_index].socket.send({event: ClientProtocol.ClientEvent.NotifyPresidentCards,
                                   cards: drawThree()});
            players[chancellor_index].socket.send({event: ClientProtocol.ClientEvent.NotifyWaitForCards});
            nonActive.map((p) => { p.socket.send({event: ClientProtocol.ClientEvent.NotifyWaitForPlay}) });
            brexit_counter = 0;
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
            advancePresident();
            startRound();
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
           players: players.map((p) => { return { name: p.name, vote: p.vote, voteHidden: p.voteHidden }; }),
           president: players[president_index].name,
           lastPresident: last_president_index == null ? null : players[last_president_index].name,
           chancellor: chancellor_index == null ? null : players[chancellor_index].name,
           lastChancellor: last_chancellor_index == null ? null : players[last_chancellor_index].name
         };
}
