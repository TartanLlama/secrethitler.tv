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
    

    
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};


process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();


