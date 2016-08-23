'use strict';

module.exports = function testHandler(req, reply) {

    const self = this;

    let data = self.db.getCollection('plex_tv_shows');

    reply({ count: data.count(), data: data.find() });
};
