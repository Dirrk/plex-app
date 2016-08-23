'use strict';

const url = require('url');

function PlexAdapter (log, wreck, promise, _) {
    this.log = log;
    this.Wreck = wreck;
    this.Promise = promise;
    this._ = _;
    this.host = 'localhost';
    this.port = 32400;
}

module.exports = PlexAdapter;

module.exports.$name = 'PlexAdapter';
module.exports.$deps = ['Logger', 'Wreck', 'Promise', '_'];

PlexAdapter.MOVIE_TYPE = 1;
PlexAdapter.SHOW_TYPE = 2;
PlexAdapter.EPISODE_TYPE = 4;

PlexAdapter.prototype.getAllSections = function getSections() {

    const self = this;

    let path = '/library/sections';

    return self.getUrl(path)
        .then((data) => {
            if (!data) {
                return [];
            }
            return data._children;
        })
        .map((section) => {
            let tmp,
                sec = self._.pick(section, ['key', 'type', 'title', 'uuid', 'updatedAt']);

            tmp = self._.filter(section._children, { _elementType: 'Location'});
            sec.directories = self._.map(tmp, (d) => d.path);

            return sec;
        });
};


PlexAdapter.prototype.getSectionByType = function getSectionByType(type) {

    const self = this;

    let search = { type: type };

    return self.getAllSections()
        .then((sections) => {

            self.log.debug({ func: 'PlexAdapter.getSections', sections: sections});

            sections = self._.filter(sections, search);

            if (!sections || !sections.length) {
                return [];
            }

            if (sections[0].type === 'movie') {
                return self.Promise.mapSeries(sections, (section) => self.getMovieSection(section.key));
            }

            if (sections[0].type === 'show') {
                return self.Promise.mapSeries(sections, (section) => self.getTVSection(section.key));
            }

            return [];
        })
        .then((sections) => self._.flatten(sections));
};

PlexAdapter.prototype.getMovieSection = function getMovieSection(section) {

    const self = this;

    let path = '/library/sections/' + section + '/all';

    return self.getUrl(path)
        .then((data) => {
            if (!data) {
                return [];
            }
            return data._children;
        })
        .map((item) => {
            let tmp,
                ret = self._.pick(item, [
                'studio',
                'type',
                'title',
                'contentRating',
                'summary',
                'rating',
                'viewCount',
                'lastViewedAt',
                'year',
                'duration',
                'addedAt',
                'updatedAt'
            ]);

            ret.addedAt = ret.addedAt * 1000;
            ret.updatedAt = ret.updatedAt * 1000;

            ret.key = item.ratingKey;
            ret.parentKey = section;

            tmp = self._.find(item._children, { _elementType: 'Media'});

            if (tmp) {
                ret.resolution = tmp.videoResolution;
                ret.audioCodec = tmp.audioCodec;
                ret.videoCodec = tmp.videoCodec;
                ret.container = tmp.container;
                ret.videoFrameRate = tmp.videoFrameRate;

                tmp = self._.filter(tmp._children, { _elementType: 'Part'});

                ret.size = self._.reduce(tmp, (s, p) => s + p.size, 0);
            }

            tmp = self._.groupBy(item._children, '_elementType');

            ret.genres = self._.map(tmp.Genre, (i) => i.tag);
            ret.writers = self._.map(tmp.Writer, (i) => i.tag);
            ret.directors = self._.map(tmp.Director, (i) => i.tag);
            ret.actors = self._.map(tmp.Role, (i) => i.tag);

            return ret;
        });
};

PlexAdapter.prototype.getTVSection = function getTVSection(section) {

    const self = this;

    let path = '/library/sections/' + section + '/all';

    return self.getUrl(path)
        .then((data) => {
            if (!data) {
                return [];
            }
            return data._children;
        })
        .map((item) => {
            let tmp,
                ret = self._.pick(item, [
                'studio',
                'type',
                'title',
                'contentRating',
                'summary',
                'rating',
                'viewCount',
                'lastViewedAt',
                'year',
                'duration',
                'addedAt',
                'updatedAt'
            ]);

            ret.addedAt = ret.addedAt * 1000;
            ret.updatedAt = ret.updatedAt * 1000;

            ret.key = item.ratingKey;
            ret.parentKey = section;

            tmp = self._.groupBy(item._children, '_elementType');

            ret.genres = self._.map(tmp.Genre, (i) => i.tag);
            ret.writers = self._.map(tmp.Writer, (i) => i.tag);
            ret.directors = self._.map(tmp.Director, (i) => i.tag);
            ret.actors = self._.map(tmp.Role, (i) => i.tag);

            return ret;
        });
};

PlexAdapter.prototype.getAllEpisodes = function getAllEpisodes (showId) {

    const self = this;

    let path = '/library/metadata/' + showId + '/allLeaves';

    return self.getUrl(path)
        .then((data) => {
            if (!data) {
                return [];
            }
            return data._children;
        })
        .map((item) => {

            let tmp,
                ret = self._.pick(item, [
                    'type',
                    'title',
                    'summary',
                    'rating',
                    'contentRating',
                    'viewCount',
                    'lastViewedAt',
                    'year',
                    'duration',
                    'addedAt',
                    'updatedAt'
            ]);

            ret.addedAt = ret.addedAt * 1000;
            ret.updatedAt = ret.updatedAt * 1000;

            ret.key = item.ratingKey;
            ret.seasonKey = item.parentRatingKey;
            ret.season = item.parentIndex;
            ret.episode = item.index;

            tmp = self._.find(item._children, { _elementType: 'Media'});

            if (tmp) {
                ret.resolution = tmp.videoResolution;
                ret.audioCodec = tmp.audioCodec;
                ret.videoCodec = tmp.videoCodec;
                ret.container = tmp.container;
                ret.videoFrameRate = tmp.videoFrameRate;

                tmp = self._.filter(tmp._children, { _elementType: 'Part'});

                ret.size = self._.reduce(tmp, (s, p) => s + p.size, 0);

                tmp = self._.head(tmp);

                if (tmp && tmp.file) {
                    ret.file = tmp.file;
                }
            }

            tmp = self._.groupBy(item._children, '_elementType');

            ret.genres = self._.map(tmp.Genre, (i) => i.tag);
            ret.writers = self._.map(tmp.Writer, (i) => i.tag);
            ret.directors = self._.map(tmp.Director, (i) => i.tag);
            ret.actors = self._.map(tmp.Role, (i) => i.tag);

            return ret;
        });
};


PlexAdapter.prototype.getUrl = function getUrl(path, query) {
    const self = this;

    let link = url.format({
        protocol: 'http',
        hostname: this.host,
        port: this.port,
        pathname: path,
        query: query
    });

    self.log.debug({ func: 'plex.getUrl', message: link});

    return self.Wreck.getAsync(link, { headers: { Accept: 'application/json'}, json: true})
        .spread((response, data) => {
                if (response.statusCode !== 200) {
                    return undefined;
                }
                return data;
        });
};
