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
        { type: "button", name: "sup", text: "sup", value: "sup" },
        { type: "button", name: "Hiya", text: "Hiya", value: "Hiya" }
      ]
    }]
  };

  // ephemeral reply
  bot.replyPrivate(message);
});


slack.on('/greet', (msg, bot) => {
  let message = {
    "text": "Hello world!"
  };

  // ephemeral reply
  bot.reply(message);
});

slack.on('/build', (msg, bot) => {
  let message = {
    "attachments": [{
      "text": "Would you like to merge?",
      "fallback": 'unable to choose a game',
      "callback_id": "wopr_game",
      "color": "#3AA3E3",
      "actions": [
        { "type": "button", "name": "game", "text": "No", "style": "danger", "value": "no" },
        { "type": "button", "name": "game", "text": "Yes", "style": "primary", "value": "yes",
          "confirm": {
            "title": "Are you sure?",
            "text": "You only should if you know the build will pass.",
            "ok_text": "Yes",
            "dismiss_text": "No"
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

//Command to create a pipeline with a given name
slack.on('/launch-pipeline', (msg, bot) => {

    var buildServer = 'build.liatrio.com';

    var jenkinsApi = require('jenkins-api');
    var serverAddr = 'https://' + process.env.JENKINS_API_CREDENTIALS + '@build.liatrio.com';
    var jenkins = jenkinsApi.init(serverAddr);

    jenkins.build('pipeline-pal-folder/job/testing/job/rich-slack', function(err, data) {
        if(err || data.statusCode != 201){
            console.log("An error occurred: " + err + "\n Data:");
            console.log(data);
            bot.replyPrivate({text: 'There was an error starting pipeline: ' + err});
        } else {
            bot.replyPrivate({text: "Job started.  Look for it here: https://" + buildServer + "/job/" + "pipeline-pal-folder/job/testing/job/rich-slack"});
        }
    });

});

//Command to create a pipeline with a given name
slack.on('/get-tickets', (msg, bot) => {

  var JIRA_CREDS = process.env.JIRA_API_CREDENTIALS;
  var JiraClient = require('jira-connector');

  var jira = new JiraClient( {
    host: 'liatrio.atlassian.net',
    basic_auth: {
      username: JIRA_CREDS.split(":")[0],
      password: JIRA_CREDS.split(":")[1]
    }
  });

  jira.issue.getIssue({
    issueKey: 'LIB-15'
  }, function(error, issue) {
    console.log(issue.fields.summary);
  });

  bot.reply({title: "Test", title_link: "www.google.com", color: '#36a64f'});

});

//Dev Command to create a pipeline with a given name
slack.on('/get-tickets2', (msg, bot) => {

  bot.reply({text: "Hyperlink <http://www.google.com|here>"});

   // bot.reply({text: "Testing"});
    var ticket = [];
    var temp1 = {
       t_summary: "Sample Summary",
       t_status: "Done",
       t_link: "www.google.com"
    };

    var temp2 = {
       t_summary: "Sample Summary2",
       t_status: "In Prog",
       t_link: "www.youtube.com"
    };

    ticket.push(temp1);
    ticket.push(temp2);


    var ticket_Length = ticket.length;
    for (var i = 0; i < ticket_Length; i++)
    {
        var temp = ticket[i].t_link
       // var linkedText = <ticket[i].t_link|ticket[i].t_summary>;
        let message =  {
            "text": `<${temp}|${ticket[i].t_summary}>` + ' - ' + ticket[i].t_status
        };
        bot.reply(message);
    }
    bot.reply(message);
   //bot.reply({text: ticket[i].t_summary + '-' + ticket[i].t_status});
});

// Interactive Message handler
slack.on('wopr_game', (msg, bot) => {
  var message;
  if (msg.actions[0].value == "yes"){
    msg = {
      "title": "Build",
      "pretext": "Building our app",
      "attachments": [{
        "author_name": "Building Credit Card app",
        "author_icon": "https://images.atomist.com/rug/pulsating-circle.gif",
        "color": "#cccc00",
        "fallback": 'unable to choose a game'
      }],
      "mrkdwn_in": [
        "text",
        "pretext"
      ]
    };
    bot.reply(msg);
    var start = new Date().getTime();
    for (var i = 0; i < 10000000; i++) {
      if ((new Date().getTime() - start) > 10000){
              break;
      }

    }
    msg = {
      "title": "Build",
      "pretext": "Built our app",
      "attachments": [{
        "author_name": "Build has passed!",
        "author_icon": "https://images.atomist.com/rug/check-circle.png",
        "color": "#45B254",
        "fallback": 'unable to choose a game'
      }],
      "mrkdwn_in": [
        "text",
        "pretext"
      ]
    };
    bot.reply(msg);
  }

  // public reply


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
