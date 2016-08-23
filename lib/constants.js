'use strict';

module.exports = {
    // Request Types
    REQUEST_TYPES_TV_EPISODE: 'TV_EPISODE',
    REQUEST_TYPES_TV_PACK: 'TV_PACK',
    REQUEST_TYPES_MOVIE: 'MOVIE',

    // Feed item status
    FEED_ITEM_STATUS_REMOVED: -1,
    FEED_ITEM_STATUS_NONE: 0,
    FEED_ITEM_STATUS_SELECTED: 1,
    FEED_ITEM_STATUS_CHOSEN: 2,

    // Each status should be in one of the arrays below
    TORRENT_STATUS_UNKNOWN_FAILURE: -6,
    TORRENT_STATUS_PROCESSOR_STOPPED: -5,
    TORRENT_STATUS_COMPLETION_STATUS_FAILED: -4,
    TORRENT_STATUS_ACTIVE_STATUS_FAILED: -3,
    TORRENT_STATUS_TORRENT_DOWNLOAD_RETRY_FAILED: -2,
    TORRENT_STATUS_FAILED_TO_DOWNLOAD_TORRENT: -1,
    TORRENT_STATUS_NEW: 0,
    TORRENT_STATUS_PRE_PROCESS_COMPLETE: 1,
    TORRENT_STATUS_READY_TO_DOWNLOAD_TORRENT: 2,
    TORRENT_STATUS_DOWNLOADED_TORRENT: 3,
    TORRENT_STATUS_TORRENT_ACTIVE: 4,
    TORRENT_STATUS_TORRENT_DOWNLOADING: 5,
    TORRENT_STATUS_TORRENT_COMPLETED: 6,
    TORRENT_STATUS_TORRENT_FINISH_ALL_PROCESSING: 7,
    TORRENT_STATUS_CURRENTLY_DOWNLOADING_TORRENT: 8,

    // Update these arrays if adding to the above
    TORRENT_STATUS_STILL_NEEDS_PROCESSING: [-1, 0, 1, 2, 3, 4, 5, 6, 8],
    TORRENT_STATUS_NO_MORE_PROCESSING: [7, -2, -3, -4, -5, -6],

    STATUS_PROCESSING_STATUS_COMPLETE: 0,
    STATUS_PROCESSING_STATUS_INCOMPLETE: 1
};