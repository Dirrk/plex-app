'use strict';

function RSSParser(log, prom, _) {

    // Handle data return promise with parsed data as array
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = RSSParser;

module.exports.$name = 'RSSParser';
module.exports.$deps = ['Logger', 'Promise', '_'];


RSSParser.prototype.parse = function parse(data) {

    const self = this,
        _ = self._;

    let ret = [],
        channel = _.get(data, 'rss.channel') || {};

    ret = _.map(channel.item, (item) => {
        return _.merge(item);
    });

    return self.Promise.resolve(ret);
};
