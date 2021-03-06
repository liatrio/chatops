'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');
const request = require('request');
var querystring = require('querystring');


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

//Command to take a ticket with a certain ID
slack.on('/take-ticket', (msg, bot) => {

  if (msg.text == "") {
    bot.reply({text: "Please specify a JIRA ticket to assign to yourself."});
  } else {

    var JIRA_CREDS = process.env.JIRA_API_CREDENTIALS;
    var JiraClient = require('jira-connector');

    var jira = new JiraClient( {
      host: 'liatrio.atlassian.net',
      basic_auth: {
        username: JIRA_CREDS.split(":")[0],
        password: JIRA_CREDS.split(":")[1]
      }
    });

    console.log(msg);
    const auth = "Bearer " + process.env.ACCESS_TOKEN;
    const key = msg.text.trim();
    const options = { 
      method: 'GET', url: 'https://liatrio.slack.com/api/users.list',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': auth }
    };
    request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        const list = JSON.parse(body);
        console.log(list);
        for (var i = 0; i < list.members.length; i++){
          if (list.members[i].name == msg.user_name){
            jira.issue.assignIssue({ issueKey: key, assignee: list.members[i].profile.email.split("@")[0]}, function(error, issue) {
              if (error) {
                bot.replyPrivate({text: "failure"});
              }
              else {
                bot.replyPrivate({text: "Issue has been assigned to you."});
              }
            });
          }
        }
      }
      else {
        console.log(error);
      }
    });

  }

});

//Command to close a ticket with a certain ID
slack.on('/close-ticket', (msg, bot) => {

  if (msg.text == "") {
    bot.reply({text: "Please specify a JIRA ticket to move to done."});
  } else {

    var JIRA_CREDS = process.env.JIRA_API_CREDENTIALS;
    var JiraClient = require('jira-connector');
    var key = msg.text.trim();

    var jira = new JiraClient( {
      host: 'liatrio.atlassian.net',
      basic_auth: {
        username: JIRA_CREDS.split(":")[0],
        password: JIRA_CREDS.split(":")[1]
      }
    });
    jira.issue.getTransitions({ issueKey: key}, function(error, transitions) {
      if (error) {
        console.log("failure");
      }
      else {
        var transitionId = transitions.transitions[transitions.transitions.length-1].id
        var closed = { 
          update: { comment: [{ add: { body: "This ticket was closed via a Slack command." } }] },
          fields: {},
          transition: { id: `${transitionId}`}
        };
        jira.issue.transitionIssue({ issueKey: key, transition: closed}, function(error, issue) {
          if (error) {
            console.log(error);
          }
          else {
            bot.replyPrivate({text: "Issue has been closed."});
          }
        });
      }
    });

  }

});

//Command to create a pipeline with a given name
slack.on('/get-tickets', (msg, bot) => {

  if (msg.text == "") {
    bot.reply({text: "Please specify a JIRA board to query."});
  } else {

    var JIRA_CREDS = process.env.JIRA_API_CREDENTIALS;
    var JiraClient = require('jira-connector');

    var JIRA_HOST = 'liatrio.atlassian.net';

    var jira = new JiraClient( {
      host: "liatrio.atlassian.net",
      basic_auth: {
        username: JIRA_CREDS.split(":")[0],
        password: JIRA_CREDS.split(":")[1]
      }
    });

    var statusFilter = (msg.text.split(" ")[1] == undefined ? "to do" : msg.text.substr(msg.text.indexOf(' ')+1).toLowerCase());

    var opts = {
      boardId: msg.text.split(" ")[0],
      maxResults: "9999",
      fields: ["status", "summary"],
      jql: "status in ('" + statusFilter + "')"
    };

    var output = "Ticket list for " + msg.text.split(" ")[0];
    var ticketAttachments = [];

    jira.board.getIssuesForBoard(opts, function(error, issues) {
      if (error) {
        output = "There was an error: " + error;
      } else {
        for (var i = 0; i < issues.issues.length; i++) {
          var newTicket = {
            t_key: issues.issues[i].key,
            t_summary: issues.issues[i].fields.summary,
            t_status: issues.issues[i].fields.status.name,
            t_link: "https://" + JIRA_HOST + "/secure/RapidBoard.jspa?rapidView=" + msg.text.split(" ")[0] + "&modal=detail&selectedIssue=" + issues.issues[i].key
          };
          var ticketAttachment = {
            text: `<${newTicket.t_link}|${newTicket.t_key}>` + ': ' + newTicket.t_summary + " - *" + newTicket.t_status + "*"
          }
          ticketAttachments.push(ticketAttachment);
        }
      }
      bot.reply({text: output, attachments: ticketAttachments});
    });
  }

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
