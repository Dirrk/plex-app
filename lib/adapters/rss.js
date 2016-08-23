'use strict';

function RSSAdapter (log, wreck, prom, xml2js) {

    // Get rss return promise with data
    this.log = log;
    this.Wreck = wreck;
    this.Promise = prom;
    this.parser = xml2js.parseAsync;
}

module.exports = RSSAdapter;


module.exports.$name = 'RSSAdapter';
module.exports.$deps = ['Logger', 'Wreck', 'Promise', 'xml2js'];

RSSAdapter.prototype.getRSSFeed = function getRSSFeed(url, options) {

    const self = this;

    if (!options) {
        options = {
            parseOptions: {
                trim: true,
                normalizeTags: true,
                explicitArray: false
            }
        };
    }

    return self.Wreck.getAsync(url)
        .spread((resp, payload) => {

            if (resp.statusCode !== 200) {
                throw new Error('Bad status code from RSS Feed: ' + url + ' statusCode: ' + resp.statusCode);
            }

            self.log.debug('Retrieved rss from url successfully: ' + url);

            return self.parser(payload.toString('utf8'), options.parseOptions);
        })
        .catch((e) => {
            self.log.error(e);
            throw e;
        });
};
