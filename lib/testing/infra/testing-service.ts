// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { TestApplicationSF } from "./step-functions/testAppSF";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

export class TestingService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create TestData Table
    const testDataTable =  new Table(this, "TestDataTable", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create Signup Lambda function
    const testLoginLambdaFunction = new NodejsFunction(this, "TestLogin", {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
      handler: "handler",
      entry: `${__dirname}/../app/handlers/login.js`,
      environment:{
        "TEST_DATA_TABLE_NAME": testDataTable.tableName
      }
    });

    const loginLambdaPolicy = new PolicyStatement({
      actions: ["cognito-idp:AdminInitiateAuth"],
      resources: ["*"],
      effect: Effect.ALLOW,
    });

    testLoginLambdaFunction.addToRolePolicy(loginLambdaPolicy);
    testDataTable.grantReadWriteData(testLoginLambdaFunction);


    new TestApplicationSF(this, "TestApplicationSF", {
      testLoginLambdaFunction,
    });
  }
}
