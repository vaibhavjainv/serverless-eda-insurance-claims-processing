import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log(event);

  if (event.detail.cognitoIdentityId){
    const saveTokenCommand = new PutItemCommand({
        TableName: process.env.TEST_DATA_TABLE_NAME,
        Item: marshall({
          PK: authResp.getIDResponse.IdentityId,
          SK: "Customer.Submitted",
          DATA: event.detail.data,
          TTL: Math.floor(Date.now() / 1000) + 60 * 60,
        }),
      });
      await dynamoDBClient.send(saveTokenCommand);
  }
  return event;
};

