'use strict';

function FeedItem(title, url) {

    this.title = title;
    this.url = url;
    this.timestamp = Date.now();
    this.score = 0;
    this.movie = null;
    this.show = null;
    this.season = null;
    this.episode = null;
    this.is_pack = null;
    this.feed_id = null;
    this.meta_data = {};
}

module.exports = FeedItem;
