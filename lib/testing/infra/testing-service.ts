// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {  RetentionDays } from "aws-cdk-lib/aws-logs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { TestApplicationSF } from "./step-functions/testAppSF";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { CustomerEvents } from "../../services/customer/infra/customer-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export interface TestApplicationSFProps {
  eBus: EventBus;
  customerTable: Table;
}
export class TestingService extends Construct {
  constructor(scope: Construct, id: string, props: TestApplicationSFProps) {
    super(scope, id);

    // Create TestData Table
    const testDataTable = new Table(this, "TestDataTable", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "TTL",
    });

    // Create Signup Lambda function
    const testLoginLambdaFunction = new NodejsFunction(this, "TestLogin", {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
      handler: "handler",
      entry: `${__dirname}/../app/handlers/login.js`,
      environment: {
        TEST_DATA_TABLE_NAME: testDataTable.tableName,
      },
    });

    const loginLambdaPolicy = new PolicyStatement({
      actions: ["cognito-idp:AdminInitiateAuth"],
      resources: ["*"],
      effect: Effect.ALLOW,
    });

    testLoginLambdaFunction.addToRolePolicy(loginLambdaPolicy);
    testDataTable.grantReadWriteData(testLoginLambdaFunction);

    // Verification Lambda Functions
    const uploadFilesLambdaFunction = new NodejsFunction(this, "UploadFiles", {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
      handler: "handler",
      entry: `${__dirname}/../app/handlers/uploadFiles.js`,
    });

  

    new TestApplicationSF(this, "TestApplicationSF", {
      testLoginLambdaFunction,
      uploadFilesLambdaFunction,
      testDataTable
    });

    //Create Save Events Lambda Function
    const saveEventsLambdaFunction = new NodejsFunction(this, "SaveEvents", {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
      handler: "handler",
      entry: `${__dirname}/../app/handlers/saveEvents.js`,
      environment: {
        TEST_DATA_TABLE_NAME: testDataTable.tableName,
        CUSTOMER_TABLE_NAME: props.customerTable.tableName,
      },
    });
    testDataTable.grantReadWriteData(saveEventsLambdaFunction);
    props.customerTable.grantReadWriteData(saveEventsLambdaFunction);

    new Rule(this, "TestingEventBusRule", {
      eventBus: props.eBus,
      ruleName: "TestingEventBusRule",
      eventPattern: {
        source: [CustomerEvents.CUSTOMER_SOURCE, CustomerEvents.SIGNUP_SOURCE],
      },
      targets: [new LambdaFunction(saveEventsLambdaFunction)],
    });
  }
}
