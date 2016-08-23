'use strict';

const Subscription = require('../models').Subscription;

function SubscriptionService (log, db, prom, _, dp) {
    this.log = log;
    this.db = db;
    this.Promise = prom;
    this._ = _;
    this.dp = dp;

    this.subs = db.getCollection('subscriptions');
}

module.exports = SubscriptionService;
module.exports.$name = 'SubscriptionService';
module.exports.$deps = ['Logger', 'Database', 'Promise', '_', 'DependencyResolver'];

// Returns a single sub
SubscriptionService.prototype.getById = function getById(id) {

    return this.Promise.resolve(this.subs.findOne({ id: { $eq: id }}));

};
// Returns all subs
SubscriptionService.prototype.search = function search(options) {

    const self = this;

    let query;

    if (options) {
        query = [];
    } else {
        options = {};
    }

    if (options.enabled === false) {
        query.push({ enabled: { $eq: false }});
    }
    if (options.enabled === true) {
        query.push({ enabled: { $eq: true }});
    }
    if (options.name) {
        query.push({ name: { $regex: new RegExp('.*' + options.name + '.*')}});
    }
    if (options.plexKey) {
        query.push({ plexKey: { $eq: options.plexKey }});
    }
    if (options.feedId) {
        query.push({ feeds: { $contains: options.feedId }});
    }

    if (query && query.length === 0) {
        query = undefined;
    }
    if (query && query.length === 1) {
        query = query[0];
    }
    if (query && query.length > 1) {
        query = {
            $and: query
        };
    }

    return self.Promise.resolve(self.subs.find(query));
};

// Returns a single sub
SubscriptionService.prototype.upsert = function upsert(sub) {

    const self = this;

    let prom = self.Promise.resolve();

    if (sub.id) {
        prom = self.getById(sub.id);
    }

    prom.then((subFromData) => {

        if (subFromData) {
            sub = self._.merge(subFromData, sub);
            self.subs.update(sub);
        } else {
            sub = new Subscription(sub);
            self.subs.insert(sub);
        }
        return sub;
    });

    return prom;
};
