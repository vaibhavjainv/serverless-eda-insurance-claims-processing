// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class TestingService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Signup Lambda function
    const testLoginLambdaFunction = new NodejsFunction(this, "TestLogin", {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
      handler: "handler",
      entry: `${__dirname}/../app/handlers/login.js`,
    });

    const loginLambdaPolicy = new PolicyStatement({
      actions: ["cognito-idp:AdminInitiateAuth"],
      resources: ["*"],
      effect: Effect.ALLOW,
    });

    testLoginLambdaFunction.addToRolePolicy(loginLambdaPolicy);
  }
}
