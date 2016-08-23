'use strict';

const Loki = require('lokijs'),
    winston = require('winston'),
    Wreck = require('wreck'),
    Joi = require('joi'),
    xml2js = require('xml2js'),
    bencode = require('bencode'),
    fs = require('fs'),
    BPromise = require('bluebird'),
    DataAdapter = require('./dataAdapter'),
    dp = require('deepen')(),
    _ = require('lodash'),
    internals = {};

internals.dbSettings = {
    autosave: true,
    autosaveInterval: 60 * 1000,
    autoload: false,
    env: 'NODEJS'
};

// Promisify
BPromise.config({
    cancellation: true
});

BPromise.promisifyAll(fs);

// Promisify Wreck.get
Wreck.getAsync = (function (uri, options) {

    return new BPromise((resolve, reject) => {

        Wreck.get(uri, options, (err, response, payload) => {
            if (err) {
                return reject(err);
            }
            resolve([response, payload]);
        });
    });
}).bind(Wreck);

// Promisify xml2js
xml2js.parseAsync = (function (xml, opts) {
    return new BPromise((resolve, reject) => {

        xml2js.parseString(xml, opts, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}).bind(xml2js);

// Add dependencies
dp.add(BPromise, { $name: 'Promise', $deps: [], $single: true});
dp.add(Wreck, { $name: 'Wreck', $deps: [], $single: true});
dp.add(_, { $name: '_', $deps: [], $single: true});
dp.add(xml2js, { $name: 'xml2js', $deps: [], $single: true});
dp.add(Joi, { $name: 'Joi', $deps: [], $single: true});
dp.add(bencode, { $name: 'Bencode', $deps: [], $single: true});
dp.add(require('./web'));
dp.add(require('./services'));
dp.add(require('./serviceController'));
dp.add(require('./scorers'));
dp.add(require('./processors'));
dp.add(require('./filters'));
dp.add(require('./feedParsers'));
dp.add(require('./feedAdapters'));
dp.add(require('./adapters'));
dp.add(require('./mappers'));
dp.add(require('./downloaders'));
dp.add(require('./statusProcessors'));


/**
 * PlexApp - Run once to initiate the database and the following services (db / webapp / plexsync / downloader)
 * @static
 *
 * @param  {object} settings command line settings
 * @param  {string} settings.db location of database
 * @param  {boolean} settings.verbose force log level to debug
 */
function PlexApp(settings) {

    // Setup the database
    return fs.statAsync(settings.db)
        .catch((e) => {
            return fs.writeFileAsync(settings.db, '{}', 'utf8')
                .then(() => {
                    return fs.statAsync(settings.db);
                });
        })
        .then((stats) => {

            if (stats.size === 0) {
                internals.exit(7, new Error('Potential database corruption'));
            }
            return fs.accessAsync(settings.db, fs.W_OK);
        })
        .then(() => {

            const db = new Loki(settings.db, internals.dbSettings);

            // Load Database
            db.loadDatabase({}, (err) => {
                if (err) {
                    return internals.exit(1, err);
                }

                let sc,
                    logSettings,
                    logLevel = 'info',
                    da = new DataAdapter(winston, db);

                // Initialize settings
                da.setup();

                // Setup the logger
                logSettings = da.settings.findOne({ key: { $eq: 'log'}});

                if (settings.verbose) {
                    logLevel = 'debug';
                } else if (logSettings) {
                    logLevel = logSettings.level;
                }

                winston.level = logLevel;

                // Finish setting up dependency injection
                dp.add(winston, { $name: 'Logger', $deps: [], $single: true});
                dp.add(da, { $name: 'Database', $deps: [], $single: true});

                dp.finish();

                sc = dp.resolver('ServiceController');

                return sc.startAll()
                    .catch((e) => {
                        internals.exit(5, e);
                    });
            });
        });
}

module.exports = PlexApp;

/**
 * Exit application
 * @param  {[number]} status status number to exit with
 * @param  {[Error]} err    Error to log out
 */
internals.exit = function exit(status, err) {
    if (!status) {
        process.exit(0);
    }

    if (err) {
        winston.error(err);
    }
    process.exit(status);
};
