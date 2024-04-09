This repository is my submission to Fovus coding challenge!

This repo consists of 4 modules as below:

1) my-app:
  This is the web application that takes user input in text and text file. This application uploads the text file to the s3 and calls API gateway to invoke my-lambda.

2) my-lambda:
  This is the lambda function that creates a new entry in dynamodb table. It inserts - id, text, input-bucket-url in FileTable.

3) event-processor-lambda:
  This lambda function is triggered by dynamodb stream when a new record is created. This lambda function creates an ec2 instance, sends commands to it and terminates it upon completion.

4) my-cdk:
  This package maintains the infrastructure as code, provisions stack and constructs as needed.
  To run the CDK - execute: npx cdk bootstrap followed by npx cdk deploy


script.py:
This is the script that downloads the record from s3 and appends the text to it! This script is downloaded and executed by ec2 using SSM in lambda function! 

**References:**

Process to test it:
Install node in your system, run npm install to install all the dependencies in the modules



1) https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/aws-jsdk-reference.html
2) https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_action.html
3) https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#runInstances-property
4) https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
