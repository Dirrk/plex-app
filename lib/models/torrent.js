'use strict';

const uuid = require('node-uuid');

function Torrent(t) {

    this.id = t.id || uuid.v4();
    this.title = t.title || '';
    this.status = t.status || 0;
    this.file = t.file || '';
    this.status_time = t.status_time || Date.now();
    this.url = t.url || '';
    this.feed_id = t.feed_id || null;
    this.subscription_id = t.subscription_id || null;
    this.meta_data = t.meta_data || {};
}

module.exports = Torrent;
