"use strict";
exports.__esModule = true;
var Role;
(function (Role) {
    Role[Role["Liberal"] = 0] = "Liberal";
    Role[Role["Fascist"] = 1] = "Fascist";
    Role[Role["Hitler"] = 2] = "Hitler";
})(Role = exports.Role || (exports.Role = {}));
var Card;
(function (Card) {
    Card[Card["Liberal"] = 0] = "Liberal";
    Card[Card["Fascist"] = 1] = "Fascist";
})(Card = exports.Card || (exports.Card = {}));
function cardToString(card) {
    if (card == Card.Liberal)
        return "Liberal";
    return "Fascist";
}
exports.cardToString = cardToString;
///////////////////////////////////////////////
// Events sent from the server to the client //
///////////////////////////////////////////////
var ClientEvent;
(function (ClientEvent) {
    ClientEvent[ClientEvent["StartGame"] = 0] = "StartGame";
    ClientEvent[ClientEvent["NotifyPresident"] = 1] = "NotifyPresident";
    ClientEvent[ClientEvent["NotifyNotPresident"] = 2] = "NotifyNotPresident";
    ClientEvent[ClientEvent["StartVote"] = 3] = "StartVote";
    ClientEvent[ClientEvent["NotifyPresidentCards"] = 4] = "NotifyPresidentCards";
    ClientEvent[ClientEvent["NotifyWaitForCards"] = 5] = "NotifyWaitForCards";
    ClientEvent[ClientEvent["NotifyWaitForPlay"] = 6] = "NotifyWaitForPlay";
    ClientEvent[ClientEvent["NotifyChancellorCards"] = 7] = "NotifyChancellorCards";
    ClientEvent[ClientEvent["InvestigationPower"] = 8] = "InvestigationPower";
    ClientEvent[ClientEvent["SelectPresidentPower"] = 9] = "SelectPresidentPower";
    ClientEvent[ClientEvent["PeekPower"] = 10] = "PeekPower";
    ClientEvent[ClientEvent["KillPower"] = 11] = "KillPower";
    ClientEvent[ClientEvent["LiberalVictory"] = 12] = "LiberalVictory";
    ClientEvent[ClientEvent["FascistVictory"] = 13] = "FascistVictory";
    ClientEvent[ClientEvent["Dead"] = 14] = "Dead";
})(ClientEvent = exports.ClientEvent || (exports.ClientEvent = {}));
////////////////////////////////////////////////
// Actions sent from the client to the server //
////////////////////////////////////////////////
var ClientAction;
(function (ClientAction) {
    ClientAction[ClientAction["Register"] = 0] = "Register";
    ClientAction[ClientAction["StartGame"] = 1] = "StartGame";
    ClientAction[ClientAction["Ready"] = 2] = "Ready";
    ClientAction[ClientAction["SelectChancellor"] = 3] = "SelectChancellor";
    ClientAction[ClientAction["SelectPresident"] = 4] = "SelectPresident";
    ClientAction[ClientAction["Vote"] = 5] = "Vote";
    ClientAction[ClientAction["Discard"] = 6] = "Discard";
    ClientAction[ClientAction["Play"] = 7] = "Play";
    ClientAction[ClientAction["Kill"] = 8] = "Kill";
    ClientAction[ClientAction["Investigate"] = 9] = "Investigate";
    ClientAction[ClientAction["InvestigationComplete"] = 10] = "InvestigationComplete";
    ClientAction[ClientAction["PeekComplete"] = 11] = "PeekComplete";
    ClientAction[ClientAction["GetPlayerList"] = 12] = "GetPlayerList";
    ClientAction[ClientAction["Reconnect"] = 13] = "Reconnect";
})(ClientAction = exports.ClientAction || (exports.ClientAction = {}));
