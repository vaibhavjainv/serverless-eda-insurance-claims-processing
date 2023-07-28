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
        new QueryCommand(getCustomerDetailsInput)
      );

      if(eventRecords && eventRecords.length > 0){
        return {
            statusCode: 200,
            body: JSON.stringify(eventRecords[0])
        }
      }
    }

