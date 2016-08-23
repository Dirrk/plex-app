'use strict';

const uuid = require('node-uuid');

function Subscription(s) {

    this.id = s.id || uuid.v4();
    this.name = s.name || null;
    this.enabled = s.enabled || false;
    this.plexKey = s.plexKey || null;
    this.groupBy = s.groupBy || null;
    this.se_codes = s.se_codes || [];
    this.filters = s.filters || [];
    this.scorers = s.scorers || [];
    this.feeds = s.feeds || [];
    this.torrent_processors = s.torrent_processors || [];
    this.status_processors = s.status_processors || [];
}

module.exports = Subscription;
