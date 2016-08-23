'use strict';

const CONSTANTS = require('../constants');

function TorrentTaskService (log, db, dp, fs, ss, ts, tsp, _) {

    this.log = log;
    this.db = db;
    this.dp = dp;
    this.fs = fs;
    this.ss = ss;
    this.ts = ts;
    this.tsp = tsp;
    this._ = _;
}

module.exports = TorrentTaskService;
module.exports.$name = 'TorrentTaskService';
module.exports.$deps = [
    'Logger',
    'Database',
    'DependencyResolver',
    'FeedService',
    'SubscriptionService',
    'TorrentService',
    'TorrentStatusProcessor',
    '_'
];

TorrentTaskService.prototype.checkTask = function checkTask () {

    const self = this;

    return self.ts.search({ status: CONSTANTS.TORRENT_STATUS_STILL_NEEDS_PROCESSING })
    .map((torrent) => {

        return self.expandTorrent(torrent);
    })
    .map((expanded) => {
        return self.tsp.process(expanded.torrent, expanded.feed, expanded.subscription);
    });
};

TorrentTaskService.prototype.downloadTask = function downloadTask () {

    const self = this;

    return self.ts.search({ status: [
        CONSTANTS.TORRENT_STATUS_FAILED_TO_DOWNLOAD_TORRENT,
        CONSTANTS.TORRENT_STATUS_READY_TO_DOWNLOAD_TORRENT
        ]
    })
    .map((torrent) => {

        return self.expandTorrent(torrent);
    })
    .map((expanded) => {

        if (!expanded.feed) {
            return;
        }

        let td,
            tdOpts = expanded.feed.torrent_downloader;

        td = self.dp.resolver(tdOpts.name);

        return td.validateSettings(tdOpts.opts)
            .then((opts) => {
                expanded.torrent.status = CONSTANTS.TORRENT_STATUS_CURRENTLY_DOWNLOADING_TORRENT;
                return td.download(opts, expanded.torrent);
            });
    })
    .then((torrents) => {
        if (torrents.length) {
            self.log.debug({ task: 'DownloadTask', success: true, count: torrents.length });
        }
    });
};

TorrentTaskService.prototype.expandTorrent = function expandTorrent (torrent) {


    const self = this;

    let ret = {
        torrent: torrent,
        feed: null,
        subscription: null
    };

    return self.fs.getById(torrent.feed_id)
        .then((feed) => {
            ret.feed = feed;

            return self.ss.getById(torrent.subscription_id);
        })
        .then((subscription) => {
            ret.subscription = subscription;

            return ret;
        });
};
