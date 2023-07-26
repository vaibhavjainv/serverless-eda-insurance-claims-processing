// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  InputType,
  IntegrationPattern,
  JsonPath,
  LogLevel,
  StateMachine,
  StateMachineType,
  Timeout,
} from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { LambdaInvocationType, LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as logs from "aws-cdk-lib/aws-logs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface TestApplicationSFProps {
  testLoginLambdaFunction: NodejsFunction;
}

export class TestApplicationSF extends StateMachine {
  constructor(scope: Construct, id: string, props: TestApplicationSFProps) {
    const logGroup = new logs.LogGroup(scope, "TestApplicationSFLogGroup", {
      logGroupName: "/aws/vendedlogs/states/TestApplication",
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    super(scope, id, {
      definition: createSignUpLambdaStep(scope, props),
      stateMachineType: StateMachineType.STANDARD,
      logs: {
        destination: logGroup,
        level: LogLevel.ALL,
        includeExecutionData: true,
      },
      tracingEnabled: true,
    });
  }
}

function createSignUpLambdaStep(scope: Construct, props: TestApplicationSFProps): LambdaInvoke {
  return new LambdaInvoke(scope, "Customer Sign Up", {
    lambdaFunction: props.testLoginLambdaFunction,
    payload: {
      type: InputType.OBJECT,
      value: {
        "userPoolId.$": "$.userPoolId",
        "identityPoolId.$": "$.identityPoolId",
        "clientId.$": "$.clientId",
        "userName.$": "$.userName",
        "password.$": "$.password",
        "postData.$": "$.postData",
        TaskToken: JsonPath.taskToken,
      },
    },
    integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    taskTimeout: Timeout.duration(Duration.seconds(60)),
  });
}
