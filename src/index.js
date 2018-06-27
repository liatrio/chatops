'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');

//set up jenkins connection
var jenkinsapi = require('jenkins-api');
var jenkins = jenkinsapi.init(`https://${process.env.JENKINS_API_CREDENTIALS}@build.liatrio.com`);


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

//Command to create a pipeline with a given name
slack.on('/create-pipeline', (msg, bot) => {
    if (msg.text === '') {
		// no msg text, need a subcommand
		bot.replyPrivate({text:'You didn\'t pass any parameters. Do you need \`/create-pipeline help\`?'});
	} else {
	  bot.replyPrivate({text: 'Starting...'})
	  jenkins.build_with_params('pipeline-pal-folder/job/pipeline-pal-dummy-job', {depth: 1, pipeline_name:'fromslackbot_' + msg.text}, function(err, data) {
        if(err){
            bot.replyPrivate({text: 'There was an error with creating your pipeline: ' + err})
        }
        bot.replyPrivate({text: 'Pipeline (maybe?) started: ' + data})
      });
      bot.replyPrivate({text: 'Done.'})
	}
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
