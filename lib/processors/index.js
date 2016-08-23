'use strict';

exports.$name = 'ProcessorModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./tvShowProcessor'),
    require('./feedProcessor'),
    require('./subscriptionProcessor'),
    require('./filterProcessor'),
    require('./scoreProcessor'),
    require('./torrentProcessor'),
    require('./subscriptionEpisodeSaver'),
    require('./torrentStatusProcessor')
];

/**
 * IFeedProcessor - IFeedProcessor
 * @interface IFeedProcessor
 *
 * @method process
 *
 * @param  {Object} [opts]         any options this filter needs
 * @param  {Array<FeedItem>} items        feed items
 * @return {Promise<Array<FeedItem>>}     the feed items after the processing
 */
