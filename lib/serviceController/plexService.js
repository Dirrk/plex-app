'use strict';

const util = require('util'),
    EventEmitter = require('events').EventEmitter;

function PlexService(log, db, prom, dp) {

    this.log = log;
    this.db = db;
    this.Promise = prom;
    this.dp = dp;

    this.status = 0;
    this.timeout = null;
    this.interval = 60 * 1000;

    this.__last_run__ = 0;
    this.__activated__ = false;
    EventEmitter.call(this);
}

util.inherits(PlexService, EventEmitter);

module.exports = PlexService;
module.exports.$name = 'PlexServiceController';
module.exports.$deps = ['Logger', 'Database', 'Promise', 'DependencyResolver'];

PlexService.prototype.start = function start() {

    const self = this;

    let settings;

    settings = self.db.settings.findOne({ key: { $eq: 'plex'}});

    self.status = 1;
    self.__activated__ = true;
    self.__last_run__ = settings.last_run;
    self.settings = settings;

    self.interval = settings.frequency;

    self.log.info({ service: 'plex', status: 'started'});

    return self.task();
};

PlexService.prototype.stop = function stop() {
    this.__activated__ = false;
    this.status = 2;

    if (this.timeout !== null) {
        clearTimeout(this.timeout);
    }
    return this.Promise.resolve();
};

PlexService.prototype.task = function task() {

    const self = this;

    self.log.debug({ service: 'plex', status: 'running scheduled task'});

    let mapper = self.dp.resolver('PlexMappingService');

    mapper.plex.host = self.settings.host;
    mapper.plex.port = self.settings.port;

    return self.Promise.all(
        [
            mapper.mapSections(),
            mapper.mapShows(),
            mapper.mapMovies()
        ]
    )
    .then(() => {
        return self.db.forceSave();
    })
    .then(() => {
        self.timeout = setTimeout(() => self.task(), self.interval);
    });
};
