// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import

// Add lambda function handler
exports.handler = async (event) => {
  console.log(event);
  await authenticate(event);
  return event;
};

// Add code for Cognito User Pool Authentication
async function authenticate(event) {
  const client = new CognitoIdentityProviderClient({});

  console.log(event);
  const params = {
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    UserPoolId: event.userPoolId,
    ClientId: event.clientId,
    AuthParameters: {
      USERNAME: event.userName,
      PASSWORD: event.password,
    },
  };
  try {
    const command = new AdminInitiateAuthCommand(params);
    const response = await client.send(command);
    console.log(response);

    //Exchange cognito access token for AWS credentials
    const credentials = await getCredentials(response.AuthenticationResult.AccessToken);
    console.log(credentials);

    //Add AWS credentials to the response
    response.credentials = credentials;
    console.log(response);
      
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
}