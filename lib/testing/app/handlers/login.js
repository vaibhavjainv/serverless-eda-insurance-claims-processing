// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import
import {
  GetCredentialsForIdentityCommand,
  GetIdCommand,
  CognitoIdentityClient,
} from "@aws-sdk/client-cognito-identity";

import * as aws4 from "aws4";
import axios from "axios";

// Add lambda function handler
exports.handler = async (event) => {
  console.log(event);
  await authenticate(event);
  return event;
};

// Add code for Cognito User Pool Authentication
async function authenticate(event) {
  const cgIDPClient = new CognitoIdentityProviderClient({});
  const cgIDClient = new CognitoIdentityClient({});

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
    const response = await cgIDPClient.send(command);
    console.log(response);

    //Call getID
    const getIDParams = {
      IdentityPoolId: event.identityPoolId,
      Logins: {
        [`cognito-idp.us-east-2.amazonaws.com/${event.userPoolId}`]: response.AuthenticationResult.IdToken,
      },
    };

    const getIDCommand = new GetIdCommand(getIDParams);
    const getIDResponse = await cgIDClient.send(getIDCommand);

    console.log(`getIDResponse = ${getIDResponse}`);
    console.log(`IdentityId = ${getIDResponse.IdentityId}`);

    //Call GetCredentialsForIdentity
    const getCredentialsParams = {
      IdentityId: getIDResponse.IdentityId,
      Logins: {
        [`cognito-idp.us-east-2.amazonaws.com/${event.userPoolId}`]: response.AuthenticationResult.IdToken,
      },
    };
    const getCredentialsCommand = new GetCredentialsForIdentityCommand(getCredentialsParams);
    const getCredentialsResponse = await cgIDClient.send(getCredentialsCommand);
    console.log(getCredentialsResponse);

    event.idToken = response.AuthenticationResult.IdToken;
    event.refreshToken = response.AuthenticationResult.RefreshToken;
    event.accessToken = getCredentialsResponse.Credentials.AccessKeyId;
    event.secretKey = getCredentialsResponse.Credentials.SecretKey;
    event.sessionToken = getCredentialsResponse.Credentials.SessionToken;
    console.log(event);

    //Invoke API
    const postData = event.postData;

    // const options = {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //     Authorization: `${response.AuthenticationResult.IdToken}`,
    //   },
    // };

    // const responsePost = await fetch("https://cyaoxhc0kg.execute-api.us-east-2.amazonaws.com/prod/signup", {
    //   body: JSON.stringify(postData),
    //   ...options,
    // });

    let request = {
      host: "cyaoxhc0kg.execute-api.us-east-2.amazonaws.com",
      method: "POST",
      url: `https://cyaoxhc0kg.execute-api.us-east-2.amazonaws.com/prod/signup`,
      data: postData,
      body: JSON.stringify(postData),
      path: `prod/signup`,
      headers: {
        "content-type": "application/json",
      },
    };

    let signedRequest = aws4.sign(request, {
      secretAccessKey: getCredentialsResponse.Credentials.SecretKey,
      accessKeyId: getCredentialsResponse.Credentials.AccessKeyId,
      sessionToken: getCredentialsResponse.Credentials.SessionToken,
    });

    delete signedRequest.headers["Host"];
    delete signedRequest.headers["Content-Length"];

    let apiResponse = await axios(signedRequest);
    console.log(`apiResponse = ${apiResponse}`);

    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
}
