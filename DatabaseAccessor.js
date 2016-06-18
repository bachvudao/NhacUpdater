var Connection = function () {
    var configProvider = require('./NhacUpdaterConfig.js');
    var sql = require('mssql');
    var logger = require('./Logger.js');
    var util = require('util');
    var promise = require('promise');
    var config;

    var setupConfig = function () {
        var appConfig = configProvider.read();
        if (!config) {
            config = {
                user: appConfig.db.username,
                password: appConfig.db.password,
                server: appConfig.db.server,
                database: appConfig.db.database,
                // If you are on Azure SQL Database, you need these next options.  
                options: { encrypt: true }
            };
        }

        return config;
    };

    var executeInsertSong = function (song) {
        logger.info("Executing request for id: %s, title: %s, artist: %s, lyric: %s, thumbnail: %s, url: %s",
            song.song_id,
            song.title,
            song.artist,
            song.lyrics_file,
            song.thumbnail,
            song.source['320']);

        var request = new sql.Request();

        request.input('id', sql.Int, song.song_id);
        request.input('title', sql.NVarChar, song.title);
        request.input('artist', sql.NVarChar, song.artist);
        request.input('lyric', sql.VarChar, song.lyrics_file);
        request.input('thumbnail', sql.VarChar, song.thumbnail);
        request.input('url_320', sql.VarChar, song.source['320']);

        return request.query("UPDATE nhac SET id=@id WHERE id=@id IF @@ROWCOUNT=0 INSERT INTO nhac (id, title, artist, lyric, thumbnail, url_320) VALUES (@id, @title, @artist, @lyric, @thumbnail, @url_320);")
            .then(function (record) {
                logger.info("Finished request for song id: %s", song.song_id);
            }).catch(function (err) {
                logger.error("Error while inserting row: %s.", err);
            });
    };

    this.insert = function (songs) {
        logger.info("Adding %s songs", songs.length);

        sql.connect(setupConfig()).then(function () {
            logger.info("Got a connection to database");

            var songUpdates = [];
            songs.forEach(function (song) {
                songUpdates.push(executeInsertSong(song));
            });

            promise.all(songUpdates).then(function(){
                logger.info("Finished with all updates. Closing connection.");
                sql.close();
            })
        }).catch(function (err) {
            logger.error("Could not connect to db %s", err);
        });
    };
};

module.exports = new Connection();