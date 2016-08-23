'use strict';

const Joi = require('joi');

exports.getSettings = function (req, reply) {

    const self = this;

    let db = self.dp.resolver('Database');

    reply(db.settings.find());
};
exports.getSetting = function (req, reply) {

    const self = this;

    let db = self.dp.resolver('Database');

    reply(db.settings.findOne({ key: { $eq: req.params.key }}));
};

exports.validateGetSetting = {
    params: Joi.object().keys({
        key: Joi.string().required()
    })
};

exports.setSetting = function (req, reply) {

    const self = this;

    let setting,
        _ = self.dp.resolver('_'),
        db = self.dp.resolver('Database');

    setting = db.settings.findOne({ key: { $eq: req.params.key }});

    if (!setting) {
        setting = req.payload;
        setting.key = req.params.key;
        db.settings.insert(setting);
    } else {
        setting = _.merge(setting, req.payload);
    }

    db.forceSave();

    reply(setting);
};

exports.validateSetSetting = {
    params: Joi.object().keys({
        key: Joi.string().required()
    }),
    payload: Joi.object()
};
