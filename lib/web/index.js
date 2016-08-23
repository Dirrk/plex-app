'use strict';

const api = require('./api');

exports.routes = [
    {
        // Get /
        method: 'GET',
        path: '/',
        handler: (req, reply) => {
            reply.view('index', { movies: [{ title: 'Hello'}, { title: 'World!'}]});
        }
    },
    {   // public routes (for js and css)
        method: 'GET',
        path: '/public/{param*}',
        handler: {
            directory: {
                path: __dirname + '/public'
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v1/settings',
        handler: api.settings.getSettings
    },
    {
        method: 'GET',
        path: '/api/v1/settings/{key}',
        handler: api.settings.getSetting,
        config: { validate: api.settings.validateGetSetting }
    },
    {
        method: 'POST',
        path: '/api/v1/settings/{key}',
        handler: api.settings.setSetting,
        config: { validate: api.settings.validateSetSetting }
    },

    // Plex
    {
        method: 'GET',
        path: '/api/v1/subscription/generate',
        handler: api.subscription.subscriptionGeneration
    },
    {
        method: 'GET',
        path: '/api/v1/subscription/applyFeed',
        handler: api.subscription.subscriptionApplyFeed,
        config: { validate: api.subscription.validateSubscriptionApplyFeed }
    },
    // Subscription
    {
        method: 'GET',
        path: '/api/v1/subscription',
        handler: api.subscription.subscriptionSearch,
        config: { validate: api.subscription.validateSearch }
    },
    {
        method: 'GET',
        path: '/api/v1/subscription/{id}',
        handler: api.subscription.subscriptionGetById,
        config: { validate: api.subscription.validateGetById }
    },
    {
        method: 'POST',
        path: '/api/v1/subscription/{id?}',
        handler: api.subscription.subscriptionUpsert,
        config: { validate: api.subscription.validateUpsert }
    },
    // Feeds
    {
        method: 'GET',
        path: '/api/v1/feed',
        handler: api.feed.feedSearch,
        config: { validate: api.feed.validateSearch }
    },
    {
        method: 'GET',
        path: '/api/v1/feed/{id}',
        handler: api.feed.feedGetById,
        config: { validate: api.feed.validateGetById }
    },
    {
        method: 'POST',
        path: '/api/v1/feed/{id?}',
        handler: api.feed.feedUpsert,
        config: { validate: api.feed.validateUpsert }
    },
    // Torrents
    {
        method: 'GET',
        path: '/api/v1/torrent',
        handler: api.torrent.torrentSearch,
        config: { validate: api.torrent.validateSearch }
    },
    {
        method: 'GET',
        path: '/api/v1/torrent/{id}',
        handler: api.torrent.torrentGetById,
        config: { validate: api.torrent.validateGetById }
    },
    {
        method: 'POST',
        path: '/api/v1/torrent/{id}',
        handler: api.torrent.torrentUpsert,
        config: { validate: api.torrent.validateUpsert }
    }
];

exports.$name = 'WebModule';
exports.$single = true;
exports.$deps = [];
