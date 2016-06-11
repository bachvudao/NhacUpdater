var Connection = function () {
    var configProvider = require('./NhacUpdaterConfig.js');
    var ConnectionPool = require('tedious-connection-pool');
    var Connection = require('tedious').Connection;
    var logger = require('./Logger.js');
    var util = require('util');
    var config;
    var Request = require('tedious').Request
    var TYPES = require('tedious').TYPES;
    var Rx = require('rxjs/Rx');

    var poolConfig = {
        log: true
    };


    var setupConfig = function () {
        var appConfig = configProvider.read();
        if (!config) {
            config = {
                userName: appConfig.db.username,
                password: appConfig.db.password,
                server: appConfig.db.server,
                // If you are on Azure SQL Database, you need these next options.  
                options: { encrypt: true, database: appConfig.db.database }
            };
        }

        return config;
    };

    var buildRequest = function (connection, song, subject) {
        var request = new Request("UPDATE nhac SET id=@id WHERE id=@id IF @@ROWCOUNT=0 INSERT INTO nhac (id, title, artist, lyric, thumbnail, url_320) VALUES (@id, @title, @artist, @lyric, @thumbnail, @url_320);", function (err) {
            if (err) {
                logger.error("Error while inserting row: %s.", err);
            } else {
                logger.info("Finished request for song id: %s", song.song_id);
            }

            connection.release(function () {
                subject.next(0);
            });
        });

        logger.info("Executing request for id: %s, title: %s, artist: %s, lyric: %s, thumbnail: %s, url: %s",
            song.song_id,
            song.title,
            song.artist,
            song.lyrics_file,
            song.thumbnail,
            song.source['320']);

        request.addParameter('id', TYPES.Int, song.song_id);
        request.addParameter('title', TYPES.NVarChar, song.title);
        request.addParameter('artist', TYPES.NVarChar, song.artist);
        request.addParameter('lyric', TYPES.VarChar, song.lyrics_file);
        request.addParameter('thumbnail', TYPES.VarChar, song.thumbnail);
        request.addParameter('url_320', TYPES.VarChar, song.source['320']);

        return request;
    };

    var executeInsertSongs = function (connection, song, subject) {
        var req = buildRequest(connection, song, subject);

        connection.execSql(req);
    };

    this.insert = function (songs) {
        logger.info("Adding %s songs", songs.length);

        var pool = new ConnectionPool(poolConfig, setupConfig());
        pool.on('error', function (err) {
            logger.error("Could not connect to db %s", err)
        });

        var subject = new Rx.Subject();
        subject.take(songs.length).subscribe(
            function (x) { },
            function (err) { },
            function () {
                logger.info("Processed all %s songs. Closing connection pool.", songs.length);
                pool.drain();
            });

        songs.forEach(function (song) {
            pool.acquire(function (err, connection) {
                if (err) {
                    logger.error("Could not connect to db %s", err)
                } else {
                    // If no error, then good to proceed.  
                    logger.info("Got a connected to database");
                    executeInsertSongs(connection, song, subject);
                }
            });
        }, this);
    };
};

module.exports = new Connection();