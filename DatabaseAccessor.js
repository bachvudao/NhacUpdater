"use strict";

const sql = require('mssql');
const util = require('util');
const promise = require('promise');
const Rx = require('rx');

class DatabaseConnection {
    constructor(logFactory, config) {
        this.config = {
            user: config.username,
            password: config.password,
            server: config.server,
            database: config.database,
            // If you are on Azure SQL Database, you need these next options.
            options: {
                encrypt: true
            }
        };
        this.logger = logFactory.createLogger('DatabaseConnection');
    }

    executeInsertSong(song) {
        this.logger.info("Executing request for id: %s, title: %s, artist: %s, lyric: %s, thumbnail: %s, url: %s",
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
            .tap(record => {
                this.logger.info("Finished request for song id: %s", song.song_id);
            }).catch(err => {
                this.logger.error("Error while inserting row: %s.", err);
                return Rx.Observable.return(undefined);
            });
    }

    insert(songs) {
        this.logger.info("Adding %s songs", songs.length);

        return Rx.Observable.fromPromise(sql.connect(this.config))
                            .flatMap(() => {
                              this.logger.info("Got a connection to database");

                              const songUpdates = [];
                              songs.forEach(song => {
                                songUpdates.push(this.executeInsertSong(song));
                              });

                              return Rx.Observable.merge(songUpdates).doOnCompleted(() => {
                                this.logger.info("Finished with all updates. Closing connection.");
                                sql.close();
                              });
        }).catch(err => {
            this.logger.error("Could not connect to db %s", err);

            return Rx.Observable.return(undefined);
        });
    }
};

module.exports = DatabaseConnection;
