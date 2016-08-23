'use strict';

function ScoreByEpisode(log, prom, _) {
    this.log = log;
    this.Promise = prom;
    this._ = _;
}

module.exports = ScoreByEpisode;

module.exports.$name = 'ScoreByEpisode';
module.exports.$deps = ['Logger', 'Promise', '_'];


ScoreByEpisode.prototype.score = function score(subscription, opts, items) {

    const self = this,
        _ = self._;

    let ret,
        groupedBy,
        episodeItems = items.filter((i) => !!i.meta_data.se_code);

    groupedBy = _.groupBy(episodeItems, 'meta_data.se_code');

    ret = _.map(groupedBy, (episodes) => {

        return _.reduce(episodes, (bestScoreEpisode, episode) => {
            if (bestScoreEpisode === null) {
                return episode;
            }
            if (episode.score > bestScoreEpisode.score) {
                return episode;
            }
            return bestScoreEpisode;
        }, null);
    });

    if (ret.length) {
        self.log.debug({ score: 'ScoreByEpisode', subscription: subscription.name, started: items.length, ended: ret.length});
    }

    return ret;
};
