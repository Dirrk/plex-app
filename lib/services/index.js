'use strict';

exports.$name = 'ServiceModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./plexMappingService'),
    require('./fileService'),
    require('./feedService'),
    require('./subscriptionService'),
    require('./plexSubscriptionService'),
    require('./torrentService'),
    require('./feedTaskService'),
    require('./torrentTaskService')
];
