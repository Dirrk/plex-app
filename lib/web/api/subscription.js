'use strict';

const Joi = require('joi');

exports.subscriptionSearch = function (req, reply) {

    const self = this;

    let subService = self.dp.resolver('SubscriptionService');

    subService.search(req.query)
        .done(reply, reply);
};
exports.subscriptionGetById = function (req, reply) {

    const self = this;

    let subService = self.dp.resolver('SubscriptionService');

    subService.getById(req.params.id)
        .done(reply, reply);
};
exports.subscriptionUpsert = function (req, reply) {

    const self = this;

    let subService = self.dp.resolver('SubscriptionService'),
        payload = req.payload;

    payload.id = req.params.id;

    subService.upsert(payload)
        .then(reply)
        .catch((e) => {
            reply({
                success: false,
                message: e.message
            }).code(400);
        });
};

exports.subscriptionGeneration = function (req, reply) {

    const self = this;

    let plexSubService = self.dp.resolver('PlexSubscriptionService');

    plexSubService.findTVShowsWithoutSubscription()
        .then((shows) => {
            reply({
                count: shows.length,
                shows: shows.map((sh) => {
                    return {
                        plexShow: sh,
                        subscription: plexSubService.createSubscriptionFromShow(sh)
                    };
                })
            });
        })
        .catch(reply);
};

exports.subscriptionApplyFeed = function (req, reply) {

    const self = this;

    let subService = self.dp.resolver('SubscriptionService');

    subService.search()
        .filter((sub) => {
            return !sub.feeds.length;
        })
        .map((sub) => {
            sub.feeds.push(req.query.feedId);
            return subService.upsert(sub);
        })
        .then((subs) => {
            reply({
                updated: subs.length,
                feedId: req.query.feedId
            });
        })
        .catch(reply);
};

exports.validateSearch = {
    query: Joi.object().keys({
        enabled: Joi.boolean(),
        name: Joi.string(),
        plexKey: Joi.string(),
        feedId: Joi.string()
    })
};
exports.validateGetById = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};
exports.validateSubscriptionApplyFeed = {
    query: Joi.object().keys({
        feedId: Joi.string().required().guid()
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
        plexKey: Joi.number(),
        se_codes: Joi.array().items(Joi.string()),
        feeds: Joi.array().items(Joi.string()),
        filters: Joi.array().items(Joi.object().keys(
            {
                name: Joi.string(),
                id: Joi.string(),
                opts: Joi.object()
            }
        ).or('name', 'id')),
        scorers: Joi.array().items(Joi.object().keys(
            {
                name: Joi.string(),
                id: Joi.string(),
                opts: Joi.object()
            }
        ).or('name', 'id')),
        torrent_processors: Joi.array().items(Joi.object().keys(
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
