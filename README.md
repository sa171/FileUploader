This repository is my submission to fovus coding challenge!

This repo consists of 4 modules as below:

1) my-app:
  This is the web application that takes user input in text and text file. This application uploads the text file to the s3 and calls API gateway to invoke my-lambda.

2)my-lambda:
  This is the lambda function that creates a new entry in dynamodb table. It inserts - id, text, input-bucket-url in FileTable.

3)event-processor-lambda:
  This lambda function is triggered by dynamodb stream when a new record is created. This lambda function creates an ec2 instance, sends commands to it and terminates it upon completion.

4) my-cdk:
  This package maintains the infrastructure as code, provisions stack and constructs as needed.

