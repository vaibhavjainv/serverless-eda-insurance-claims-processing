// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  Choice,
  Condition,
  Fail,
  IChainable,
  INextable,
  InputType,
  IntegrationPattern,
  JsonPath,
  LogLevel,
  Parallel,
  Pass,
  State,
  StateMachine,
  StateMachineType,
  Timeout,
  Wait,
  WaitTime,
} from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import {
  LambdaInvocationType,
  LambdaInvoke,
  DynamoGetItem,
  DynamoAttributeValue,
} from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as logs from "aws-cdk-lib/aws-logs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export interface TestApplicationSFProps {
  testLoginLambdaFunction: NodejsFunction;
  verifyLambdaFunction: NodejsFunction;
  testDataTable: Table;
}

let gProps: TestApplicationSFProps;

export class TestApplicationSF extends StateMachine {
  constructor(scope: Construct, id: string, props: TestApplicationSFProps) {
    const logGroup = new logs.LogGroup(scope, "TestApplicationSFLogGroup", {
      logGroupName: "/aws/vendedlogs/states/TestApplication",
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    gProps = props;

    const signUpLambdaStep = createSignUpLambdaStep(scope, props);

    const waitStep = addWaitStep(signUpLambdaStep, scope);

    addSignUpValidationStep(scope, waitStep, props);

    super(scope, id, {
      definition: signUpLambdaStep,
      stateMachineType: StateMachineType.EXPRESS,
      logs: {
        destination: logGroup,
        level: LogLevel.ALL,
        includeExecutionData: true,
      },
      tracingEnabled: true,
    });
  }
}

function addWaitStep(signUpLambdaStep: LambdaInvoke, scope: Construct) {
  const waitStep = new Wait(scope, "WaitForSignUp", { time: WaitTime.duration(Duration.seconds(10)) });
  signUpLambdaStep.next(waitStep);
  return waitStep;
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
        // TaskToken: JsonPath.taskToken,
      },
    },
    resultSelector: {
      "cognitoIdentityId.$": "$.Payload.cognitoIdentityId",
    },
    // integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    // taskTimeout: Timeout.duration(Duration.seconds(60)),
  });
}
function addSignUpValidationStep(scope: Construct, waitStep: INextable, props: TestApplicationSFProps) {
  const parallelState = new Parallel(scope, "SignUpValidation", {});
  parallelState.branch(verifyCustSubmitted(scope, props));
  parallelState.branch(verifyCustAccept(scope, props));

  waitStep.next(parallelState);
}

function verifyCustAccept(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep =  new DynamoGetItem(scope, "Get customer accepted event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.cognitoIdentityId')),
      SK: DynamoAttributeValue.fromString("Customer.Accepted"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Customer Accepted Event")
    .when(Condition.isNotNull(JsonPath.stringAt('$.Item.DATA.M.driversLicenseImageUrl.S')), new Pass(scope, "Driver license image exists"))
    .otherwise(new Fail(scope, "Driver license image does not exist"));

    getItemStep.next(choiseStep);

  return getItemStep;
}

function verifyCustSubmitted(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep =  new DynamoGetItem(scope, "Get customer submitted event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt('$.cognitoIdentityId')),
      SK: DynamoAttributeValue.fromString("Customer.Submitted"),
    },
  });

  return getItemStep;
}
