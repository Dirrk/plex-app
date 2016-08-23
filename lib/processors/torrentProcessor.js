'use strict';

function TorrentProcessor(log, prom, dp) {

    this.log = log;
    this.Promise = prom;
    this.dp = dp;
}

module.exports = TorrentProcessor;

module.exports.$name = 'TorrentProcessor';
module.exports.$deps = ['Logger', 'Promise', 'DependencyResolver'];

TorrentProcessor.prototype.processMatches = function processMatches (subscription, items) {
    const self = this;

    // run all torrent_processors
    let prom = self.Promise.resolve(items);

    subscription.torrent_processors.forEach((proc) => {

        let tproc = self.dp.resolver(proc.name);

        // Should process each remaining item and return all items
        prom = prom.then(tproc.process.bind(tproc, subscription, proc.opts));
    });

    return prom.catch((e) => {
        self.log.error(e);
        throw e;
    });
};
