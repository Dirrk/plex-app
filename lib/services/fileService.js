/*jshint bitwise: false*/

'use strict';
const fs = require('fs'),
    RWX = fs.R_OK | fs.W_OK | fs.X_OK,
    RX = fs.R_OK | fs.X_OK;


function FileService (log, db) {
    this.log = log;
    this.db = db;
}

module.exports = FileService;
module.exports.$name = 'FileService';
module.exports.$deps = ['Logger', 'Database'];

FileService.prototype.verifyDirectory = function verifyDirectory (directory) {

    const self = this;

    return fs.statAsync(directory)
        .then((stat) => {
            if (!stat.isDirectory()) {
                throw new Error('Not a directory');
            }

            return fs.accessAsync(directory, RWX);
        })
        .then(() => {
            return { success: true, directory: directory };
        })
        .catch((err) => {
            self.log.debug({ func: 'verifyDirectory', directory: directory, err: err.message});
            return { success: false, directory: directory, message: err.message };
        });
};

FileService.prototype.verifyExecutable = function verifyExecutable (file) {

    const self = this;

    return fs.statAsync(file)
        .then((stat) => {
            if (!stat.isFile()) {
                throw new Error('Not a file');
            }

            return fs.accessAsync(file, RX);
        })
        .then(() => {
            return { success: true, file: file };
        })
        .catch((err) => {
            self.log.debug({ func: 'verifyDirectory', file: file, err: err.message});
            return { success: false, file: file, message: err.message };
        });
};


FileService.prototype.verifyExist = function verifyExist (file) {

    const self = this;

    return fs.statAsync(file)
        .then((stat) => {

            return { success: true, file: file, stat: stat };
        })
        .catch((err) => {
            self.log.debug({ func: 'verifyExist', file: file, err: err.message});
            return { success: false, file: file, err: err.message};
        });
};
