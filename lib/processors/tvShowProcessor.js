'use strict';

const internals = {};

function TvShowProcessor (log, prom, _) {

    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = TvShowProcessor;
module.exports.$name = 'TvShowProcessor';
module.exports.$deps = ['Logger', 'Promise', '_'];

TvShowProcessor.prototype.process = function process(opts, items) {

    const self = this,
        _ = self._;

    _.map(items, (item) => {

        let show,
            se;

        show = internals.parseShow(item.title);
        se = internals.parseSeasonEpisode(item.title);

        if (show) {
            item.show = _.trimEnd(show);
        }
        if (se && se.season) {
            item.season = se.season;
        }
        if (se && se.episode) {
            item.episode = se.episode;
        }

        if (se && se.se_code) {
            item.meta_data.se_code = se.se_code;
        }

        return item;
    });

    return self.Promise.resolve(items);
};

internals.parseShow = function parseShow(str) {

    let show = str.match(/^([a-zA-Z\s0-9]+)[\s\.](?=S[0-9]{1,2}E[0-9]{1,3}|20[0-9][0-9]|part.[0-9]{1,3})/gim);

    if (show && show.length) {
        return show[0];
    }
};

internals.parseSeasonEpisode = function parseSeasonEpisode(str) {

    let ret,
        dateStr,
        seasonEpisode = str.match(/(S[0-9]{1,2}E[0-9]{1,3}|20[0-9][0-9].[0-9]{2}.[0-9]{2}|part.[0-9]{1,3}|S[0-9]{1,2})/gi);

    if (!seasonEpisode || !seasonEpisode.length) {
        return;
    }

    dateStr = seasonEpisode[0].replace(/[\s]/i, '-');
    seasonEpisode = seasonEpisode[0].split(/[se]/i);

    ret = {
        se_code: dateStr
    };

    if (dateStr.startsWith('S') && seasonEpisode[1]) {
        ret.season = parseInt(seasonEpisode[1]);
    }
    if (dateStr.startsWith('S') && seasonEpisode[2]) {
        ret.episode = parseInt(seasonEpisode[2]);
    }

    if (dateStr.startsWith('P')) {

        seasonEpisode = dateStr.split('-');

        ret.season = 1;
        ret.episode = parseInt(seasonEpisode[1]);
        if (ret.episode < 10) {
            ret.se_code = 'S01E0' + ret.episode;
        } else {
            ret.se_code = 'S01E' + ret.episode;
        }
    }

    return ret;
};
