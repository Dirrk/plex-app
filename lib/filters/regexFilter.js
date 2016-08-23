'use strict';

function RegexFilter(log, prom, _) {
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = RegexFilter;

module.exports.$name = 'RegexFilter';
module.exports.$deps = ['Logger', 'Promise', '_'];


/**
 * filter - description
 * @param  {Subscription} subscription subscription that we are filtering for
 * @param  {Object} [opts]         any options this filter needs
 * @param  {Array<FeedItem>} items        feed items
 *
 * @return {Promise<Array<FeedItem>>}     the feed items that survived the filter
 */
RegexFilter.prototype.filter = function filter(subscription, opts, items) {

    const self = this;

    if (!opts) {
        opts = {};
    }

    if (!opts.regex) {
        opts.regex = subscription.name.replace(/[^A-Z0-9]/gmi, '.') + '.*';
    }

    if (!opts.regexOpts) {
        opts.regexOpts = 'im';
    }

    if (!opts.hasOwnProperty('allow')) {
        opts.allow = true;
    }

    let re = new RegExp(opts.regex, opts.regexOpts),
        ret;

    ret = items.filter((item) => {

        // If it matches keep in array
        if (opts.allow) {
            return re.test(item.title);
        }
        // Remove it matches
        return !re.test(item.title);
    });

    if (ret.length) {
        self.log.debug({ filter: 'regexFilter', subscription: subscription.name, started: items.length, ended: ret.length, opts: opts});
    }

    return self.Promise.resolve(ret);
};
