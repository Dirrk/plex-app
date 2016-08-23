'use strict';

function SubscriptionProcessor(log, prom, fp, scp, _, dp) {

    this.log = log;
    this.Promise = prom;
    this.fp = fp;
    this.scp = scp;
    this._ = _;
    this.dp = dp;
}

module.exports = SubscriptionProcessor;

module.exports.$name = 'SubscriptionProcessor';
module.exports.$deps = ['Logger', 'Promise', 'FilterProcessor', 'ScoreProcessor', '_', 'DependencyResolver'];

SubscriptionProcessor.prototype.processSubscription = function processSubscription (sub, items) {
    const self = this;

    self.log.debug('ProcessingSubscription: ' + sub.name);

    return self.fp.processFilter(sub, items) // Run all the filters
        .then(self.scp.processScore.bind(self.scp, sub)) // Score each filtered item potentially removing any
        .then((sc) => { // Return the scored matches

            return sc.map((s) => {
                s.meta_data.subscription_id = sub.id;
                return s;
            });
        })
        .catch((e) => {
            self.log.error(e);
            throw e;
        });
};
