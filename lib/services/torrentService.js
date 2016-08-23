'use strict';

const Torrent = require('../models').Torrent;

function TorrentService(log, db, prom, _, dp) {

    this.log = log;
    this.db = db;
    this.Promise = prom;
    this._ = _;
    this.dp = dp;

    this.torrents = db.getCollection('torrents');
}

module.exports = TorrentService;
module.exports.$name = 'TorrentService';
module.exports.$deps = ['Logger', 'Database', 'Promise', '_', 'DependencyResolver'];


TorrentService.prototype.addTorrent = function addTorrent(item) {

    const self = this;

    let t = new Torrent({
        title: item.title,
        url: item.url,
        subscription_id: item.meta_data.subscription_id,
        feed_id: item.feed_id
    });

    t.meta_data = self._.merge({}, item.meta_data, self._.omit(item, ['meta_data']));

    self.torrents.insert(t);

    self.db.forceSave();

    return self.Promise.resolve(t);
};

// Returns a single torrent
TorrentService.prototype.getById = function getById(id) {

    return this.Promise.resolve(this.torrents.findOne({ id: { $eq: id }}));

};
// Returns all torrents
TorrentService.prototype.search = function search(options) {

    const self = this;

    let query;

    if (options) {
        query = [];
    } else {
        options = {};
    }

    if (options.status && options.status.length) {
        query.push({ status: { $in: options.status }});
    }

    if (options.title) {
        query.push({ title: { $regex: new RegExp('.*' + options.title + '.*')}});
    }
    if (options.subscriptionId) {
        query.push({ subscription_id: { $eq: options.subscriptionId }});
    }
    if (options.after) {
        query.push({ status_time: { $gt: options.after.getTime() }});
    } else if (options.before) {
        query.push({ status_time: { $lt: options.before.getTime() }});
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

    return self.Promise.resolve(self.torrents.find(query));
};


TorrentService.prototype.update = function update(id, torrent) {

    const self = this,
        _ = this._;

    return self.getById(id)
        .then((tData) => {

            if (!tData) {
                return { success: false, error: 'Data Not Found' };
            }

            _.merge(tData.meta_data, torrent.meta_data);
            _.merge(tData, _.omit(torrent, ['meta_data']));

            self.db.forceSave();

            return tData;
        });
};
