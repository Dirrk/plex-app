'use strict';

exports.$name = 'CustomProcessorModule';
exports.$single = true;
exports.$deps = [];
exports.$exports = [
    require('./identifyTorrentLocations')
];
