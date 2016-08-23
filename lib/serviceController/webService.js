'use strict';

const Hapi = require('hapi'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function WebService(log, db, prom, _, dp) {

    this.log = log;
    this.db = db;
    this.Promise = prom;
    this._ = _;
    this.dp = dp;
    this.server = undefined;

    this.status = 0;

    EventEmitter.call(this);
}

util.inherits(WebService, EventEmitter);

module.exports = WebService;

module.exports.$name = 'WebServiceController';
module.exports.$deps = ['Logger', 'Database', 'Promise', '_', 'DependencyResolver'];

WebService.prototype.start = function start() {

    const self = this;

    let server,
        settings;

    settings = self._.omit(self.db.settings.findOne({ key: { $eq: 'web'}}), ['meta', '$loki']);

    server = new Hapi.Server();

    server.connection(
        {
            host: settings.host || 'localhost',
            port: settings.port || 3000,
            address: settings.address || '0.0.0.0',
            routes: {
                validate: {
                    options: {
                        allowUnknown: true
                    }
                }
            }
        }
    );

    return self.Promise.resolve()
    .then(() => {
        server.register(
            [
                // Auto docs
                require('vision'),
                require('inert'),
                {
                    register: require('lout'),
                    options: {
                        endpoint: '/api/docs'
                    }
                }
            ]
        );
    })
    .then(() => {

        let web = self.dp.resolver('WebModule');

        self.server = server;

        server.views({
            engines: { hbs: require('handlebars') },
            path: __dirname + '/../web/templates'
        });

        server.bind(
            {
                log: self.log,
                db: self.db,
                dp: self.dp
            }
        );

        server.route(web.routes);

        return server.start();

    })
    .then(() => {

        self.status = 1;
        self.log.info({ service: 'web', status: 'started'});
    });
};

WebService.prototype.stop = function stop() {

    this.status = 2;
    return this.server.stop();
};
