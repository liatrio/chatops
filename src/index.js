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

    var opts = {
      boardId: msg.text.split(" ")[0],
      maxResults: "9999",
      fields: ["status", "summary"]
    };

    var statusFilter = (msg.text.split(" ")[1] == undefined ? "to do" : msg.text.substr(msg.text.indexOf(' ')+1).toLowerCase());
    console.log(statusFilter);
    var output = "Ticket list for " + msg.text.split(" ")[0];
    var ticketAttachments = [];
    jira.board.getIssuesForBoard(opts, function(error, issues) {
      if (error) {
        console.log("error");
        output = "There was an error: " + error;
      } else {
        console.log(issues.issues.length);
        for (var i = 0; i < issues.issues.length; i++) {
          var newTicket = {
            t_key: issues.issues[i].key,
            t_summary: issues.issues[i].fields.summary,
            t_status: issues.issues[i].fields.status.name,
            t_link: "https://" + JIRA_HOST + "/secure/RapidBoard.jspa?rapidView=" + msg.text.split(" ")[0] + "&modal=detail&selectedIssue=" + issues.issues[i].key
          };
          console.log(issues.issues[i]);
          if (newTicket.t_status.toLowerCase() == statusFilter) {
            // output += '\n' + newTicket.t_key + ' : ' +  `<${newTicket.t_link}|${newTicket.t_summary}>` + ' - ' + newTicket.t_status;
            var ticketAttachment = {
              text: `<${newTicket.t_link}|${newTicket.t_key}>` + ': ' + "`" + newTicket.t_status + "` " + newTicket.t_summary
            }
            ticketAttachments.push(ticketAttachment);
          }
        }
      }
      console.log("End of get issues");
      bot.reply({text: output, attachments: ticketAttachments});
      console.log(output);
    });
  }

});

//Dev Command to create a pipeline with a given name
slack.on('/get-tickets-dev', (msg, bot) => {
   // bot.reply({text: "Testing"});
    var ticket = [];

     var temp0 = {
       t_number: "121",
       t_summary: "Research Ways To Embed Kibana Into A Webpage",
       t_status: "To Demo",
       t_link: "https://liatrio.atlassian.net/secure/RapidBoard.jspa?rapidView=57&projectKey=ENG&modal=detail&selectedIssue=ENG-121"
    };
    var temp1 = {
       t_number: "122",
       t_summary: "Canvas JS demo",
       t_status: "To Do",
       t_link: "https://liatrio.atlassian.net/secure/RapidBoard.jspa?rapidView=57&projectKey=ENG&modal=detail&selectedIssue=ENG-122"
    };

    var temp2 = {
       t_number: "123",
       t_summary: "Grafana Demo",
       t_status: "To Do",
       t_link: "https://liatrio.atlassian.net/secure/RapidBoard.jspa?rapidView=57&projectKey=ENG&modal=detail&selectedIssue=ENG-123"
    };

     var temp3 = {
       t_number: "124",
       t_summary: "Dashboard ElasticSearch Mapping",
       t_status: "In Progress",
       t_link: "https://liatrio.atlassian.net/secure/RapidBoard.jspa?rapidView=57&projectKey=ENG&modal=detail&selectedIssue=ENG-124"
    };

     var temp4 = {
       t_number: "125",
       t_summary: "Research pulling results from Selenium into ElasticSearch",
       t_status: "In Progress",
       t_link: "https://liatrio.atlassian.net/secure/RapidBoard.jspa?rapidView=57&projectKey=ENG&modal=detail&selectedIssue=ENG-125"
    };

    ticket.push(temp0);
    ticket.push(temp1);
    ticket.push(temp2);
    ticket.push(temp3);
    ticket.push(temp4);
    /*
    for (var j = 0; j < 5; i++)
    {
        ticket.push(temp[j]);
    }
    */

    var message = 'Showing Tickets for ' + msg.text + '\n'
    var ticket_Length = ticket.length;
    for (var i = 0; i < ticket_Length; i++)
    {
        message += msg.text + '-' + ticket[i].t_number + ' : ' +  `<${ticket[i].t_link}|${ticket[i].t_summary}>` + ' - ' + ticket[i].t_status + '\n';
    }
    bot.reply({text: message});
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
