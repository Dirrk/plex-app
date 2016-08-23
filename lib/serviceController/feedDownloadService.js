'use strict';

const EventEmitter = require('events').EventEmitter,
    util = require('util');

function FeedDownloadService(log, db, prom, fs, dp, fts, tts) {
    this.log = log;
    this.db = db;
    this.Promise = prom;
    this.fs = fs;
    this.dp = dp;
    this.tts = tts;
    this.fts = fts;


    this.tasks = {
        main: {
            interval: 5 * 60 * 1000,
            timeout: null
        },
        check_feeds: {
            interval: 30 * 1000,
            timeout: null
        },
        download_torrents: {
            interval: 30 * 1000,
            timeout: null
        },
        check_torrents: {
            interval: 60 * 1000,
            timeout: null
        },
        sync_subs: {
            interval: 4 * 60 * 60 * 1000,
            timeout: null
        }
    };

    this.status = 0;

    EventEmitter.call(this);
}

util.inherits(FeedDownloadService, EventEmitter);

module.exports = FeedDownloadService;

module.exports.$name = 'FeedDownloadServiceController';
module.exports.$deps = [
    'Logger',
    'Database',
    'Promise',
    'FileService',
    'DependencyResolver',
    'FeedTaskService',
    'TorrentTaskService'
];

FeedDownloadService.prototype.start = function start() {

    // Setup settings / database if needed
    // Start running task

    const self = this;

    self.status = 1;

    self.task();

    return self.Promise.resolve();

};

FeedDownloadService.prototype.stop = function stop() {

    this.status = 2;

    clearTimeout(this.tasks.main.timeout);

    if (this.tasks.check_feeds.timeout) {

        clearTimeout(this.tasks.check_feeds.timeout);
    }
    if (this.tasks.download_torrents.timeout) {

        clearTimeout(this.tasks.download_torrents.timeout);
    }
    if (this.tasks.check_torrents.timeout) {

        clearTimeout(this.tasks.check_torrents.timeout);
    }
    if (this.tasks.sync_subs.timeout) {

        clearTimeout(this.tasks.sync_subs.timeout);
    }

    return this.Promise.resolve();
};

// FeedDownloadService.prototype.verifySettings = function verifySettings(settings, plexSettings) {
//
//     const self = this;
//
//     self.plex_settings = { host: plexSettings.host, port: plexSettings.port };
//
//     return self.Promise.all(
//         [
//             self.fs.verifyDirectory(settings.incoming_directory),
//             self.fs.verifyDirectory(settings.download_directory),
//             self.fs.verifyDirectory(settings.complete_directory),
//             self.fs.verifyExecutable(settings.unrar_location)
//         ]
//     ).then((checks) => {
//         if (!checks[0].success) {
//             throw new Error('Incoming directory not setup cannot work');
//         }
//         if (checks[1].success) {
//             self.__use_download_dir__ = true;
//         }
//         if (checks[2].success) {
//             self.__use_complete_dir__ = true;
//             self.__move_completed__ = true;
//         }
//         if (checks[3].success) {
//             self.__use_unrar__ = true;
//         }
//         self.settings = settings;
//     });
// };


FeedDownloadService.prototype.task = function task() {

    const self = this;

    if (self.tasks.check_feeds.timeout === null) {
        self.checkFeedsTask();
    }
    if (self.tasks.sync_subs.timeout === null) {
        self.subscriptionSyncTask();
    }
    if (self.tasks.check_torrents.timeout === null) {
        self.checkTorrentsTask();
    }
    if (self.tasks.download_torrents.timeout === null) {
        self.downloadTorrentsTask();
    }

    self.tasks.main.timeout = setTimeout(() => self.task(), self.tasks.main.interval);

};

FeedDownloadService.prototype.checkFeedsTask = function checkFeedsTask() {

    // Retrieve feeds and parse each feed
    // Iterate over for matches

    const self = this;

    self.log.debug({ task: 'checkFeedsTask', status: 'running'});

    return self.fts.runTask()
        .catch((e) => {
            self.log.error(e);
        })
        .then(() => {
            self.tasks.check_feeds.timeout = setTimeout(() => self.checkFeedsTask(), self.tasks.check_feeds.interval);
        });
};

FeedDownloadService.prototype.checkTorrentsTask = function checkTorrentsTask() {

    // Iterate over torrents and verify incomplete status torrents

    const self = this;

    self.log.debug({ task: 'checkTorrentsTask', status: 'running'});
    // Executed during torrent job performs checks on torrent status should always check torrent status before continuing
    // status_processors
    return self.tts.checkTask()
        .catch((e) => {
            self.log.error(e);
        })
        .then(() => {
            self.tasks.check_torrents.timeout = setTimeout(() => self.checkTorrentsTask(), self.tasks.check_torrents.interval);
        });
};

FeedDownloadService.prototype.downloadTorrentsTask = function downloadTorrentsTask() {

    // Iterate over torrents and download them

    const self = this;

    self.log.debug({ task: 'downloadTorrentsTask', status: 'running'});

    return self.tts.downloadTask()
        .catch((e) => {
            self.log.error(e);
        })
        .then(() => {
            self.tasks.download_torrents.timeout = setTimeout(() => self.downloadTorrentsTask(), self.tasks.download_torrents.interval);
        });
};

// Feel like this should be outside of this
FeedDownloadService.prototype.subscriptionSyncTask = function subscriptionSyncTask() {

    const self = this;
    // Fetch plex shows and add any new shows
    let plexSubService = self.dp.resolver('PlexSubscriptionService'),
        subService = self.dp.resolver('SubscriptionService');

    self.log.debug({ task: 'subscriptionSyncTask', status: 'running'});

    return plexSubService.findTVShowsWithoutSubscription()
        .map(plexSubService.createSubscriptionFromShow.bind(plexSubService))
        .map((sub) => {
            return subService.upsert(sub);
        })
        .then((ret) => {
            self.db.forceSave();
            self.log.info({ task: 'subscriptionSyncTask', showsSynced: ret.length});
        })
        .catch((e) => {
            self.log.error(e);
        })
        .then(() => {
            self.tasks.sync_subs.timeout = setTimeout(() => self.subscriptionSyncTask(), self.tasks.sync_subs.interval);
        });
};
