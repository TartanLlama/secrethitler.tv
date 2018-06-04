"use strict";

declare var nw: any;
nw.Window.open("./html/server.html")

module.paths.push('js')

export = 0;
import * as Hapi from 'hapi'
import * as Nes from 'nes'
import * as Boom from 'boom'
import * as Game from 'game'
import * as ClientProtocol from 'client-protocol'
import * as ServerProtocol from 'server-protocol'

var uiSocket: Nes.Socket;

const server = new Hapi.Server({
    port: 3000
});

function updateUI() {
    uiSocket.send({event: ServerProtocol.ServerEvent.DisplayBoard, state: Game.getState()});
}

let sockets = {};
let lastMessages = {};

function sockToName (sock: Nes.Socket) {
    return Object.keys(sockets).find(key => sockets[key] === sock);    
}

function sendMessage (player: string, payload: ClientProtocol.Payload) {
    lastMessages[player] = payload;
    sockets[player].send(payload);
}

function sendMessages (messages: Game.GameActionResults) {
    Object.keys(messages).map(k => sendMessage(k, messages[k]));
}

function handleClientAction (sock: Nes.Socket, payload: ClientProtocol.ActionPayload) {
    switch (payload.action) {
        case ClientProtocol.ClientAction.Register: {
            sockets[payload['name']] = sock;
            const result = Game.register_player(payload.name);
            uiSocket.send({event: ServerProtocol.ServerEvent.DisplayRegistered, names: Game.getPlayerNames()});

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
            const results = Game.startGame();
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
            sendMessage(Game.getChancellorName(),
                        {event: ClientProtocol.ClientEvent.NotifyChancellorCards,
                         cards: payload['remainder']});
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

const init = async () => {
    await server.register(require('inert'));
    await server.register(require('nes'));

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
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
                path: './js',
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/node_modules/react/{param*}',
        handler: {
            directory: {
                path: './node_modules/react',
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/assets/{param*}',
        handler: {
            directory: {
                path: './assets',
            }
        }
    });
    
    server.route({
        method: 'GET',
        path: '/node_modules/react-dom/{param*}',
        handler: {
            directory: {
                path: './node_modules/react-dom',
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/register_ui',
        handler: (request, h) => {
            uiSocket = request.socket;
            return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/client_action',
        handler: (request, h) => {
            return handleClientAction(request.socket, request.payload as ClientProtocol.ActionPayload);
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();
