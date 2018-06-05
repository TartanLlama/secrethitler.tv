"use strict";
exports.__esModule = true;
module.paths.push('js');
var ClientProtocol = require("client-protocol");
var GameDB = require("game-db");
var playing = false;
function gameOngoing() {
    return playing;
}
exports.gameOngoing = gameOngoing;
var GameEvent;
(function (GameEvent) {
    GameEvent[GameEvent["Execution"] = 0] = "Execution";
    GameEvent[GameEvent["Investigation"] = 1] = "Investigation";
    GameEvent[GameEvent["Peek"] = 2] = "Peek";
    GameEvent[GameEvent["PresidentSelect"] = 3] = "PresidentSelect";
})(GameEvent || (GameEvent = {}));
var currentRound;
var gameLog = { rounds: [], kudos: {} };
var registrations = [];
var RegistrationResult;
(function (RegistrationResult) {
    RegistrationResult[RegistrationResult["Success"] = 0] = "Success";
    RegistrationResult[RegistrationResult["NameAlreadyUsed"] = 1] = "NameAlreadyUsed";
    RegistrationResult[RegistrationResult["NoSpace"] = 2] = "NoSpace";
})(RegistrationResult = exports.RegistrationResult || (exports.RegistrationResult = {}));
;
function register_player(name) {
    if (registrations.length == 10) {
        return RegistrationResult.NoSpace;
    }
    if (registrations.find(function (p) { return p === name; })) {
        return RegistrationResult.NameAlreadyUsed;
    }
    registrations.push(name);
    return RegistrationResult.Success;
}
exports.register_player = register_player;
var players = [];
function initialise_roles(roles) {
}
function investigate(name) {
    currentRound.events.push({ event: GameEvent.Investigation, name: name });
    var role = players.find(function (p) { return name === p.name; }).role;
    return role == Role.Hitler ? Role.Fascist : role;
}
exports.investigate = investigate;
function getPlayerNames() {
    //use shuffled order if it's available
    if (players.length === registrations.length) {
        return players.map(function (x) { return x.name; });
    }
    return registrations;
}
exports.getPlayerNames = getPlayerNames;
function getChancellorName() {
    return players[chancellor_index].name;
}
exports.getChancellorName = getChancellorName;
var Role;
(function (Role) {
    Role[Role["Liberal"] = 0] = "Liberal";
    Role[Role["Fascist"] = 1] = "Fascist";
    Role[Role["Hitler"] = 2] = "Hitler";
})(Role || (Role = {}));
var role_distributions = {
    5: [Role.Hitler, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal],
    6: [Role.Hitler, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    7: [Role.Hitler, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    8: [Role.Hitler, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    9: [Role.Hitler, Role.Fascist, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal],
    10: [Role.Hitler, Role.Fascist, Role.Fascist, Role.Fascist, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal, Role.Liberal]
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
function startGame() {
    if (registrations.length > 4 && registrations.length <= 10) {
        playing = true;
        var roles_1 = shuffle(role_distributions[registrations.length]);
        players = registrations.map(function (reg, i) {
            return {
                name: reg,
                role: roles_1[i],
                vote: null,
                voteHidden: null,
                dead: false,
                beenInvestigated: false
            };
        });
        shuffle(players);
        president_index = 0;
        gameLog.roles = players.reduce(function (results, player) {
            results[player.name] = player.role;
            return results;
        }, {});
        return players.reduce(function (results, player) {
            var otherRoles = (function () {
                if (player.role === Role.Fascist
                    || ((players.length === 5 || players.length == 6) && player.role === Role.Hitler)) {
                    return players.filter(function (p) {
                        return (p.role == Role.Fascist || p.role == Role.Hitler) && p !== player;
                    }).map(function (p) { return { name: p.name, role: p.role }; });
                }
                return [];
            })();
            results[player.name] = { event: ClientProtocol.ClientEvent.StartGame,
                role: player.role, otherRoles: otherRoles };
            return results;
        }, {});
    }
    return {};
}
exports.startGame = startGame;
var ready_to_play = [];
var brexit_counter = 0;
function startRound() {
    last_chancellor_index = chancellor_index;
    chancellor_index = null;
    var president = players[president_index];
    var chancellorCandidates = players.filter(function (p, idx) {
        return !p.dead
            && idx !== president_index
            && idx !== last_chancellor_index
            && (players.length === 5 || idx !== last_president_index);
    });
    var results = {};
    results[president.name] = { event: ClientProtocol.ClientEvent.NotifyPresident,
        otherPlayers: chancellorCandidates.map(function (p) { return p.name; }) };
    return players.filter(function (p, idx) { return idx !== president_index && !p.dead; })
        .reduce(function (results, p) {
        results[p.name] = {
            event: ClientProtocol.ClientEvent.NotifyNotPresident,
            president: president.name
        };
        return results;
    }, results);
}
exports.startRound = startRound;
function endRound() {
    gameLog.rounds.push(currentRound);
    currentRound = null;
}
exports.endRound = endRound;
function playerReady(name) {
    var player = players.find(function (p) { return p.name === name; });
    ready_to_play.push(player);
    if (ready_to_play.length === players.length) {
        president_index = 0;
        return startRound();
    }
    return {};
}
exports.playerReady = playerReady;
function advancePresident(brexit) {
    last_president_index = brexit ? null : president_index;
    do {
        president_index = (president_index + 1) % players.length;
    } while (players[president_index].dead);
}
exports.advancePresident = advancePresident;
function selectPresident(name) {
    currentRound.events.push({ event: GameEvent.PresidentSelect, name: name });
    last_president_index = president_index;
    president_index = players.findIndex(function (p) { return p.name === name; });
    endRound();
    return startRound();
}
exports.selectPresident = selectPresident;
function selectChancellor(name) {
    chancellor_index = players.findIndex(function (p) { return p.name === name; });
    return players.filter(function (p) { return !p.dead; })
        .reduce(function (results, player) {
        results[player.name] = {
            event: ClientProtocol.ClientEvent.StartVote,
            president: players[president_index].name,
            chancellor: players[chancellor_index].name,
            brexit: brexit_counter == 2
        };
        return results;
    }, {});
}
exports.selectChancellor = selectChancellor;
var yes_votes = 0;
var n_votes = 0;
var liberals_played = 0;
var fascists_played = 0;
var deck;
var discard_pile = new Array(13).fill(ClientProtocol.Card.Fascist)
    .concat(new Array(6).fill(ClientProtocol.Card.Liberal));
function initDeck() {
    deck = discard_pile;
    discard_pile = [];
    shuffle(deck);
}
initDeck();
function peekThree() {
    if (deck.length < 3) {
        initDeck();
    }
    return deck.slice(-3);
}
function drawThree() {
    if (deck.length < 3) {
        initDeck();
    }
    return [deck.pop(), deck.pop(), deck.pop()];
}
function drawCard() {
    if (deck.length < 3) {
        initDeck();
    }
    return deck.pop();
}
function sendToAll(event, payload) {
    if (payload === void 0) { payload = {}; }
    return players.reduce(function (results, p) {
        payload.event = event;
        results[p.name] = payload;
        return results;
    }, {});
}
function endGame(liberalWin) {
    endRound();
    gameLog.liberalWin = liberalWin;
    gameLog.liberalsPlayed = liberals_played;
    gameLog.fascistsPlayed = fascists_played;
    return sendToAll(ClientProtocol.ClientEvent.GameEnd, { winner: liberalWin ? ClientProtocol.Team.Liberal : ClientProtocol.Team.Fascist,
        otherPlayers: getPlayerNames() });
}
var liberalVictory = function () { return endGame(true); };
var fascistVictory = function () { return endGame(false); };
function investigationPower(name) {
    var targets = players.filter(function (p) {
        return !(p.name === name || p.beenInvestigated);
    }).map(function (p) { return p.name; });
    var result = {};
    result[name] = { event: ClientProtocol.ClientEvent.InvestigationPower, targets: targets };
    return result;
}
function selectPresidentPower(name) {
    var targets = players.filter(function (p) { return p.name !== name; })
        .map(function (p) { return p.name; });
    var result = {};
    result[name] = { event: ClientProtocol.ClientEvent.SelectPresidentPower, targets: targets };
    return result;
}
function peekCardPower(name) {
    currentRound.events.push({ event: GameEvent.Peek });
    var result = {};
    result[name] = { event: ClientProtocol.ClientEvent.PeekPower, cards: peekThree() };
    return result;
}
exports.peekCardPower = peekCardPower;
function kill(name) {
    currentRound.events.push({ event: GameEvent.Execution, name: name });
    var killed = players.find(function (p) { return name === p.name; });
    killed.dead = true;
    endRound();
    advancePresident(false);
    var results = startRound();
    results[killed.name] = { event: ClientProtocol.ClientEvent.Dead };
    return results;
}
exports.kill = kill;
function killPower(name) {
    var targets = players.filter(function (p) { return !(p.name === name || p.dead); })
        .map(function (p) { return p.name; });
    var result = {};
    result[name] = { event: ClientProtocol.ClientEvent.KillPower, targets: targets };
    return result;
}
function playCard(card, brexit) {
    currentRound.cardPlayed = card;
    if (card === ClientProtocol.Card.Liberal) {
        liberals_played += 1;
        if (liberals_played == 5) {
            return liberalVictory();
        }
    }
    else {
        fascists_played += 1;
        if (!brexit) {
            var p = players[president_index].name;
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
    endRound();
    advancePresident(false);
    return startRound();
}
exports.playCard = playCard;
function chancellorDiscard(card, remainder) {
    currentRound.chancellorDiscarded = (card === ClientProtocol.Card.Liberal &&
        remainder === ClientProtocol.Card.Fascist);
    discardCard(card);
}
exports.chancellorDiscard = chancellorDiscard;
function presidentDiscard(card, remainder) {
    currentRound.presidentDiscarded = (card === ClientProtocol.Card.Liberal &&
        remainder[0] === ClientProtocol.Card.Fascist &&
        remainder[1] === ClientProtocol.Card.Fascist);
    discardCard(card);
}
exports.presidentDiscard = presidentDiscard;
function discardCard(card) {
    discard_pile.push(card);
}
exports.discardCard = discardCard;
var n_kudos = 0;
function kudos(names) {
    n_kudos += 1;
    names.map(function (n) {
        if (gameLog.kudos[n] === undefined) {
            gameLog.kudos[n] = 1;
            return;
        }
        gameLog.kudos[n] += 1;
    });
    if (n_kudos === players.length) {
        GameDB.writeGameLog(gameLog);
    }
    return null;
}
exports.kudos = kudos;
function vote(name, vote) {
    var player = players.find(function (p) { return p.name === name; });
    player.vote = vote;
    player.voteHidden = true;
    if (vote)
        yes_votes += 1;
    n_votes += 1;
    var alive_players = players.reduce(function (acc, p) { return acc + (p.dead ? 0 : 1); }, 0);
    if (n_votes == alive_players) {
        currentRound = {
            president: players[president_index].name,
            chancellor: players[chancellor_index].name,
            votes: players.reduce(function (res, p) { res[p.name] = p.vote; return res; }, {}),
            events: []
        };
        //reveal votes
        players.map(function (p) { return p.voteHidden = false; });
        if (players[chancellor_index].role == Role.Hitler && fascists_played >= 3) {
            return fascistVictory();
        }
        if (yes_votes > alive_players / 2) {
            currentRound.wentThrough = true;
            yes_votes = 0;
            n_votes = 0;
            var nonActive = players.filter(function (p, idx) { return !(idx == president_index || idx == chancellor_index || p.dead); });
            var results_1 = {};
            results_1[players[president_index].name] = {
                event: ClientProtocol.ClientEvent.NotifyPresidentCards,
                cards: drawThree()
            };
            results_1[players[chancellor_index].name] = { event: ClientProtocol.ClientEvent.NotifyWaitForCards };
            nonActive.map(function (p) { return results_1[p.name] = { event: ClientProtocol.ClientEvent.NotifyWaitForPlay }; });
            brexit_counter = 0;
            return results_1;
        }
        else {
            currentRound.wentThrough = false;
            if (brexit_counter == 2) {
                currentRound.brexit = true;
                brexit_counter = 0;
                return playCard(drawCard(), true);
            }
            else {
                brexit_counter += 1;
            }
            yes_votes = 0;
            n_votes = 0;
            endRound();
            advancePresident(true);
            return startRound();
        }
    }
    return {};
}
exports.vote = vote;
function getState() {
    return {
        brexitCounter: brexit_counter,
        nLiberalsPlayed: liberals_played,
        nFascistsPlayed: fascists_played,
        nDiscarded: discard_pile.length,
        nInDeck: deck.length,
        players: players.map(function (p) {
            return { name: p.name, vote: p.vote, voteHidden: p.voteHidden, dead: p.dead };
        }),
        president: players[president_index].name,
        lastPresident: last_president_index == null ? null : players[last_president_index].name,
        chancellor: chancellor_index == null ? null : players[chancellor_index].name,
        lastChancellor: last_chancellor_index == null ? null : players[last_chancellor_index].name
    };
}
exports.getState = getState;
