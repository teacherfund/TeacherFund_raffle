const Alexa = require('ask-sdk-core')

const LaunchRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle (handlerInput) {
    const speechText = 'Welcome to the teacher fund daily raffle! ' +
        'Enter into daily raffles for a chance to win cash prizes and contribute to public school education funding!'

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('TeacherFund Daily Raffle', speechText)
      .getResponse()
  }
}

const BuyIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'BuyIntent'
  },
  handle (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
    const request = handlerInput.requestEnvelope.request

    // Get the amount of tickets the user requested
    const amount = request.intent.slots.amount.value
    // Get the type of raffle the user requested
    const raffleType = request.intent.slots.productCategory.value
    sessionAttributes.amount = amount || 1
    sessionAttributes.raffleType = raffleType || 'hundred dollar'

    // TODO: add in-skill purchase of tickets and ping external server to log ticket entry

    sessionAttributes.speechText = `${amount} raffle ${amount === 1 ? 'ticket' : 'tickets'} purchased for the ${raffleType} raffle!` +
    'You will be notified of results via email!'

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes)

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speechText)
      .reprompt(sessionAttributes.speechText)
      .withSimpleCard('TeacherFund Daily Raffle', sessionAttributes.speechText)
      .getResponse()
  }
}

const WhatCanIBuyIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent'
  },
  handle (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()

    sessionAttributes.speechText = 'Today we have a 1 dollar raffle ticket for a hundred dollar minimum prize' +
    ' a 5 dollar ticket for a 1000 dollar minimum prize, and a tweet to enter for a hundre dollar minimum prize.'

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes)

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speechText)
      .reprompt(sessionAttributes.speechText)
      .withSimpleCard('TeacherFund Daily Raffle', sessionAttributes.speechText)
      .getResponse()
  }
}

const HelpIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
  },
  handle (handlerInput) {
    const speechText = 'You can purchase tickts to enter in daily raffles. The more tickets purchased, ' +
    'the higher the payout. Each raffle will have a minimum daily payout, no matter the number of entries. Beyond that ' +
    'every consecutive entry purchased, 50% will go to the pot and 50% will go towards public school education funding.'

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('TeacherFund Daily Raffle', speechText)
      .getResponse()
  }
}

const CancelAndStopIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent')
  },
  handle (handlerInput) {
    const speechText = 'Goodbye!'

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('TeacherFund Daily Raffle', speechText)
      .getResponse()
  }
}

const SessionEndedRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest'
  },
  handle (handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`)
    console.log('Error in request ' + JSON.stringify(handlerInput.requestEnvelope.request))

    return handlerInput.responseBuilder.getResponse()
  }
}

const ErrorHandler = {
  canHandle () {
    return true
  },
  handle (handlerInput, error) {
    console.log(`Error handled: ${error.message}`)

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse()
  }
}

const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    BuyIntentHandler,
    WhatCanIBuyIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .withApiClient(new Alexa.DefaultApiClient())
  .addErrorHandlers(ErrorHandler)
  .lambda()
