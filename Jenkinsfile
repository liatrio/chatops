#!groovy
pipeline {
  agent {
    docker {
      image 'node:alpine'
      args '-u 0:0'
    }
  }
  environment {
    // https://jenkins.io/doc/book/pipeline/jenkinsfile/#handling-credentials
    SLACK_VERIFICATION_TOKEN = credentials('pipeline-pal-slack-token')
    SLACK_CLIENT_ID = credentials('pipeline-pal-slack-client-id')
    SLACK_CLIENT_SECRET = credentials('pipeline-pal-slack-client-secret')
    AWS_ACCESS_KEY_ID = credentials('shanem-aws-secret-key-id')
    AWS_SECRET_ACCESS_KEY = credentials('shanem-aws-secret-access-key')
    JENKINS_API_CREDENTIALS = credentials('pipeline-pal-jenkins-credentials')
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
