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
}

let players: player[] = [];

 function initialise_roles(roles: Role[]) {

}

export function getPlayerNames(): string[] {
       return registrations.map((x)=>x.name);
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

var president: player;
var chancellor: player;

export function startGame(): boolean {
    if (registrations.length > 4 && registrations.length <= 10) {
        state = State.Playing;
        const roles = shuffle(role_distributions[registrations.length]);
        players = registrations.map((reg,i) => {
            return { socket: reg.socket,
                     name: reg.name,
                     role: roles[i] };
        });
        players.map((player) => {
            player.socket.send({event: ClientProtocol.ClientEvent.StartGame, role: player.role});
        });
        shuffle(players);
        president = players[0];
        return true;
    }
    return false;
}

var ready_to_play: player[] = [];

function startRound() {
    let nonPresidents = players.filter((p) => { return p !== president; });
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
        startRound();
    }
 }

export function selectChancellor(name) {
    console.log(name);
    chancellor = players.find((p) => { return p.name === name; });
    players.map((player) => {
        player.socket.send({event: ClientProtocol.ClientEvent.StartVote,
                            president: president.name,
                            chancellor: chancellor.name});
    });
 }

var yes_votes = 0;
var n_votes = 0;

export function vote(socket: Nes.Socket, vote: boolean) {
    if (vote) yes_votes += 1;
    n_votes += 1;
    if (n_votes == players.length) {
        if (yes_votes > players.length / 2) {
            yes_votes = 0;
            n_votes = 0;

            let nonActive = players.filter((p) => { return p !== president && p !== chancellor; });
            president.socket.send({event: ClientProtocol.ClientEvent.NotifyCards,
                                   cards: [ClientProtocol.Card.Liberal, ClientProtocol.Card.Fascist, ClientProtocol.Card.Fascist]});
            chancellor.socket.send({event: ClientProtocol.ClientEvent.NotifyWaitForCards});
            nonActive.map((p) => { p.socket.send({event: ClientProtocol.ClientEvent.NotifyWaitForPlay}) });
        }
        else {
            yes_votes = 0;
            n_votes = 0;
            startRound();
        }
    }

}

export function getState() {
  return {
           brexitCounter: 0,
           nLiberalsPlayed: 5,
           nFascistsPlayed: 6,
           nDiscarded: 0,
           nInDeck: 0,
           players: getPlayerNames(),
           president: null,
           chancellor: null };
}
