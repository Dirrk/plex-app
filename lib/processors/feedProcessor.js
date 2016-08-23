'use strict';

function FeedProcessor(log, prom, dp) {

    this.log = log;
    this.Promise = prom;
    this.dp = dp;
}

module.exports = FeedProcessor;

module.exports.$name = 'FeedProcessor';
module.exports.$deps = ['Logger', 'Promise', 'DependencyResolver'];

FeedProcessor.prototype.processFeed = function processFeed (feed, items) {
    const self = this;

    // Attach feed_id to each item
    let prom = self.Promise.map(items, (item) => {
        item.feed_id = feed.id;
        return item;
     });

     // run all processors
    feed.processors.forEach((proc) => {

        let processor = self.dp.resolver(proc.name);

        self.log.debug('Using feed processor: ' + proc.name);

        prom = prom.then(processor.process.bind(processor, proc.opts));
    });

    return prom.catch((e) => {
        self.log.error(e);
        throw e;
    });
};
