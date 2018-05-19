import * as Nes from 'nes'

export interface registration {
    socket: Nes.Socket;
    name: string;
}

let registrations: registration[] = []

export function register_player(reg: registration): boolean {
    if (registrations.length < 10) {
        registrations.push(reg);
        console.log(get_player_names());
        return true;
    }
    return false;
}

enum Role {Liberal, Fascist,  Hitler}

export interface player {
    socket: Nes.Socket;
    name: string;
    role: Role;
}

let players: player[] = [];

export function initialise_roles(roles: Role[]) {
    players = registrations.map((reg,i) => {
        return { socket: reg.socket,
                 name: reg.name,
                 role: roles[i] };
    });
    console.log(players);
}

export function get_player_names(): string[] {
       return registrations.map((x)=>x.name);
}
