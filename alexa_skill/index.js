const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');


const LANG_STRINGS = {
  'en': {
    translation: {
      HELP_PROMPT: "TODO-LOCALIZATION",
    }
  }
};

const DDB_TABLE_NAME = 'TFRaffleTable';
const WELCOME = "Welcome to the teacher fund daily raffle! "
        + "Enter into daily raffles for a chance to win cash prizes "
        + "and contribute to public school education funding!";
const HELP_PROMPT = "You can ask to hear today's winner or you "
        + "can enter tomorrow's raffle. What would you like to do? ";
const CANNOT_PURCHASE = "There was an issue with purchasing entries, so we will cancel it for now. ";
const STOP_BUY = "We won't buy entries for now. ";
const THANK_BUY = "Thank you for purchasing entries! The proceeds will go directly to Teacher Fund. "

const ERROR = "This skill encountered an error.  Please contact Teacher Fund for help.";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    let speechOutput = WELCOME;
    let reprompt = HELP_PROMPT;
 
    let entryText = "";
    // Customer has enties avail. Let them know how many
    if (sessionAttributes.entriesAvailable > 0) {
      entryText = "You have " +
         sessionAttributes.entriesAvailable
         + " that you can use. ";
    }

    if (supportsAPL(handlerInput)) {
      handlerInput.responseBuilder
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            document: require('./lr.json')
          });
    }
    return handlerInput.responseBuilder
      .speak(speechOutput + entryText + reprompt)
      .reprompt(entryText + reprompt)
      .withSimpleCard('TeacherFund Daily Raffle', speechOutput)
      .getResponse();
  },
};


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    if (supportsAPL(handlerInput)) {
      handlerInput.responseBuilder
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            document: require('./lr.json')
          });
    }
    return handlerInput.responseBuilder
      .speak(HELP_PROMPT)
      .reprompt(HELP_PROMPT)
      .withSimpleCard('TeacherFund Daily Raffle', HELP_PROMPT)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent')) ||
      (handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
        handlerInput.requestEnvelope.request.name === 'Cancel' &&
        handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED');
  },
  handle(handlerInput) {
    const speechOutput = 'Thank you for visiting Teacher Fund! Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard('TeacherFund Daily Raffle', speechOutput)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    console.log("Error in request "  + JSON.stringify(handlerInput.requestEnvelope.request));

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    try {
      return handlerInput.responseBuilder
        .speak(ERROR)
        .reprompt(ERROR)
        .getResponse();
    } catch (err) {
      console.log(`The ErrorHandler encountered an error: ${err}`);
      // this is fixed text because it handles the scenario where the i18n doesn't work correctly
      return handlerInput.responseBuilder
        .speak(ERROR)
        .getResponse();
    }
  }
};

//----------------------------------------------------------------------
//---------------------------RAFFLE HANDLERS----------------------------
//----------------------------------------------------------------------

const EntryInventoryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'EntryInventoryIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const speechOutput = "You have " +
         sessionAttributes.entriesAvailable
         + " that you can use. ";
    const reprompt = HELP_PROMPT;

    return handlerInput.responseBuilder
      .speak(speechOutput + reprompt)
      .reprompt(reprompt)
      .getResponse();
  },
};

const CheckDailyRaffleWinnerIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'EnterDailyRaffleIntentHandler';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    // Determine if the customer has purchased the hint_pack
    return ms.getInSkillProducts(locale).then(function(res) {
      var product = res.inSkillProducts.filter(record => record.referenceName == 'hint_pack');
      
      if (isEntitled(product)) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const index = sessionAttributes.currentHintIndex;

        // Read all hints the customer has asked for thus far
        let speechText = "Okay, here are your hints: ";
        let i = 0;
        while (i <= index) {
          speechText += sessionAttributes.currentRiddle.hints[i] + ", ";
          i++;
        }
        speechText += ". Here is your question again: "
            + sessionAttributes.currentRiddle.question;

        // Update the current hint index, maximum of 3 hints per riddle
        sessionAttributes.currentHintIndex = index == 2 ? 2 : (index + 1);
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(sessionAttributes.currentRiddle.question)
          .withSimpleCard('Level Up Riddles', speechText)
          .getResponse();
      } else {
        const upsellMessage = "You don't currently own the hint pack. Want to learn more about it?";
                    
        return handlerInput.responseBuilder
          .addDirective({
            'type': 'Connections.SendRequest',
            'name': 'Upsell',
            'payload': {
              'InSkillProduct': {
                'productId': product[0].productId
              },
              'upsellMessage': upsellMessage
            },
            'token': 'correlationToken'
          })
          .getResponse();
      }
    });
  }
};

const EnterRaffleIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'EnterDailyRaffleIntentHandler';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    // Determine if the customer has purchased the hint_pack
    return ms.getInSkillProducts(locale).then(function(res) {
      var product = res.inSkillProducts.filter(record => record.referenceName == 'hint_pack');
      
      if (isEntitled(product)) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const index = sessionAttributes.currentHintIndex;

        // Read all hints the customer has asked for thus far
        let speechText = "Okay, here are your hints: ";
        let i = 0;
        while (i <= index) {
          speechText += sessionAttributes.currentRiddle.hints[i] + ", ";
          i++;
        }
        speechText += ". Here is your question again: "
            + sessionAttributes.currentRiddle.question;

        // Update the current hint index, maximum of 3 hints per riddle
        sessionAttributes.currentHintIndex = index == 2 ? 2 : (index + 1);
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(sessionAttributes.currentRiddle.question)
          .withSimpleCard('Level Up Riddles', speechText)
          .getResponse();
      } else {
        const upsellMessage = "You don't currently own the hint pack. Want to learn more about it?";
                    
        return handlerInput.responseBuilder
          .addDirective({
            'type': 'Connections.SendRequest',
            'name': 'Upsell',
            'payload': {
              'InSkillProduct': {
                'productId': product[0].productId
              },
              'upsellMessage': upsellMessage
            },
            'token': 'correlationToken'
          })
          .getResponse();
      }
    });
  }
};

const BuyEntryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'BuyEntryIntent';
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    // SAVING SESSION ATTRIBUTES TO PERSISTENT ATTRIBUTES,
    // BECAUSE THE SESSION EXPIRES WHEN WE START A CONNECTIONS DIRECTIVE.
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
    persistentAttributes.currentSession = sessionAttributes;
    handlerInput.attributesManager.savePersistentAttributes();

    const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return ms.getInSkillProducts(handlerInput.requestEnvelope.request.locale).then((res) => {
      const entryPack = res.inSkillProducts.filter(record => record.referenceName === 'Five_Entries_Pack');
      if (entryPack.length > 0 && entryPack[0].purchasable === 'PURCHASABLE') {
        return handlerInput.responseBuilder
          .addDirective({
            'type': 'Connections.SendRequest',
            'name': 'Buy',
            'payload': {
              'InSkillProduct': {
                'productId': entryPack[0].productId,
              },
            },
            'token': 'correlationToken',
          })
          .getResponse();
      }
      return handlerInput.responseBuilder
        .speak(CANNOT_PURCHASE)
        .getResponse();
    });
  },
};

const CancelPurchaseIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'CancelPurchaseIntent';
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
    persistentAttributes.currentSession = sessionAttributes;
    handlerInput.attributesManager.savePersistentAttributes();

    const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return ms.getInSkillProducts(handlerInput.requestEnvelope.request.locale).then((res) => {
      const entryPack = res.inSkillProducts.filter(record => record.referenceName === 'Five_Entries_Pack');
      if (entryPack.length > 0 && entryPack[0].purchasable === 'PURCHASABLE') {
        return handlerInput.responseBuilder
          .addDirective({
            'type': 'Connections.SendRequest',
            'name': 'Cancel',
            'payload': {
              'InSkillProduct': {
                'productId': entryPack[0].productId,
              },
            },
            'token': 'correlationToken',
          })
          .getResponse();
      }
      return handlerInput.responseBuilder
        .speak(CANNOT_PURCHASE)
        .getResponse();
    });
  },
};

const BuyEntryResponseHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
      (handlerInput.requestEnvelope.request.name === 'Upsell' ||
        handlerInput.requestEnvelope.request.name === 'Buy');
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
    // TODO rehydrate attributes returning from connections directive

    console.log(`SESSION ATTRIBUTES = ${JSON.stringify(sessionAttributes)}`);

    let speechOutput = "";
    let reprompt = HELP_PROMPT;

    if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
      // IF THE USER DECLINED THE PURCHASE.
      speechOutput = STOP_BUY;
    } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
      // IF THE USER SUCCEEDED WITH THE PURCHASE.
      speechOutput = THANK_BUY;
    } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ERROR') {
      // IF SOMETHING ELSE WENT WRONG WITH THE PURCHASE.
      speechOutput = CANNOT_PURCHASE;
    }

    // CLEAR OUR OUR PERSISTED SESSION ATTRIBUTES.
    persistentAttributes.currentSession = undefined;
    handlerInput.attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(speechOutput + reprompt)
      .reprompt(reprompt)
      .getResponse();
  },
};

//----------------------------------------------------------------------
//--------------------------INVENTORY HELPERS---------------------------
//----------------------------------------------------------------------

function isProduct(product) {
  return product && product.length > 0;
}

function isEntitled(product) {
  return isProduct(product) && product[0].entitled == 'ENTITLED';
}

async function checkInventory(handlerInput) {
  const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  if (persistentAttributes.entriesUsed === undefined) persistentAttributes.entriesUsed = 0;
  if (persistentAttributes.entriesPurchased === undefined) persistentAttributes.entriesPurchased = 0;

  const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

  return ms.getInSkillProducts(handlerInput.requestEnvelope.request.locale).then((res) => {
    if (res.inSkillProducts.length > 0) {
      const entriesPack = res.inSkillProducts[0];

      // x5 because each purchase contains five entries.
      const entriesPurchased = (entriesPack.activeEntitlementCount * 5);

      if (persistentAttributes.entriesPurchased > entriesPurchased) {
        // THIS CAN HAPPEN IF A CUSTOMER RETURNS AN ACCIDENTAL PURCHASE.
        // YOU SHOULD RESET THEIR TOTALS TO REFLECT THAT RETURN.
        persistentAttributes.entriesPurchased = entriesPurchased;

        if (persistentAttributes.entriesUsed > entriesPurchased) {
          // IF THE USER HAS USED MORE ENTRIES THAN THEY HAVE PURCHASED,
          // SET THEIR TOTAL "USED" TO THE TOTAL "PURCHASED."
          persistentAttributes.entriesUsed = entriesPurchased;
        }
      } else if (persistentAttributes.entriesPurchased < entriesPurchased) {
        // THIS SHOULDN'T HAPPEN UNLESS WE FORGOT TO MANAGE OUR INVENTORY PROPERLY.
        persistentAttributes.entriesPurchased = entriesPurchased;
      }
    }

    sessionAttributes.entriesAvailable =
        persistentAttributes.entriesPurchased - persistentAttributes.entriesUsed;
    handlerInput.attributesManager.savePersistentAttributes();
  });
}

async function useEntry(handlerInput) {
  const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  sessionAttributes.entriesAvailable -= 1;
  persistentAttributes.entriesUsed += 1;
  handlerInput.attributesManager.savePersistentAttributes();
}

//----------------------------------------------------------------------
//-----------------------------APL HELPER-------------------------------
//----------------------------------------------------------------------

function supportsAPL(handlerInput) {
    const supportedInterfaces =
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}

//----------------------------------------------------------------------
//----------------------------INTERCEPTORS------------------------------
//----------------------------------------------------------------------

const LogIncomingRequestInterceptor = {
  async process(handlerInput) {
    console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
  },
};

const CheckInventoryInterceptor = {
  async process(handlerInput) {
    await checkInventory(handlerInput);
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      resources: LANG_STRINGS,
    });
    localizationClient.localize = function localize() {
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

function getPersistenceAdapter(tableName) {
  if (process.env.S3_PERSISTENCE_BUCKET) {
    // in Alexa Hosted Environment
    const s3Adapter = require('ask-sdk-s3-persistence-adapter');
    return new s3Adapter.S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET,
    });
  }

  const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter'); // included in ask-sdk
  return new ddbAdapter.DynamoDbPersistenceAdapter({
    tableName: tableName,
    createTable: true,
  });
}



const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .withPersistenceAdapter(getPersistenceAdapter(DDB_TABLE_NAME))
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    EntryInventoryIntentHandler,
    EnterRaffleIntentHandler,
    CheckDailyRaffleWinnerIntentHandler,
    BuyEntryIntentHandler,
    CancelPurchaseIntentHandler,
    BuyEntryResponseHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addRequestInterceptors(
    LogIncomingRequestInterceptor,
    LocalizationInterceptor,
    CheckInventoryInterceptor,
  )
  .withApiClient(new Alexa.DefaultApiClient())
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('tf-raffle/v1')
  .lambda();



