"use strict";

const Connection = function() {
    const appConfig = require('./ConfigStore.js');
    const sql = require('mssql');
    const logger = require('./Logger.js')('DatabaseAccessor');
    const util = require('util');
    const promise = require('promise');
    const Rx = require('rx');
    let config;

    const setupConfig = function() {
        if (!config) {
            config = {
                user: appConfig.db.username,
                password: appConfig.db.password,
                server: appConfig.db.server,
                database: appConfig.db.database,
                // If you are on Azure SQL Database, you need these next options.  
                options: {
                    encrypt: true
                }
            };
        }

        return config;
    };

    const executeInsertSong = function(song) {
        logger.info("Executing request for id: %s, title: %s, artist: %s, lyric: %s, thumbnail: %s, url: %s",
            song.song_id,
            song.title,
            song.artist,
            song.lyrics_file,
            song.thumbnail,
            song.source['320']);

        const request = new sql.Request();

        request.input('id', sql.Int, song.song_id);
        request.input('title', sql.NVarChar, song.title);
        request.input('artist', sql.NVarChar, song.artist);
        request.input('lyric', sql.VarChar, song.lyrics_file);
        request.input('thumbnail', sql.VarChar, song.thumbnail);
        request.input('url_320', sql.VarChar, song.source['320']);

        return Rx.Observable.fromPromise(request.query("UPDATE nhac SET id=@id WHERE id=@id IF @@ROWCOUNT=0 INSERT INTO nhac (id, title, artist, lyric, thumbnail, url_320) VALUES (@id, @title, @artist, @lyric, @thumbnail, @url_320);"))
            .tap(function(record) {
                logger.info("Finished request for song id: %s", song.song_id);
            }).catch(function() {
                logger.error("Error while inserting row: %s.", err);
                return Rx.Observable.return(undefined);
            });
    };

    this.insert = function(songs) {
        logger.info("Adding %s songs", songs.length);

        return Rx.Observable.fromPromise(
            sql.connect(setupConfig())).flatMap(function() {
            logger.info("Got a connection to database");

            const songUpdates = [];
            songs.forEach(function(song) {
                songUpdates.push(executeInsertSong(song));
            });

            return Rx.Observable.merge(songUpdates).doOnCompleted(function() {
                logger.info("Finished with all updates. Closing connection.");
                sql.close();
            });
        }).catch(function(err) {
            logger.error("Could not connect to db %s", err);

            return Rx.Observable.return(undefined);
        });
    };
};

module.exports = new Connection();
