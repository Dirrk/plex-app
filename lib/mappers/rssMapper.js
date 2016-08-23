'use strict';

const FeedItem = require('../models/feedItem');

function RSSMapper(log, prom, _) {

    // Handle data return promise with parsed data as array
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = RSSMapper;

module.exports.$name = 'RSSMapper';
module.exports.$deps = ['Logger', 'Promise', '_'];


RSSMapper.prototype.map = function map(data) {

    const self = this,
        _ = self._;

    let ret = _.map(data, (item) => {
        let i = new FeedItem(item.title, item.link);

        if (item.pubdate) {
            i.timestamp = (new Date(item.pubdate)).getTime();
        }
        _.merge(i.meta_data, _.omit(item, ['title', 'link', 'pubdate']));

        return i;
    });

    return self.Promise.resolve(ret);
};
