'use strict';

const CONSTANTS = require('../constants');

function TorrentStatusProcessor(log, prom, dp) {

    this.log = log;
    this.Promise = prom;
    this.dp = dp;
}

module.exports = TorrentStatusProcessor;

module.exports.$name = 'TorrentStatusProcessor';
module.exports.$deps = ['Logger', 'Promise', 'DependencyResolver'];

TorrentStatusProcessor.prototype.process = function process (torrent, feed, subscription) {
    const self = this;

    // run all status_processors
    let startStatus = torrent.status,
        prom = self.Promise.resolve(torrent);

    if (subscription) {

        subscription.status_processors.forEach((proc) => {

            let tproc = self.dp.resolver(proc.name);

            // Should process torrent
            prom = prom.then((t) => {
                return tproc.validateSettings(proc.opts)
                    .then((opts) => {
                        return tproc.process(opts, t, feed, subscription);
                    });
            });
        });
    }

    feed.status_processors.forEach((proc) => {
        let tproc = self.dp.resolver(proc.name);

        // Should process torrent
        prom = prom.then((t) => {
            return tproc.validateSettings(proc.opts)
                .then((opts) => {
                    return tproc.process(opts, t, feed, subscription);
                });
        });
    });

    prom = prom.then((t) => {

        if (startStatus === t.status) {

            if (t.status === CONSTANTS.TORRENT_STATUS_NEW) {
                t.status = CONSTANTS.TORRENT_STATUS_PRE_PROCESS_COMPLETE;
                return self.process(t, feed, subscription);
            }

            if (t.status === CONSTANTS.TORRENT_STATUS_PRE_PROCESS_COMPLETE) {
                t.status = CONSTANTS.TORRENT_STATUS_READY_TO_DOWNLOAD_TORRENT;
                return self.process(t, feed, subscription);
            }

            return t;
        }
        return self.process(t, feed, subscription);
    });

    return prom.catch((e) => {
        self.log.error(e);
        throw e;
    });
};
