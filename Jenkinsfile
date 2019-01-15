#!groovy
pipeline {
  agent {
    docker {
      image 'node:alpine'
      args '-u 0:0'
    }
  }
  parameters {
    string(name: 'JENKINS_TARGET_JOB',
            defaultValue: 'Pipeline-Demo-Creator/job/master',
            description: 'This is the target job that the slackbot will trigger to create new pipelines')
  }
  environment {
    // https://jenkins.io/doc/book/pipeline/jenkinsfile/#handling-credentials
    SLACK_VERIFICATION_TOKEN = credentials('pipeline-pal-slack-token')
    SLACK_ACCESS_TOKEN = credentials('slack-access-token')
    SLACK_CLIENT_ID = credentials('pipeline-pal-slack-client-id')
    SLACK_CLIENT_SECRET = credentials('pipeline-pal-slack-client-secret')
    AWS_ACCESS_KEY_ID = credentials('shanem-aws-secret-key-id')
    AWS_SECRET_ACCESS_KEY = credentials('shanem-aws-secret-access-key')
    JENKINS_API_CREDENTIALS = credentials('pipeline-pal-jenkins-credentials')
    JIRA_API_CREDENTIALS = credentials('pipeline-pal-jira-credentials')
    JIRA_HOST = "jira.liatr.io"
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }
    stage('Deploy') {
      steps {
        sh 'npm install -g serverless'
        sh 'serverless deploy'
      }
    }
  }
}
