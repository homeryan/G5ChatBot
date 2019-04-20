// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisHelper } = require('./luisHelper');
const { yelpSearch } = require('../utils/yelp');
const { newsSearch } = require('../utils/bingNewsSearch');
const { createCard } = require('../utils/card');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
// const BOOKING_DIALOG = 'bookingDialog';

class MainDialog extends ComponentDialog {
    constructor(logger) {
        super('MainDialog');

        if (!logger) {
            logger = console;
            logger.log('[MainDialog]: logger not passed in, defaulting to console');
        }

        this.logger = logger;

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }


    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async introStep(stepContext) {
        if (!process.env.LuisAppId || !process.env.LuisAPIKey || !process.env.LuisAPIHostName) {
            await stepContext.context.sendActivity('NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.');
            return await stepContext.next();
        }

        let userInput = {};
        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Call LUIS and gather user intents.
            userInput = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);
            this.logger.log('LUIS extracted these info:', userInput);
        }

        if (userInput.intent === 'Greeting') {
            await stepContext.context.sendActivity('Howdy!\nI can help you with places to eat. I can tell you news.');
            return await stepContext.endDialog();
        }        

        if (userInput.intent === 'Places_FindPlace' ||
            userInput.intent === 'News') {
            return await stepContext.next();
        }

        return await stepContext.prompt('TextPrompt', { prompt: 'What can I help you with today?' });
    }

    async actStep(stepContext) {
        let userInput = {};
        
        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Call LUIS and gather user intents.
            userInput = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);
            this.logger.log('LUIS extracted these info:', userInput);
        }

        if (userInput.intent === 'News') {
            const newsItems = await newsSearch(userInput.searchKeyword);
            const itemNumbers = (newsItems.length > 5) ? 5 : newsItems.length;
            for (let i = 0; i < itemNumbers; i++) {
                const newsItem = newsItems[i];
                const imgUrl = (newsItem.image === undefined) ? '' : newsItem.image.thumbnail.contentUrl;
                const card = createCard(imgUrl, 
                    newsItem.description,
                    newsItem.name,
                    newsItem.url);
                await stepContext.context.sendActivity({ attachments: [card] });
            }

            return await stepContext.endDialog();
        }

        if (userInput.intent === 'Places_FindPlace') {
            const businesses = await yelpSearch(userInput.searchKeyword);
            const length = businesses.length;

            if (length === 0) {
                await stepContext.context.sendActivity({
                    text: 'Sorry, I can\' find anything.',
                    attachments: [{
                        "contentType": 'image/jpg',
                        "contentUrl": 'https://g5logo.blob.core.windows.net/logo/what_qqq.jpg',
                        "name": 'What???'
                    }]
                });
                return await stepContext.endDialog();
            }

            for (let i = 0; i < length; i++) {
                const biz = businesses[i];
                const bizInfo = biz.rating + ' Stars\n' 
                    + biz.price + '\n'
                    + biz.location.display_address.join(' ') + '\n'
                    + biz.display_phone;
                const card = createCard(biz.image_url, bizInfo, biz.name, biz.url, 'stretch');
                await stepContext.context.sendActivity({ attachments: [card] });
            }            
            await stepContext.context.sendActivity({ text: 'Thank you.' });
            return await stepContext.endDialog();
        }

        await stepContext.context.sendActivity({
            text: 'What are you talking about?',
            attachments: [{
                "contentType": 'image/jpg',
                "contentUrl": 'https://g5logo.blob.core.windows.net/logo/what_qqq.jpg',
                "name": 'What???'
            }]
        });
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
