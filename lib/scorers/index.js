'use strict';

exports.$name = 'ScoreModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./scoreByEpisode')
];

/**
 * IScorer
 * @interface IScorer
 *
 * @method score
 *
 * @param  {Subscription} subscription the subscription to run the scorer on
 * @param  {Object} [opts]         any options this filter needs
 * @param  {Array<FeedItem>} items        feed items
 * @return {Promise<Array<FeedItem>>}     the feed items after the processing
 */
