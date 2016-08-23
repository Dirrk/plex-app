'use strict';

exports.$name = 'FeedAdapterModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./rssAdapter'),
    require('./rssIptAdapter')
];
