'use strict';

function ScoreProcessor(log, prom, dp) {

    this.log = log;
    this.Promise = prom;
    this.dp = dp;
}

module.exports = ScoreProcessor;

module.exports.$name = 'ScoreProcessor';
module.exports.$deps = ['Logger', 'Promise', 'DependencyResolver'];

ScoreProcessor.prototype.processScore = function processScore (subscription, items) {
    const self = this;

    // run all scorers
    let prom = self.Promise.resolve(items);

    subscription.scorers.forEach((proc) => {

        let scorer = self.dp.resolver(proc.name);

        // self.log.debug('Using subscription scorer: ' + proc.name);

        // Should score each remaining item and return all items
        prom = prom.then(scorer.score.bind(scorer, subscription, proc.opts));
    });

    return prom.catch((e) => {
        self.log.error(e);
        throw e;
    });
};
