import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as gatewayintegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const inputBucket = new s3.Bucket(this, 'MyInputBucket', {
      bucketName: "input-bucket-sr-dev",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedOrigins: ['http://localhost:3000'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
          allowedHeaders: ['*'],
          exposedHeaders: []
        }
      ]
    });

    const outputBucket = new s3.Bucket(this, 'MyOutputBucket', {
      bucketName: "output-bucket-sr-dev",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedOrigins: ['http://localhost:3000'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
          allowedHeaders: ['*'],
          exposedHeaders: []
        }
      ]
    });
    
    const table = new dynamodb.Table(this, 'MyTable', {
      tableName: "FileTable",
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    const handler = new lambda.Function(this, 'MyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('/Users/srudrawar/Documents/Projects/FileUploader/my-lambda'),
      handler: 'index.handler',
    });

    table.grantReadWriteData(handler);

    const api = new apigatewayv2.HttpApi(this, 'MyApi', {
      apiName: 'My API',
      description: 'This is an API for uploading file',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.POST, 
                      apigatewayv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['*']
      }
    });

    api.addRoutes({
      path: '/file',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new gatewayintegrations.HttpLambdaIntegration("LambdaIntegration", handler),
    });

    const eventProcessorLambda = new lambda.Function(this, 'EventProcessorLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('/Users/srudrawar/Documents/Projects/FileUploader/event-processor-lambda'),
      handler: 'index.handler',
      retryAttempts: 0,
      timeout: cdk.Duration.minutes(10),
    });

    eventProcessorLambda.addEventSource(new event_sources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST, 
      batchSize: 1, 
    }));

    const ec2RunInstancesPolicyStatement = new iam.PolicyStatement({
      actions: ['ec2:RunInstances',
      'ec2:DescribeInstances',
      'ec2:TerminateInstances', 
      'iam:PassRole', 
      'ec2:StopInstances',
      'ssm:SendCommand'],
      resources: ['*'], 
    });
  
    eventProcessorLambda.addToRolePolicy(ec2RunInstancesPolicyStatement);

  }
}
