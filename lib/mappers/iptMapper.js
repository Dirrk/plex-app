'use strict';

const FeedItem = require('../models/feedItem'),
    internals = {};

function IPTMapper(log, prom, _) {

    // Handle data return promise with parsed data as array
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = IPTMapper;

module.exports.$name = 'IPTMapper';
module.exports.$deps = ['Logger', 'Promise', '_'];


IPTMapper.prototype.map = function map(data) {

    const self = this,
        _ = self._;

    let ret = _.map(data, (item) => {
        let i = new FeedItem(item.title, item.link);

        if (item.pubdate) {
            i.timestamp = (new Date(item.pubdate)).getTime();
        }
        _.merge(i.meta_data, _.omit(item, ['title', 'link', 'pubdate']), internals.parseDesc(item.description));

        return i;
    });

    return self.Promise.resolve(ret);
};


internals.parseDesc = function parseDesc(desc) {

    let ret = {},
    group;

    group = /([0-9\.]+)\s([GMT]B);/g.exec(desc);

    if (group) {
        let size = parseFloat(group[1]);

        if (group[2] === 'GB') {
            size = size * 1024;
        }

        if (group[2] === 'TB') {
            size = size * 1024 * 1024;
        }

        ret.size = Math.floor(size);
    }

    return ret;
};
