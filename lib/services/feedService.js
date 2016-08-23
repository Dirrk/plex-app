'use strict';

const Feed = require('../models').Feed;

function FeedService (log, db, prom, _, dp) {
    this.log = log;
    this.db = db;
    this.Promise = prom;
    this._ = _;
    this.dp = dp;

    this.feeds = db.getCollection('feeds');
}

module.exports = FeedService;
module.exports.$name = 'FeedService';
module.exports.$deps = ['Logger', 'Database', 'Promise', '_', 'DependencyResolver'];

// Returns a single feed
FeedService.prototype.getById = function getById(id) {

    return this.Promise.resolve(this.feeds.findOne({ id: { $eq: id }}));

};
// Returns all feeds
FeedService.prototype.search = function search(options) {

    const self = this;

    let query;

    if (options) {
        query = [];
    }

    if (options.enabled === false) {
        query.push({ enabled: { $eq: false }});
    }
    if (options.enabled === true) {
        query.push({ enabled: { $eq: true }});
    }
    if (options.name) {
        query.push({ name: { $regex: new RegExp('.*' + options.name + '.*')}});
    }

    if (query && query.length === 0) {
        query = undefined;
    }
    if (query && query.length === 1) {
        query = query[0];
    }
    if (query && query.length > 1) {
        query = {
            $and: query
        };
    }

    return self.Promise.resolve(self.feeds.find(query));
};

// Returns a single feed
FeedService.prototype.upsert = function upsert(feed) {

    const self = this;

    let prom = self.Promise.resolve();

    if (feed.feed_adapter) {

        let fa = self.dp.resolver(feed.feed_adapter.name);

        if (!fa) {
            return self.Promise.reject(new Error('Unrecognized Feed Adapter (' + feed.feed_adapter.name + ')'));
        }

        prom = prom.then(() => fa.validateSettings(feed.feed_adapter.opts))
            .then((opts) => {
                feed.feed_adapter.opts = opts;
            })
            .catch((e) => {
                e.validation = true;
                e.obj = 'feed_adapter';
                e.message = 'Options check failed for ' + e.obj + ' check: ' + e.message;
                return self.Promise.reject(e);
            });
    }

    if (feed.torrent_downloader) {

        let td = self.dp.resolver(feed.torrent_downloader.name);

        if (!td) {
            return self.Promise.reject(new Error('Unrecognized Torrent Downloader (' + feed.torrent_downloader.name + ')'));
        }

        prom = prom.then(() => td.validateSettings(feed.torrent_downloader.opts))
            .then((opts) => {
                feed.torrent_downloader.opts = opts;
            })
            .catch((e) => {
                e.validation = true;
                e.obj = 'torrent_downloader';
                e.message = 'Options check failed for ' + e.obj + ' check: ' + e.message;
                return self.Promise.reject(e);
            });
    }

    if (feed.id) {
        prom = prom.then(() => self.getById(feed.id));
    }

    prom.then((feedFromData) => {

        if (feedFromData) {
            feed = self._.merge(feedFromData, feed);
            self.feeds.update(feed);
        } else {
            feed = new Feed(feed);
            self.feeds.insert(feed);
        }

        self.db.forceSave();
        return self.getById(feed.id);
    });

    return prom;

};

// Run feed through FeedAdapter (adapter -> parser -> mapper)
FeedService.prototype.getFeedItems = function getFeedItems(feed) {

    const self = this;

    let adapter = self.dp.resolver(feed.feed_adapter.name);

    if (feed.last_run + feed.frequency > Date.now()) {
        return self.Promise.resolve([]);
    }

    self.log.debug({feed: feed.id, adapter: feed.feed_adapter.name, name: feed.name });

    return adapter.validateSettings(feed.feed_adapter.opts)
        .then((opts) => {
            feed.feed_adapter.opts = opts;
            return adapter.getFeedItems(opts);
        })
        .catch((e) => {
            self.log.debug({ func: 'FeedService.getFeedItems', error: e.message, feed: feed.id});
            self.log.error(e);
            return [];
        });
};
