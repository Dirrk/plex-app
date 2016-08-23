'use strict';

function FeedTaskService (log, db, feedService, subService, feedProcessor,
                        subscriptionProcessor, torrentProcessor,
                        torrentService, _) {

    this.log = log;
    this.db = db;
    this.feedService = feedService;
    this.subService = subService;
    this.feedProcessor = feedProcessor;
    this.subscriptionProcessor = subscriptionProcessor;
    this.torrentProcessor = torrentProcessor;
    this.torrentService = torrentService;
    this._ = _;
}

module.exports = FeedTaskService;
module.exports.$name = 'FeedTaskService';
module.exports.$deps = [
    'Logger',
    'Database',
    'FeedService',
    'SubscriptionService',
    'FeedProcessor',
    'SubscriptionProcessor',
    'TorrentProcessor',
    'TorrentService',
    '_'
];

FeedTaskService.prototype.runTask = function runTask () {

    const self = this;

    return self.feedService.search({ enabled: true})
        .filter((feed) => {
            return (feed.last_run + feed.frequency < Date.now());
        })
        .map((feed) => {
            return self.feedService.getFeedItems(feed)
                .then(self.feedProcessor.processFeed.bind(self.feedProcessor, feed))
                .then((items) => {
                    return self.subService.search({ feedId: feed.id, enabled: true })
                        .map((sub) => {
                        // Should return an array of matching torrent for subscription
                            return self.subscriptionProcessor.processSubscription(sub, items)
                                .then((subMatches) => {
                                    return self.torrentProcessor.processMatches(sub, subMatches);
                                });
                            })
                            .then((subs) => {
                                return self._.flatten(subs);
                            });
            })
            .tap((data) => {
                // Update last run for feed
                feed.last_run = Date.now();
            });
        })
        .then((data) => {

            return self._.flatten(data);
        })
        .map((item) => {
            let t = self.torrentService.addTorrent(item);

            self.log.debug({ torrent: t, success: true, func: 'FeedTaskService.runTask', message: 'Added torrent to database'});
            return t;
        })
        .then((items) => {
            if (items.length) {
                self.log.info({ message: 'Added new torrents', count: items.length });
            }
            self.db.forceSave();
        });
};
