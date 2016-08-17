"use strict";

const request = require('request');
const format = require('string-template');
const util = require('util');
const moment = require('moment');
const Connection = require('./DatabaseAccessor.js');
const Rx = require('rx');


class NhacUpdater {

    constructor(logFactory, config, slackUpdater) {
        this.logger = logFactory.createLogger('NhacUpdater');
        this.connection = new Connection(logFactory, config.db);
        this.config = config;
        this.slackUpdater = slackUpdater;
    }

    update() {

        this.notify("Starting NhacUpdater Run");
        this.logger.info("Starting NhacUpdater Run");

        return this.getSongs().flatMap(songs => {
            return this.connection.insert(songs);
        }).doOnError(err => {
            this.notify("Error while updating songs.");
        }).finally(() => {
            this.notify("Finished updating songs.");
        });
    }

    getSongs() {
        const charts = Rx.Observable.from(this.config.charts);
        const playlists = Rx.Observable.from(this.config.playlists);

        const songsFromCharts = charts.flatMap(chart => this.getSongsFromChart(chart));
        const songsFromPlayLists = playlists.flatMap(playlist => this.getSongsFromPlaylist(playlist.url, playlist.name));

        return Rx.Observable.merge(songsFromCharts, songsFromPlayLists).toArray();
    }

    getSongsFromPlaylist(url, playlistName) {
        this.logger.info("Getting songs from playlist %s. URL: %s", playlistName, url);

        return Rx.Observable.create(obs => {
            request(url, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    const result = JSON.parse(body);
                    const songs = result.docs;

                    this.logger.info("Received response: %d songs.", songs.length);

                    this.notify("Number of songs to update: " + songs.length);

                    songs.forEach(song => obs.onNext(song));
                    obs.onCompleted();
                } else {
                    this.logger.error({
                        err: err,
                        res: response
                    }, "Error while getting songs");
                    obs.onError();
                }
            });
        });
    }

    getSongsFromChart(urlFormat) {

        const weekNumber = moment().format("W");
        const year = moment().format("gggg");
        const url = format(urlFormat, {
            week: weekNumber,
            id: 1,
            year: year
        });

        const startingMessage = 'Getting latest songs for chart week ' + weekNumber + '/' + year;
        this.logger.info(startingMessage);
        this.logger.info('Requesting %s.', url);

        return Rx.Observable.create(obs => {
            request(url, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    const result = JSON.parse(body);
                    const week = result.week;
                    const songs = result.item;

                    this.logger.info("Received response: %d songs.", songs.length);

                    this.notify("Number of songs to update: " + songs.length);

                    songs.forEach(song => obs.onNext(song));
                    obs.onCompleted();
                } else {
                    this.logger.error({
                        err: err,
                        res: response
                    }, "Error while getting songs");
                    obs.onError();
                }
            });
        });
    }

    notify(message) {
        if (this.slackUpdater) {
            this.slackUpdater.sendMessage(message);
        }
    }
};

module.exports = NhacUpdater;