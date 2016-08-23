'use strict';

exports.$name = 'MapperModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./rssMapper'),
    require('./iptMapper')
];
