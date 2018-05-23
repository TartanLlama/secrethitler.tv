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
}

let players: player[] = [];

 function initialise_roles(roles: Role[]) {

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
var chancellor_index = null;

export function startGame(): boolean {
    if (registrations.length > 4 && registrations.length <= 10) {
        state = State.Playing;
        const roles = shuffle(role_distributions[registrations.length]);
        players = registrations.map((reg,i) => {
            return { socket: reg.socket,
                     name: reg.name,
                     role: roles[i],
                     vote: null,
                     voteHidden: null};
        });
        players.map((player) => {
            player.socket.send({event: ClientProtocol.ClientEvent.StartGame, role: player.role});
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
    president_index = (president_index + 1) % players.length;
    chancellor_index = null;
    let president = players[president_index];
    let nonPresidents = players.filter((p,idx) => { return idx !== president_index; });
    president.socket.send({event: ClientProtocol.ClientEvent.NotifyPresident,
                           otherPlayers: nonPresidents.map((p)=>{return p.name;})});
    nonPresidents.map((p) => {
        p.socket.send({event: ClientProtocol.ClientEvent.NotifyNotPresident, president: president.name});
    });
}

export function playerReady(sock: Nes.Socket) {
    let player = players.find((p) => { return p.socket === sock; });
    ready_to_play.push(player);

    if (ready_to_play.length === players.length) {
        president_index = -1;
        startRound();
    }
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

export function playCard (card: ClientProtocol.Card) {
  if (card === ClientProtocol.Card.Liberal) {
     liberals_played += 1;
  }
  else {
     fascists_played += 1;
  }
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
                playCard(drawCard());
            }
            else {
                brexit_counter += 1;
            }
            yes_votes = 0;
            n_votes = 0;
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
           chancellor: chancellor_index ? players[chancellor_index].name : null };
}
