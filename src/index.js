'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');


// The function that AWS Lambda will call
exports.handler = slack.handler.bind(slack);


// Slash Command handler

//Greeter (to validate bot is working)
slack.on('/pipeline-pal-greet', (msg, bot) => {
  let message = {
    text: "How would you like to greet the channel?",
    attachments: [{
      fallback: 'actions',
      callback_id: "greetings_click",
      actions: [
        { type: "button", name: "Wave", text: ":wave:", value: ":wave:" },
        { type: "button", name: "Hello!", text: "Hello!", value: "Hello!" },
        { type: "button", name: "Howdy", text: "Howdy", value: "Howdy" },
        { type: "button", name: "Hiya", text: "Hiya", value: "Hiya" }
      ]
    }]
  };

  // ephemeral reply
  bot.replyPrivate(message); 
});


slack.on('/greet', (msg, bot) => {
  let message = {
    "text": "Would you like to play a game?",
    "attachments": [{
      "text": "Choose a game",
      "fallback": 'unable to choose a game',
      "callback_id": "wopr_game",
      "color": "#3AA3E3",
      "actions": [
        { "type": "button", "name": "game", "text": "Chess", "value": "chess" },
        { "type": "button", "name": "game", "text": "Falken's Maze", "value": "maze" },
        { "type": "button", "name": "game", "text": "Thermonuclear War", "style": "danger", "value": "war",
          "confirm": {
            "title": "Are you sure?",
            "text": "Wouldn't you like to play a nice game of chess?",
            "ok_text": "No",
            "dismiss_text": "Yes"
          }
        }
      ]
    }]
  };

  // ephemeral reply
  bot.reply(message); 
});

//Command to create a pipeline with a given name
slack.on('/create-pipeline', (msg, bot) => {

    var buildServer = 'build.liatrio.com';

    var jenkinsApi = require('jenkins-api');
    var serverAddr = 'https://' + process.env.JENKINS_API_CREDENTIALS + '@build.liatrio.com';
    var jenkins = jenkinsApi.init(serverAddr);

    if (msg.text === '') {
        console.log('Command received with no name specified');
        bot.replyPrivate({text:"Pipeline name wasn't specified - use `/create-pipeline [pipeline-name]`"});
    } else {
        console.log("Command received with name: " + msg.text);
        console.log("Using job name: " + process.env.JENKINS_TARGET_JOB);
        console.log("Job should be located at https://" + buildServer + "/job/" + process.env.JENKINS_TARGET_JOB)
        jenkins.build_with_params(process.env.JENKINS_TARGET_JOB, {pipeline_name: msg.text}, function(err, data) {
            if(err || data.statusCode != 201){
                console.log("An error occurred: " + err + "\n Data:");
                console.log(data);
                bot.replyPrivate({text: 'There was an error with creating your pipeline: ' + err});
            } else {
                bot.replyPrivate({text: "Job started.  Look for it here: https://" + buildServer + "/job/" + process.env.JENKINS_TARGET_JOB});
            }
        });
    }

});

// Interactive Message handler
slack.on('wopr_game', (msg, bot) => {
  var message;
  if (msg.actions[0].value == "war"){
    msg = {
      "title": "Build",
      "pretext": "Building our app",
      "attachments": [{
        "author_name": "Building Credit Card app",
        "author_icon": "https://images.atomist.com/rug/pulsating-circle.gif",
        "color": "#45B254",
        "fallback": 'unable to choose a game'
      }],
      "mrkdwn_in": [
        "text",
        "pretext"
      ]
    };
    //message = {
    //  "title": "Build",
    //  "pretext": "Building our app",
    //  "attachments": [{
    //    "author_name": "Building Credit Card app",
    //    "author_icon": "https://images.atomist.com/rug/pulsating-circle.gif",
    //    "color": "#45B254",
    //    "fallback": 'unable to choose a game'
    //  }],
    //  "mrkdwn_in": [
    //    "text",
    //    "pretext"
    //  ]
    //};
  }

  // public reply
  bot.reply(msg);
});

// Interactive Message handler
slack.on('greetings_click', (msg, bot) => {
  let message = { 
    // selected button value
    text: msg.actions[0].value 
  };  

  // public reply
  bot.reply(message);
});


// Reaction Added event handler
slack.on('reaction_added', (msg, bot) => {
  bot.reply({ 
    text: ':wave:' 
  });
});
