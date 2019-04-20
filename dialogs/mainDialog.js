// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
// const { BookingDialog } = require('./bookingDialog');
const { LuisHelper } = require('./luisHelper');

const { yelpSearch } = require('../Yelp/yelp');

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
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            // .addDialog(new BookingDialog(BOOKING_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)
                // ,
                // this.finalStep.bind(this)
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

        return await stepContext.prompt('TextPrompt', { prompt: 'Howdy!\nWhat can I help you with today?' });
    }

    /**
     * Second step in the waterall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    // async actStep(stepContext) {
    //     let bookingDetails = {};

    //     if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
    //         // Call LUIS and gather any potential booking details.
    //         // This will attempt to extract the origin, destination and travel date from the user's message
    //         // and will then pass those values into the booking dialog
    //         bookingDetails = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);

    //         this.logger.log('LUIS extracted these booking details:', bookingDetails);
    //     }

    //     // In this sample we only have a single intent we are concerned with. However, typically a scenario
    //     // will have multiple different intents each corresponding to starting a different child dialog.

    //     // Run the BookingDialog giving it whatever details we have from the LUIS call, it will fill out the remainder.
    //     return await stepContext.beginDialog('bookingDialog', bookingDetails);
    // }
    async actStep(stepContext) {
        let userInput = {};
        
        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Call LUIS and gather user intents.
            userInput = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);
            this.logger.log('LUIS extracted these info:', userInput);
        }

        const businesses = await yelpSearch(userInput.searchKeyword);
        for (let i = 0; i < businesses.length; i++) {
            const biz = businesses[i];
            const businessInfo = `${biz.name}\n${biz.location.address1}\n${biz.display_phone}`
            await stepContext.context.sendActivity(businessInfo);
        }

        await stepContext.context.sendActivity('Thank you.');
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
