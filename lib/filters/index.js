'use strict';

exports.$name = 'FilterModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./regexFilter'),
    require('./episodeFilter')
];

/**
 * IFilter - IFilter
 * @interface IFilter
 *
 * @param  {Subscription} subscription subscription that we are filtering for
 * @param  {Object} [opts]         any options this filter needs
 * @param  {Array<FeedItem>} items        feed items
 * @return {Promise<Array<FeedItem>>}     the feed items that survived the filter
 */
