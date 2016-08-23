'use strict';

function BencodeAdapter (log, prom, bencode) {

    this.log = log;
    this.Promise = prom;
    this.bencode = bencode;
}

module.exports = BencodeAdapter;


module.exports.$name = 'BencodeAdapter';
module.exports.$deps = ['Logger', 'Promise', 'Bencode'];

BencodeAdapter.prototype.decodeString = function decodeString (str) {

    let ret;

    try {
        ret = this.bencode.decode(str, 'utf8');
        return this.Promise.resolve(ret);
    } catch (e) {
        return this.Promise.reject(e);
    }
};
