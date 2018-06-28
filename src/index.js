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

//Command to create a pipeline with a given name
slack.on('/create-pipeline', (msg, bot) => {
//        console.log('no parameter passed');
//        bot.replyPrivate({text:'You didn\'t pass any parameters. Do you need \`/create-pipeline help\`?'});
//    } else {
//      console.log('parameter passed: ' + msg.text);
//      jenkins.build_with_params('pipeline-pal-folder/job/pipeline-pal-dummy-job', {pipeline_name: msg.text}, function(err, data) {
//        if(err){
//            bot.replyPrivate({text: 'There was an error with creating your pipeline: ' + err});
//        } else {
//            bot.replyPrivate({text: "Job started.  Check it out here: https://build.liatrio.com/job/pipeline-pal-folder/job/pipeline-pal-dummy-job"});
//        }
//      });
//    }
//    console.log(jenkinsApi)
//    console.log(jenkins)
//    bot.replyPrivate({text:'before call'});
//    jenkins.all_jobs(function(err, data) {
//        console.log(err);
//        console.log("***********************************");
//        console.log(data);
//    });
//    bot.replyPrivate({text:'after call'});

    //basic request to validate connection
    var username = process.env.JENKINS_API_CREDENTIALS.split(':')[0];
    var password = process.env.JENKINS_API_CREDENTIALS.split(':')[1];

    var request = require('request');
    request.get('https://build.liatrio.com/job/pipeline-pal-folder/job/pipeline-pal-dummy-job/lastBuild/api/json', function (error, response, body) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
    }).auth(username, password, true);



    var jenkinsApi = require('jenkins-api');
//    var serverAddr = 'https://' + process.env.JENKINS_API_CREDENTIALS + '@build.liatrio.com';
//    var jenkins = jenkinsApi.init(serverAddr);

    const { URL } = require('url');
    const jenkinsUrl = new URL('https://build.liatrio.com');
    jenkinsUrl.username = username;
    jenkinsUrl.password = password;
    var jenkins = jenkinsApi.init(jenkinsUrl.href);

    jenkins.last_build_info('pipeline-pal-folder/job/pipeline-pal-dummy-job', function(err, data) {
      if (err){ return console.log(err); }
      console.log(data);
    });



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
