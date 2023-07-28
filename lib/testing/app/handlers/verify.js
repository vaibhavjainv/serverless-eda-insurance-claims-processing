import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    const getEventInput = {
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: event.cognitoIdentityId },
          ":sk": { S: event.eventName }
        },
        TableName: process.env.TEST_DATA_TABLE_NAME,
      };
    
      const { Items: eventRecords } = await dynamoDBClient.send(
        new QueryCommand(getEventInput)
      );

      if(eventRecords && eventRecords.length > 0){
        return {
            statusCode: 200,
            body: JSON.stringify(eventRecords[0])
        }
      }else{
        throw new Error('No event found');
      }
    }

