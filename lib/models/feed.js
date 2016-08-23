'use strict';

const uuid = require('node-uuid');

function Feed(f) {

    this.id = f.id || uuid.v4();
    this.name = f.name || null;
    this.enabled = f.enabled || false;
    this.frequency = f.frequency || 5 * 60 * 1000;
    this.feed_adapter = f.feed_adapter || { name: 'RSSFeedAdapter', opts: {}};
    this.status_processors = f.status_processors || [];
    this.processors = f.processors || [];
    this.last_run = f.last_run || 0;
    this.torrent_downloader = f.torrent_downloader || { name: 'LinkDownloader', opts: {}};
}

module.exports = Feed;
// {
//     name: 'IPTorrentsAdapterRSS',
//     opts: {
//         rss_url: 'https://iptorrents.com/torrents/rss?u=1216603;tp=090a96a93eee219c1d0ca1de183d9017;5;download',
//         opts: {
//             parseOptions: {},
//             headers: {}
//         }
//     }
// }
