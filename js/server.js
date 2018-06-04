"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
nw.Window.open("./html/server.html");
module.paths.push('js');
var Hapi = require("hapi");
var Game = require("game");
var ClientProtocol = require("client-protocol");
var ServerProtocol = require("server-protocol");
var uiSocket;
var server = new Hapi.Server({
    port: 3000
});
function updateUI() {
    uiSocket.send({ event: ServerProtocol.ServerEvent.DisplayBoard, state: Game.getState() });
}
var sockets = {};
var lastMessages = {};
function sockToName(sock) {
    return Object.keys(sockets).find(function (key) { return sockets[key] === sock; });
}
function sendMessage(player, payload) {
    lastMessages[player] = payload;
    sockets[player].send(payload);
}
function sendMessages(messages) {
    Object.keys(messages).map(function (k) { return sendMessage(k, messages[k]); });
}
function handleClientAction(sock, payload) {
    switch (payload.action) {
        case ClientProtocol.ClientAction.Register: {
            sockets[payload['name']] = sock;
            var result = Game.register_player(payload.name);
            uiSocket.send({ event: ServerProtocol.ServerEvent.DisplayRegistered, names: Game.getPlayerNames() });
            if (result == Game.RegistrationResult.Success) {
                return true;
            }
            else if (result == Game.RegistrationResult.NameAlreadyUsed) {
                return "Name already in use";
            }
            else {
                return "No space left";
            }
        }
        case ClientProtocol.ClientAction.StartGame: {
            var results = Game.startGame();
            if (results != null) {
                updateUI();
                sendMessages(results);
                return true;
            }
            return false;
        }
        case ClientProtocol.ClientAction.Ready: {
            sendMessages(Game.playerReady(sockToName(sock)));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.SelectChancellor: {
            sendMessages(Game.selectChancellor(payload.name));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.SelectPresident: {
            sendMessages(Game.selectPresident(payload.name));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.Vote: {
            sendMessages(Game.vote(sockToName(sock), payload.vote));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.Discard: {
            Game.discardCard(payload['discard']);
            sendMessage(Game.getChancellorName(), { event: ClientProtocol.ClientEvent.NotifyChancellorCards,
                cards: payload['remainder'] });
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.Play: {
            Game.discardCard(payload['discard']);
            sendMessages(Game.playCard(payload['play'], false));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.Kill: {
            sendMessages(Game.kill(payload['name']));
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.Investigate: {
            return Game.investigate(payload['name']);
        }
        case ClientProtocol.ClientAction.InvestigationComplete: {
            Game.endRound();
            Game.advancePresident(false);
            sendMessages(Game.startRound());
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.PeekComplete: {
            Game.endRound();
            Game.advancePresident(false);
            sendMessages(Game.startRound());
            updateUI();
            return null;
        }
        case ClientProtocol.ClientAction.GetPlayerList: {
            return Game.getPlayerNames();
        }
        case ClientProtocol.ClientAction.Reconnect: {
            sockets[payload.name] = sock;
            sock.send(lastMessages[payload.name]);
            return null;
        }
    }
}
var init = function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, server.register(require('inert'))];
            case 1:
                _a.sent();
                return [4 /*yield*/, server.register(require('nes'))];
            case 2:
                _a.sent();
                server.route({
                    method: 'GET',
                    path: '/',
                    handler: function (request, h) {
                        if (Game.gameOngoing()) {
                            return h.file('./html/client-ongoing.html');
                        }
                        return h.file('./html/client.html');
                    }
                });
                server.route({
                    method: 'GET',
                    path: '/js/{param*}',
                    handler: {
                        directory: {
                            path: './js'
                        }
                    }
                });
                server.route({
                    method: 'GET',
                    path: '/node_modules/react/{param*}',
                    handler: {
                        directory: {
                            path: './node_modules/react'
                        }
                    }
                });
                server.route({
                    method: 'GET',
                    path: '/assets/{param*}',
                    handler: {
                        directory: {
                            path: './assets'
                        }
                    }
                });
                server.route({
                    method: 'GET',
                    path: '/node_modules/react-dom/{param*}',
                    handler: {
                        directory: {
                            path: './node_modules/react-dom'
                        }
                    }
                });
                server.route({
                    method: 'GET',
                    path: '/register_ui',
                    handler: function (request, h) {
                        uiSocket = request.socket;
                        return null;
                    }
                });
                server.route({
                    method: 'POST',
                    path: '/client_action',
                    handler: function (request, h) {
                        return handleClientAction(request.socket, request.payload);
                    }
                });
                return [4 /*yield*/, server.start()];
            case 3:
                _a.sent();
                console.log("Server running at: " + server.info.uri);
                return [2 /*return*/];
        }
    });
}); };
init();
module.exports = 0;
