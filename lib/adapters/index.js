'use strict';

exports.$name = 'AdapterModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./plex'),
    require('./rss'),
    require('./bencode')
];
