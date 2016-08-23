'use strict';

function PlexMappingService(log, db, plexAdapter, _) {
    this.log = log;
    this.db = db;
    this.plex = plexAdapter;
    this._ = _;

    this.plex_movies = db.getCollection('plex_movies');
    this.plex_tv_shows = db.getCollection('plex_tv_shows');
    this.plex_tv_episodes = db.getCollection('plex_tv_episodes');
    this.plex_sections = db.getCollection('plex_sections');
}

module.exports = PlexMappingService;
module.exports.$name = 'PlexMappingService';
module.exports.$deps = ['Logger', 'Database', 'PlexAdapter', '_'];

PlexMappingService.prototype.mapSections = function mapSections () {

    const self = this;

    return self.plex.getAllSections()
        .map((section) => {

            let sec = self.plex_sections.findOne({ key: { $eq: section.key }});

            if (!sec) {
                return self.plex_sections.insert(section);
            }

            self._.merge(sec, section);
            self.plex_sections.update(sec);
        })
        .then((s) => self.log.debug({ func: 'PlexMappingService.mapSections', sections: s.length}));
};

PlexMappingService.prototype.mapMovies = function mapMovies () {

    const self = this;

    let movieCount = 0;

    return self.plex.getSectionByType('movie')
        .filter((movie) => {
            let mov = self.plex_movies.findOne({ key: { $eq: movie.key } });

            if (mov && mov.updatedAt === movie.updatedAt) {
                return false;
            }
            if (!mov) {
                self.plex_movies.insert(movie);
                movieCount++;
                return false;
            }
            return true;
        })
        .map((movie) => {

            let mov = self.plex_movies.findOne({ key: { $eq: movie.key } });

            self._.merge(mov, movie);
            movieCount++;
            return self.plex_movies.update(mov);
        })
        .then(() => {
            self.log.debug({ func: 'PlexMappingService.mapMovies', moviesUpdated: movieCount});
        });
};

PlexMappingService.prototype.mapShows = function mapShows () {

    const self = this;

    return self.plex.getSectionByType('show')
        .filter((show) => {

            let sh = self.plex_tv_shows.findOne({ key: { $eq: show.key } });

            if (sh && sh.updatedAt === show.updatedAt) {
                return false;
            }
            if (!sh) {
                self.plex_tv_shows.insert(show);
                return true;
            }
            return true;
        })
        .mapSeries((show) => {

            let episodeCount = 0,
                sh = self.plex_tv_shows.findOne({ key: { $eq: show.key } });

            self._.merge(sh, show);

            self.log.debug({ func: 'PlexMappingService.mapShows', show: sh.title });

            return self.plex.getAllEpisodes(sh.key)
                .then((episodes) => {

                    let seasons = self._.groupBy(episodes, 'season');
                    seasons = self._.mapValues(seasons, (season) => season.sort((a, b) => a.index - b.index));

                    sh.seasons = self._.mapValues(seasons, (season) => season.map((e) => e.episode).sort((a, b) => a - b));

                    self.plex_tv_shows.update(sh);

                    return episodes;
                })
                .filter((episode) => {

                    let ep = self.plex_tv_episodes.findOne({ key: { $eq: episode.key }});

                    if (!ep) {
                        self.plex_tv_episodes.insert(episode);
                        episodeCount++;
                        return false;
                    }

                    if (ep.updatedAt === episode.updatedAt) {
                        return false;
                    }

                    return true;

                })
                .mapSeries((episode) => {

                    let ep = self.plex_tv_episodes.findOne({ key: { $eq: episode.key }});

                    episodeCount++;

                    self._.merge(ep, episode);
                })
                .then(() => {
                    self.log.debug({ func: 'PlexMappingService.mapShows - Episodes', episodesUpdated: episodeCount, show: sh.title });
                });
        })
        .then((len) => {
            self.log.debug({ func: 'PlexMappingService.mapShows - Shows', showsUpdated: len.length });
        });
};
