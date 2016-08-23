'use strict';

function ServiceController (log, db, prom, dp) {

    this.log = log;
    this.db = db;
    this.Promise = prom;
    this.dp = dp;
    this.services = {
        WebServiceController: undefined,
        PlexServiceController: undefined,
        DownloaderServiceController: undefined
    };
}

module.exports = ServiceController;

module.exports.$name = 'ServiceController';
module.exports.$deps = ['Logger', 'Database', 'Promise', 'DependencyResolver'];
module.exports.$exports = [
    require('./webService'),
    require('./plexService'),
    require('./feedDownloadService')
];


ServiceController.prototype.startAll = function starAll() {

    const self = this;

    // start all services that appear in setting to autostart
    let autoStart = self.db.settings.findOne({ key: { $eq: 'autostart'}}),
        go = [];

    if (!autoStart) {
        throw new Error('Nothing to autostart');
    }

    if (autoStart.web) {
        self.log.info({ autostart: 'Web Service'});
        go.push(self.start('WebServiceController'));
    }

    if (autoStart.plex) {
        self.log.info({ autostart: 'Plex Service'});
        go.push(self.start('PlexServiceController'));
    }

    if (autoStart.downloader) {
        self.log.info({ autostart: 'Feed Download Service'});
        go.push(self.start('FeedDownloadServiceController'));
    }

    return self.Promise.all(go);
};

ServiceController.prototype.start = function start(serviceName) {

    const self = this;

    let prom = self.Promise.resolve();

    if (self.services[serviceName] && self.services[serviceName].svc.status === 1) {
        self.log.info('stopping service: ', serviceName);
        prom = self.services[serviceName].svc.stop();
        clearInterval(self.services[serviceName].interval);
    }

    prom.then(() => {

        let service,
            container = {};

        service = self.dp.resolver(serviceName);

        service.on('controller', self.handleMessage.bind(self, serviceName));
        service.on('error', self.handleError.bind(self, serviceName));

        container.svc = service;
        container.status = function () {
            if (service.status === 0) {
                return 'Never started';
            }
            if (service.status === 2) {
                return 'Stopped';
            }
            return 'Running';
        };

        service.start()
            .catch((err) => {
                self.log.error(err);
                throw err;
            });
        self.services[serviceName] = container;
        self.log.debug({ func: 'ServiceController.start', serviceName: serviceName, status: container.status() });

        container.interval = setInterval(() => {
            self.log.debug({ func: 'ServiceController.start', serviceName: serviceName, status: container.status() });
        }, 60000);

        return container;
    });

    return prom;
};


ServiceController.prototype.handleMessage = function handleMessage(serviceName, message) {
    this.log.info(message);
};

ServiceController.prototype.handleError = function handleError(serviceName, message) {
    this.log.error(message);
    this.start(serviceName);
};
