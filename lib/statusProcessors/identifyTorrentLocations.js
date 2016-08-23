'use strict';

const CONSTANTS = require('../constants'),
    path = require('path');

function IdentifyTorrentLocationsStatusProcessor(log, prom, fs, joi, _) {

    this.log = log;
    this.Promise = prom;
    this.fs = fs;
    this.Joi = joi;
    this._ = _;
}

module.exports = IdentifyTorrentLocationsStatusProcessor;

module.exports.$name = 'IdentifyTorrentLocationsStatusProcessor';
module.exports.$deps = ['Logger', 'Promise', 'FileService', 'Joi', '_'];


/**
 * Process - Identify Torrent Locations
 *
 *
 * @param  {object} opts      options
 * @param  {string} opts.download_directory      options
 * @param  {string} opts.complete_directory      options
 * @param  {Torrent} torrent      the torrent being processed
 * @param  {Feed} feed         the feed the torrent came from
 * @param  {Subscription} subscription the subscription the torrent came from if applicable
 * @return {Torrent}              returns the modified torrent
 */
IdentifyTorrentLocationsStatusProcessor.prototype.process = function process(opts, torrent, feed, subscription) {

    const self = this,
        _ = self._;

    let prom = self.Promise.resolve(torrent);

    switch (torrent.status) {
        case CONSTANTS.TORRENT_STATUS_DOWNLOADED_TORRENT:
            break;
        case CONSTANTS.TORRENT_STATUS_TORRENT_ACTIVE:
            break;
        case CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOADING:
            break;
        default:
            return self.Promise.resolve(torrent);
    }

    if (!torrent.meta_data.torrent_download_file) {
        torrent.meta_data.itlsp = {};
        torrent.meta_data.torrent_download_file = _.get(torrent, 'meta_data.raw_data.name');
    }

    if (torrent.status === CONSTANTS.TORRENT_STATUS_DOWNLOADED_TORRENT && torrent.file) {
        prom = prom.then(() => {
            return self.fs.verifyExist(torrent.file)
                .then((res) => {
                    if (res.success === false) {
                        torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_ACTIVE;
                        torrent.status_time = Date.now();
                    }
                    return torrent;
                });
        });
    }

    if (opts.download_directory && torrent.meta_data.torrent_download_file) {
        prom = prom.then(() => {
            return self.fs.verifyExist(path.join(opts.download_directory, torrent.meta_data.torrent_download_file));
        })
        .then((res) => {
            if (res.success === true && torrent.status !== CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOADING) {
                torrent.meta_data.itlsp.dd = true;
                torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOADING;
                torrent.status_time = Date.now();
            } else if (res.success === false && torrent.status === CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOADING && _.get(torrent, 'meta_data.itlsp.dd')) {
                torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_COMPLETED;
                torrent.status_time = Date.now();
            }
            return torrent;
        });
    }

    if (opts.complete_directory && torrent.meta_data.torrent_download_file) {
        prom = prom.then(() => {
            return self.fs.verifyExist(path.join(opts.complete_directory, torrent.meta_data.torrent_download_file));
        })
        .then((res) => {
            if (res.success === true && torrent.status !== CONSTANTS.TORRENT_STATUS_TORRENT_COMPLETED) {
                torrent.meta_data.itlsp.cd = true;
                torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_COMPLETED;
                torrent.status_time = Date.now();
            }
            return torrent;
        });
    }

    prom = prom.then((t) => {
        return t;
    });

    return prom;
};

IdentifyTorrentLocationsStatusProcessor.prototype.validateSettings = function validateSettings(opts) {

    return this.Promise.resolve(opts);
};
