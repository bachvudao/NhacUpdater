"use strict";

const Slack = require('slack-node');

class SlackNotifier {
    constructor(logFactory, config) {
        this.logger = logFactory.createLogger('SlackNotifier');
        this.NotifierName = config.NotifierName;
        this.slack = new Slack();
        this.slack.setWebhook(config.WebhookUri);
    }

    sendMessage(message) {
        this.slack.webhook({
            channel: "#app-notification",
            username: this.NotifierName,
            text: message
        }, (err, response) => {
            if (err) {

                this.logger.error({
                    err: err,
                    res: response,
                    msg: message
                }, "Error while posting message to slack");
            }
        });
    }
}

module.exports = SlackNotifier;