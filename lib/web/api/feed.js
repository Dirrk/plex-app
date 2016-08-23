'use strict';

const Joi = require('joi');

exports.feedSearch = function (req, reply) {

    const self = this;

    let feedService = self.dp.resolver('FeedService');

    feedService.search(req.query)
        .done(reply, reply);
};
exports.feedGetById = function (req, reply) {

    const self = this;

    let feedService = self.dp.resolver('FeedService');

    feedService.getById(req.params.id)
        .done(reply, reply);
};
exports.feedUpsert = function (req, reply) {

    const self = this;

    let feedService = self.dp.resolver('FeedService'),
        payload = req.payload;

    payload.id = req.params.id;

    feedService.upsert(payload)
        .done(reply, (e) => {
            reply({
                success: false,
                message: e.message
            }).code(400);
        });
};


exports.validateSearch = {
    query: Joi.object().keys({
        enabled: Joi.boolean(),
        name: Joi.string()
    })
};
exports.validateGetById = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};
exports.validateUpsert = {
    params: Joi.object().keys({
        id: Joi.string()
    }),
    payload: Joi.object().keys({

        id: Joi.string(),
        name: Joi.string().required(),
        enabled: Joi.boolean().default(false),
        frequency: Joi.number().default(60 * 1000).min(30000),
        last_run: Joi.number().default(0).min(0),
        feed_adapter: Joi.object().keys({
            name: Joi.string().required(),
            opts: Joi.object()
        }),
        torrent_downloader: Joi.object().keys({
            name: Joi.string().required(),
            opts: Joi.object()
        }),
        processors: Joi.array().items(Joi.object().keys(
            {
                name: Joi.string(),
                id: Joi.string(),
                opts: Joi.object()
            }
        ).or('name', 'id')),
        status_processors: Joi.array().items(Joi.object().keys(
            {
                name: Joi.string(),
                id: Joi.string(),
                opts: Joi.object()
            }
        ).or('name', 'id'))
    })
};
