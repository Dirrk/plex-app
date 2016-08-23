'use strict';

function SubscriptionEpisodeSaver(log, prom, _) {
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = SubscriptionEpisodeSaver;

module.exports.$name = 'SubscriptionEpisodeSaver';
module.exports.$deps = ['Logger', 'Promise', '_'];


/**
 * process - description
 * @param  {Subscription} subscription subscription that we are processing for
 * @param  {Object} [opts]         any options this process needs
 * @param  {Array<FeedItem>} items        matched feed items
 *
 * @return {Promise<Array<FeedItem>>}     the modified feed items
 */
SubscriptionEpisodeSaver.prototype.process = function process(subscription, opts, items) {

    const self = this;

    items.map((i) => {
        if (i.meta_data.se_code) {
            subscription.se_codes.push(i.meta_data.se_code);
        }
    });

    return self.Promise.resolve(items);
};
