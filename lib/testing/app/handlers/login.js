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

    //invoke a POST API
    const postData = event.postData;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `${response.AuthenticationResult.IdToken}`,
      },
    };

    const responsePost = await fetch("https://cyaoxhc0kg.execute-api.us-east-2.amazonaws.com/prod/signup", {
      body: JSON.stringify(postData),
      ...options,
    });
    console.log(responsePost);
    const dataPost = await responsePost.json();
    console.log(dataPost);

    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
}