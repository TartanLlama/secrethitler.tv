"use strict";

module.paths.push('js')

export = 0;
import * as Hapi from 'hapi'
import * as Boom from 'boom'
import * as Users from 'users'
declare var nw: any;

nw.Window.open("./html/server.html")

const server = new Hapi.Server({
    port: 3000,
    host: 'localhost'
});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {

        return 'Hello, world!';
    }
});

server.route({
    method: 'GET',
    path: '/register',
    handler: (request, h) => {
        let success = Users.register_player({ip: request.info.remoteAddress, name: request.query["name"]});
        if (success) return null;
        return Boom.conflict('too many players registered');
    }
});

server.route({
    method: 'GET',
    path: '/unregister',
    handler: (request, h) => {
        Users.unregister_player(request.info.remoteAddress);
        return null;
    }
});

server.route({
    method: 'GET',
    path: '/start-game',
    handler: (request, h) => {
        
    }
});

const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};


process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();


