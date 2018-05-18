export interface registration {
    ip: string;
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

export function unregister_player(ip: string) {
    registrations = registrations.filter(function(reg) { return reg.ip !== ip; });
}

enum Role {Liberal, Fascist,  Hitler}
enum State { Registration, Playing, GameOver}

export interface player {
    ip: string;
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
