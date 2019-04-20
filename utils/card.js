// Copyright Hong Yan. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder-core');

function createCard(imageUrl, text, urlText, relatedUrl, size = 'auto') {
  const card = {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [],
    "actions": []
  };

  card.body.push({ "type": 'Image', "url": imageUrl, "size": size });
  card.body.push({
    "type": "TextBlock",
    "spacing": "medium",
    "size": "default",
    "text": text,
    "wrap": true,
    "maxLines": 0
  });
  card.actions.push({
    "type": "Action.OpenUrl",
    "title": urlText,
    "url": relatedUrl
  });

  return CardFactory.adaptiveCard(card);
}

module.exports.createCard = createCard;