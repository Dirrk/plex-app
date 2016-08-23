'use strict';

const internals = {};


function RSSFeedAdapter(log, adapter, parser, mapper, joi, prom) {
    this.name = 'RSSFeedAdapter';
    this.log = log;
    this.adapter = adapter;
    this.parser = parser;
    this.mapper = mapper;
    this.Joi = joi;
    this.Promise = prom;
}

module.exports = RSSFeedAdapter;
module.exports.$name = 'RSSFeedAdapter';
module.exports.$deps = ['Logger', 'RSSAdapter', 'RSSParser', 'RSSMapper', 'Joi', 'Promise'];

RSSFeedAdapter.prototype.getFeedItems = function getFeedItems (opts) {

    const self = this;

    return self.adapter.getRSSFeed(opts.rss_url, opts.opts)
        .then((data) => {

            self.log.debug({ func: self.name + '.getFeedItems', position: 'adapter', success: true });
            return self.parser.parse(data);
        })
        .then((items) => {
            self.log.debug({ func: self.name + '.getFeedItems', position: 'parser', success: true });
            return self.mapper.map(items);
        })
        .then((items) => {
            self.log.debug({ func: self.name + '.getFeedItems', position: 'mapper', success: true });
            return items;
        })
        .catch((e) => {
            self.log.debug({ func: self.name + '.getFeedItems', success: false, message: e.message });
            throw e;
        });
};

RSSFeedAdapter.prototype.validateSettings = function validateSettings (settings) {

    const Promise = this.Promise,
        Joi = this.Joi;

    let result = Joi.validate(settings, internals.validation(Joi), internals.joiOpts);

    if (result.error) {
        return Promise.reject(result.error);
    }

    return Promise.resolve(result.value);
};

internals.joiOpts = { allowUnknown: true };

internals.validation = function validation (Joi) { 
    return Joi.object().keys({
        opts: Joi.object().keys({
            headers: Joi.object(),
            parseOptions: Joi.object().keys({
                trim: Joi.boolean().default(true),
                normalizeTags: Joi.boolean().default(true),
                explicitArray: Joi.boolean().default(false)
            }).default({ trim: true, normalizeTags: true, explicitArray: false })
        }),
        rss_url: Joi.string().required().uri({
            scheme: [
                'http',
                'https'
            ]
        })
    });
};
