const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: 'us-west-2' });

exports.handler = async (event) => {
    console.log("Received event");
    try {
        const data = JSON.parse(event.body);
        console.log("Event text: ", data.text);
        const params = {
            TableName: 'YourTableName',
            Item: {
                id: { S: data.id },
                text: { S: data.text },
                url: {S: data.url}
            }
        };

        await dynamoDBClient.send(new PutItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data inserted successfully' })
        };
    } catch (error) {
        console.log("Error inserting data: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error inserting data', error: error })
        };
    }
};
