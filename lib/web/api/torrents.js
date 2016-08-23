'use strict';

const Joi = require('joi');

exports.torrentSearch = function (req, reply) {

    const self = this;

    let torrentService = self.dp.resolver('TorrentService');

    torrentService.search(req.query)
        .done(reply, reply);
};

exports.torrentGetById = function (req, reply) {

    const self = this;

    let torrentService = self.dp.resolver('TorrentService');

    torrentService.getById(req.params.id)
        .done(reply, reply);
};

exports.torrentUpsert = function (req, reply) {

    const self = this;

    let torrentService = self.dp.resolver('TorrentService'),
        payload = req.payload;

    torrentService.update(req.params.id, payload)
        .done(reply, reply);
};


exports.validateSearch = {
    query: Joi.object().keys({
        enabled: Joi.boolean(),
        subscriptionId: Joi.string(),
        title: Joi.string(),
        before: Joi.date(),
        after: Joi.date(),
        status: Joi.array().items(Joi.number().required())
    })
};
exports.validateGetById = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};
exports.validateUpsert = {
    params: Joi.object().keys({
        id: Joi.string().required().guid()
    }),
    payload: Joi.object().keys({
        title: Joi.string(),
        status: Joi.number(),
        file: Joi.string(),
        status_time: Joi.number(),
        url: Joi.string(),
        subscription_id: Joi.string(),
        meta_data: Joi.object()
    })
};
