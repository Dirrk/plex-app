'use strict';

const path = require('path'),
    pkg = require('../package.json'),
    internals = {
        collections: {}
    };

// Plex Data
internals.collections.plex_sections = { unique: ['id'], indicies: ['id', 'type'] };
internals.collections.plex_tv_shows = { unique: ['key'], indicies: ['key'] };
internals.collections.plex_tv_episodes = { unique: ['key'], indicies: ['key', 'seasonKey'] };
internals.collections.plex_movies = { unique: ['key'], indicies: ['key'] };

// Subscriptions
internals.collections.feeds = { unique: ['id'], indicies: ['id', 'name'] };
internals.collections.subscriptions = { unique: ['id'], indicies: ['id', 'plexKey'] };
internals.collections.torrents = { unique: ['id'], indicies: ['id', 'status'] };

/**
 * DataAdapter - Data Adapter for accessing db and collections
 * @constructor
 *
 * @param  {Winston.Logger} log Logger
 * @param  {Loki} db Loki Database thats been loaded
 */
function DataAdapter (log, db) {

    let settings = db.getCollection('settings');

    if (settings === null) {
        settings = db.addCollection('settings', { unique: ['key'], indicies: ['key'] });
        settings.insert({ key: 'version', value: 'init'});
    }

    this.version = settings.findOne({ key: { $eq: 'version'} }).value;
    this.settings = settings;
    this.__db__ = db;
    this.log = log;
}

module.exports = DataAdapter;

DataAdapter.prototype.setup = function setup () {

    const self = this;

    if (self.version === 'init') {

        console.log('init');

        let defaultDir = path.resolve(__dirname, '../data/'),
            ver = self.settings.findOne({ key: { $eq: 'version' }});

        ver.value = pkg.version;

        self.settings.insert({ key: 'log', level: 'info' });
        self.settings.insert({ key: 'autostart', web: true, plex: true, downloader: true });
        self.settings.insert({ key: 'web', host: 'localhost', port: '3000', address: '0.0.0.0' });
        self.settings.insert({ key: 'plex', host: 'localhost', frequency: 4 * 60 * 60 * 1000, port: 32400, last_run: 0 });
        self.settings.insert(
            {
                key: 'downloader',
                frequency: 60 * 1000,
                last_run: 0,
                incoming_directory: path.resolve(defaultDir, './incoming'),
                download_directory: path.resolve(defaultDir, './download'),
                complete_directory: path.resolve(defaultDir, './complete'),
                unrar_location: '/usr/bin/unrar'
            }
        );
    }
};


DataAdapter.prototype.getCollection = function getCollection (collectionName) {

    const self = this;

    let coll = self.__db__.getCollection(collectionName);

    if (coll === null) {
        coll = self.__db__.addCollection(collectionName, internals.collections[coll]);
    } else {
        return coll;
    }

    self.__db__.save();
    return coll;
};

DataAdapter.prototype.forceSave = function forceSave () {
    this.__db__.save();
};
