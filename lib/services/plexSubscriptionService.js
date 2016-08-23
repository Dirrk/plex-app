'use strict';

const Subscription = require('../models').Subscription,
    internals = {};

function PlexSubscriptionService(log, db, prom, _, subService) {
    this.log = log;
    this.db = db;
    this.ss = subService;
    this._ = _;
    this.Promise = prom;

    this.plex_movies = db.getCollection('plex_movies');
    this.plex_tv_shows = db.getCollection('plex_tv_shows');
    this.plex_tv_episodes = db.getCollection('plex_tv_episodes');
    this.plex_sections = db.getCollection('plex_sections');
    this.subscriptions = db.getCollection('subscriptions');
}

module.exports = PlexSubscriptionService;
module.exports.$name = 'PlexSubscriptionService';
module.exports.$deps = ['Logger', 'Database', 'Promise', '_', 'SubscriptionService'];

PlexSubscriptionService.prototype.findTVShowsWithoutSubscription = function findTVShowsWithoutSubscription() {

    const self = this;

    let shows = self.plex_tv_shows.find();

    return self.Promise.filter(shows, (show) => {

        return !self.subscriptions.findOne({ plexKey: { $eq: show.key }});
    });
};


PlexSubscriptionService.prototype.createSubscriptionFromShow = function createSubscriptionFromShow(show) {

    const self = this,
        _ = self._;

    let sub = {
        name: show.title,
        enabled: true,
        plexKey: show.key,
        groupBy: 'episode',
        filters: [
            { name: 'RegexFilter', opts: {}},
            { name: 'EpisodeFilter', opts: {}}
        ],
        scorers: [
            { name: 'ScoreByEpisode', opts: {}}
        ],
        torrent_processors: [
            { name: 'SubscriptionEpisodeSaver', opts: {}}
        ],
        status_processors: [

        ]
    };

    sub.se_codes = _.flatten(_.map(show.seasons, (season, key) => season.map((ep) => internals.seCode(key, ep))));

    return new Subscription(sub);
};

internals.seCode = function seCode(season, episode) {
    season = parseInt(season);
    episode = parseInt(episode);

    let ret = 'S';

    if (season < 10) {
        ret = ret + '0';
    }
    ret = ret + season + 'E';

    if (episode < 10) {
        ret = ret + '0';
    }
    ret = ret + episode;
    return ret;
};
