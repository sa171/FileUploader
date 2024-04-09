const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { nanoid } = require('nanoid');

const dynamoDBClient = new DynamoDBClient({ region: 'us-west-2' });

async function generateId() {
    try {
      const nanoidModule = await import('nanoid');
      const nanoid = nanoidModule.nanoid;
      const id = nanoid();
      console.log('Generated ID:', id);
      return id;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  


exports.handler = async (event) => {
    console.log("Request body", event);
    try {
        const data = JSON.parse(event);
        console.log("Event text: ", data.text);
        const id = await generateId();
        const params = {
            TableName: 'FileTable',
            Item: {
                id: { S: id},
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
