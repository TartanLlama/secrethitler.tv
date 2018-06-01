"use strict";
exports.__esModule = true;
var registrations = [];
function register_player(reg) {
    if (registrations.length < 10) {
        registrations.push(reg);
        return true;
    }
    return false;
}
exports.register_player = register_player;
function unregister_player(ip) {
    registrations = registrations.filter(function (reg) { return reg.ip !== ip; });
}
exports.unregister_player = unregister_player;
var Role;
(function (Role) {
    Role[Role["Liberal"] = 0] = "Liberal";
    Role[Role["Fascist"] = 1] = "Fascist";
    Role[Role["Hitler"] = 2] = "Hitler";
})(Role || (Role = {}));
var State;
(function (State) {
    State[State["Registration"] = 0] = "Registration";
    State[State["Playing"] = 1] = "Playing";
    State[State["GameOver"] = 2] = "GameOver";
})(State || (State = {}));
var players = [];
var state = State.Registration;
function start_game() {
    if (registrations.length > 5 && registrations.length <= 10) {
        state = State.Playing;
        return true;
    }
    return false;
}
exports.start_game = start_game;
