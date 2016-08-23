'use strict';

function FilterProcessor(log, prom, dp) {

    this.log = log;
    this.Promise = prom;
    this.dp = dp;
}

module.exports = FilterProcessor;

module.exports.$name = 'FilterProcessor';
module.exports.$deps = ['Logger', 'Promise', 'DependencyResolver'];

FilterProcessor.prototype.processFilter = function processFilter (subscription, items) {
    const self = this;

    // run all filters
    let prom = self.Promise.resolve(items);

    subscription.filters.forEach((proc) => {

        let filter = self.dp.resolver(proc.name);

        self.log.debug('Using subscription filter: ' + proc.name);

        prom = prom.then(filter.filter.bind(filter, subscription, proc.opts)); // Every filter should return the remaining items
    });

    return prom.catch((e) => {
        self.log.error(e);
        throw e;
    });
};
