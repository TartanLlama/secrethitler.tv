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
        method: 'POST',
        path: '/register',
        handler: (request, h) => {
          console.log(request);
          return Users.register_player({socket: request.socket, name: request.payload['name']});
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();
