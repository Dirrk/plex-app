'use strict';

const util = require('util'),
    RSSAdapter = require('./rssAdapter');

function IPTorrentsAdapterRSS (log, adapter, parser, mapper, joi, prom) {

    RSSAdapter.call(this, log, adapter, parser, mapper, joi, prom);

	this.name = 'IPTorrentsAdapterRSS';
}

util.inherits(IPTorrentsAdapterRSS, RSSAdapter);

module.exports = IPTorrentsAdapterRSS;
module.exports.$name = 'IPTorrentsAdapterRSS';
module.exports.$deps = ['Logger', 'RSSAdapter', 'RSSParser', 'IPTMapper', 'Joi', 'Promise'];
