'use strict';

const argParser = require('minimist'),
    app = require('./lib'),
    config = {};

config.string = ['db'];
config.boolean = ['verbose'];
config.default = {
    db: 'db.json'
};

let settings = argParser(process.argv.slice(2), config);

app(settings);
