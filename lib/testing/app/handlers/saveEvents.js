import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";


const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log(event);

  if (event.detail.cognitoIdentityId){
    const saveDataCmd = new PutItemCommand({
        TableName: process.env.TEST_DATA_TABLE_NAME,
        Item: marshall({
          PK: event.detail.cognitoIdentityId,
          SK: event['detail-type'],
          DATA: event.detail,
          TTL: Math.floor(Date.now() / 1000) + 60 * 60,
        }),
      });
      await dynamoDBClient.send(saveDataCmd);
  }else{
    if(event.detail.customerId){
        const getCustomerDetailsInput = {
            KeyConditionExpression: "PK = :pk AND SK = :sk",
            ExpressionAttributeValues: {
              ":pk": { S: event.detail.customerId },
              ":sk": { S: "COGNITO_IDENTITY_ID" }
            },
            TableName: process.env.CUSTOMER_TABLE_NAME,
          };
        
          const { Items: customerRecords } = await dynamoDBClient.send(
            new QueryCommand(getCustomerDetailsInput)
          );

          console.log(`customerRecords = ${JSON.stringify(unmarshall(customerRecords[0]))}`)
        
    }
  }
  return event;
};

