'use strict';

function EpisodeFilter(log, prom, _) {
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = EpisodeFilter;

module.exports.$name = 'EpisodeFilter';
module.exports.$deps = ['Logger', 'Promise', '_'];


/**
 * filter - description
 * @param  {Subscription} subscription subscription that we are filtering for
 * @param  {Object} [opts]         any options this filter needs
 * @param  {Array<FeedItem>} items        feed items
 *
 * @return {Promise<Array<FeedItem>>}     the feed items that survived the filter
 */
EpisodeFilter.prototype.filter = function filter(subscription, opts, items) {

    const self = this;

    if (!opts) {
        opts = {};
    }

    if (!opts.hasOwnProperty('excludeMatchesWithoutEpisode')) {
        opts.excludeMatchesWithoutEpisode = true;
    }

    let ret;

    ret = items.filter((item) => {

        if (!item.meta_data.se_code && !opts.excludeMatchesWithoutEpisode) {
            return true;
        } else if (!item.meta_data.se_code) {
            return false;
        }

        return (subscription.se_codes.indexOf(item.meta_data.se_code) === -1);
    });

    if (items.length) {
        self.log.debug({ filter: 'EpisodeFilter', subscription: subscription.name, started: items.length, ended: ret.length, opts: opts});
    }

    return self.Promise.resolve(ret);
};
