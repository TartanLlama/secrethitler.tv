import * as Nes from 'nes'

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

enum Role {Liberal, Fascist,  Hitler}
enum State { Registration, Playing, GameOver}

export interface player {
    socket: Nes.Socket;
    name: string;
    role: Role;
}

let players: player[] = [];
let state: State = State.Registration;

export function start_game(): boolean {
    if (registrations.length > 5 && registrations.length <= 10) {
        state = State.Playing;
        return true;
    }
    return false;
}
