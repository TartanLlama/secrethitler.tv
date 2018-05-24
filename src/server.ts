"use strict";

module.paths.push('js')

export = 0;
import * as Hapi from 'hapi'
import * as Nes from 'nes'
import * as Boom from 'boom'
import * as Game from 'game'
import * as ClientProtocol from 'client-protocol'
import * as ServerProtocol from 'server-protocol'
declare var nw: any;

var uiSocket: Nes.Socket;

nw.Window.open("./html/server.html")

const server = new Hapi.Server({
    port: 3000,
    host: 'localhost'
});

function updateUI() {
  console.log(Game.getState());
  uiSocket.send({event: ServerProtocol.ServerEvent.DisplayBoard, state: Game.getState()});
}


const init = async () => {
    await server.register(require('inert'));
    await server.register(require('nes'));

    server.route({
        method: 'GET',
        path: '/',
        handler: {
            file: './html/client.html'
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
        path: '/register',
        handler: (request, h) => {
          const success = Game.register_player({socket: request.socket, name: request.payload['name']});
          uiSocket.send({event: ServerProtocol.ServerEvent.DisplayRegistered, names: Game.getPlayerNames()});
          return success;
        }
    });
    server.route({
        method: 'GET',
        path: '/start_game',
        handler: (request, h) => {
          const success = Game.startGame();
          if (success) {
            updateUI();
          }
          return success;
        }
    });

    server.route({
        method: 'GET',
        path: '/ready_to_play',
        handler: (request, h) => {
          let shouldStart =  Game.playerReady(request.socket);
          if (shouldStart) {
             server.broadcast({event: ClientProtocol.ClientEvent.AllReady});
          }
          return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/select_chancellor',
        handler: (request, h) => {
          Game.selectChancellor(request.payload['name']);
          updateUI();
          return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/vote',
        handler: (request, h) => {
          Game.vote(request.socket, request.payload['vote']);
          updateUI();
          return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/discard',
        handler: (request, h) => {
          Game.discardCard(request.payload['discard']);
          Game.getChancellorSocket().send({event: ClientProtocol.ClientEvent.NotifyChancellorCards,
                                           cards: request.payload['remainder']});
          updateUI();
          return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/investigate',
        handler: (request, h) => {
          return Game.investigate(request.payload['name']);
        }
    });

    server.route({
        method: 'GET',
        path: '/investigation_complete',
        handler: (request, h) => {
          Game.advancePresident();
          Game.startRound();
          updateUI();
          return null;
        }
    });

    server.route({
        method: 'POST',
        path: '/play',
        handler: (request, h) => {
          const shouldWait = Game.playCard(request.payload['play'], false);
          Game.discardCard(request.payload['discard']);
          if (shouldWait) {
            updateUI();
            return null;
          }
          Game.advancePresident();          
          Game.startRound();
          updateUI();
          return null;
        }
    });


    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();
