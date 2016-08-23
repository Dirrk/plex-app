'use strict';

const path = require('path'),
    url = require('url'),
    fs = require('fs'),
    CONSTANTS = require('../constants'),
    internals = {};

function LinkDownloader(log, wreck, _, prom, joi, fs, bencode) {
    this.log = log;
    this.Wreck = wreck;
    this._ = _;
    this.Promise = prom;
    this.Joi = joi;
    this.fs = fs;
    this.Bencode = bencode;
}

module.exports = LinkDownloader;
module.exports.$name = 'LinkDownloader';
module.exports.$deps = ['Logger', 'Wreck', '_', 'Promise', 'Joi', 'FileService', 'BencodeAdapter'];

LinkDownloader.prototype.download = function download(opts, torrent) {

    const self = this;

    let requestOptions = {};

    if (opts.headers) {
        requestOptions.headers = opts.headers;
    }

    if (!torrent.file) {

        let p = url.parse(torrent.url);

        p = p.pathname || torrent.id + '.torrent';

        p = self._.last(p.split('/'));

        torrent.file = path.join(opts.download_directory, '.', p);
    }

    return self.Wreck.getAsync(torrent.url, requestOptions)
        .spread((resp, payload) => {

            if (resp.statusCode !== 200) {
                throw new Error('Bad status code for torrent: ' + torrent.url + ' statusCode: ' + resp.statusCode);
            }

            self.log.debug({ func: 'LinkDownloader.download', file: torrent.file, size: payload.length});

            return fs.writeFileAsync(torrent.file, payload, undefined)
                .then(() => payload);
            })
            .then((payload) => {
                return self.Bencode.decodeString(payload);
            })
            .then((payload) => {

                torrent.meta_data.raw_data = self._.omit(payload.info, ['piece length', 'pieces']);
                torrent.status = CONSTANTS.TORRENT_STATUS_DOWNLOADED_TORRENT;
                torrent.status_time = Date.now();

                self.log.debug({ torrent: torrent, success: true });
                self.log.info({ torrent_downloaded: torrent, success: true });

                return torrent;
            })
            .catch((e) => {

                self.log.error(e);

                if (!torrent.meta_data.download_failed) {

                    torrent.status_time = Date.now();
                    torrent.meta_data.download_failed = 0;
                }

                torrent.meta_data.download_failed++;

                torrent.status = CONSTANTS.TORRENT_STATUS_FAILED_TO_DOWNLOAD_TORRENT;

                if (opts.retry_times && opts.retry_times <= torrent.meta_data.download_failed) {

                    torrent.status_time = Date.now();
                    torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOAD_RETRY_FAILED;
                }

                if (opts.retry_duration_in_minutes) {

                    if (Date.now() - torrent.status_time > opts.retry_duration_in_minutes * 60000) {
                        torrent.status = CONSTANTS.TORRENT_STATUS_TORRENT_DOWNLOAD_RETRY_FAILED;
                    }
                }

                if (opts.status !== CONSTANTS.TORRENT_STATUS_FAILED_TO_DOWNLOAD_TORRENT) {
                    self.log.info({ torrent: torrent, success: false, retry: false });
                } else {
                    self.log.debug({ torrent: torrent, success: false, retry: true });
                }

                return torrent;
            });
};

LinkDownloader.prototype.validateSettings = function validateSettings (settings) {

    const Promise = this.Promise,
    Joi = this.Joi;

    let result = Joi.validate(settings, internals.validation(Joi), internals.joiOpts);

    if (result.error) {
        return Promise.reject(result.error);
    }

    settings = result.value;

    return this.fs.verifyDirectory(settings.download_directory)
        .then((dirResult) => {

            if (!dirResult.success) {
                throw new Error('Directory "' + dirResult.directory + '" failed verification with reason: ' + dirResult.message);
            }

            return settings;
        });
};

internals.joiOpts = { allowUnknown: true };

internals.validation = function validation(Joi) {

    return Joi.object().keys({
        download_directory: Joi.string().required(),
        headers: Joi.object(),
        retry_times: Joi.number().default(3),
        retry_duration_in_minutes: Joi.number().default(0)
    });
};
