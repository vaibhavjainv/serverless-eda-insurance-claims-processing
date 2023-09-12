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
  StateMachine,
  StateMachineType,
  Wait,
  WaitTime,
} from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { LambdaInvoke, DynamoGetItem, DynamoAttributeValue } from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as logs from "aws-cdk-lib/aws-logs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import {
  verifyDLProcessed,
  verifyCarProcessed,
  verifyFraudNotDetectedDL,
  verifyFraudNotDetectedCar,
  verifyCustomerDocumentUpdated,
} from "./verificationSteps";

export interface TestApplicationSFProps {
  testLoginLambdaFunction: NodejsFunction;
  uploadFilesLambdaFunction: NodejsFunction;
  testDataTable: Table;
}

// let gProps: TestApplicationSFProps;

export class TestApplicationSF extends StateMachine {
  constructor(scope: Construct, id: string, props: TestApplicationSFProps) {
    const logGroup = new logs.LogGroup(scope, "TestApplicationSFLogGroup", {
      logGroupName: "/aws/vendedlogs/states/TestApplication",
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    // gProps = props;

    const signUpLambdaStep = createSignUpLambdaStep(scope, props);

    const waitStep = addWaitStep(signUpLambdaStep, scope, "WaitForSignUp");

    const signUpValidationStep = addSignUpValidationStep(scope, waitStep, props);

    const fileUploadStep = addFileUploadStep(signUpValidationStep, scope, props);

    const secondWaitStep = addWaitStep(fileUploadStep, scope, "WaitForFileUpload");

    addDocumentsEventValidationStep(secondWaitStep, scope, props);

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

function addWaitStep(prevStep: LambdaInvoke, scope: Construct, id: string) {
  const waitStep = new Wait(scope, id, { time: WaitTime.duration(Duration.seconds(5)) });
  prevStep.next(waitStep);
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
    resultPath: "$.cognitoIdentityId",

    // integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    // taskTimeout: Timeout.duration(Duration.seconds(60)),
  });
}
function addSignUpValidationStep(scope: Construct, waitStep: INextable, props: TestApplicationSFProps): INextable {
  const parallelState = new Parallel(scope, "SignUpValidation", {
    resultSelector: {
      driversLicenseImageUrl: JsonPath.stringAt("$[1].driversLicenseImageUrl"),
      carImageUrl: JsonPath.stringAt("$[1].carImageUrl"),
      cognitoIdentityId: JsonPath.stringAt("$[1].cognitoIdentityId"),
      dlImageSrcURL: JsonPath.stringAt("$[2].dlImageSrcURL"),
      carImageSrcURL: JsonPath.stringAt("$[2].carImageSrcURL"),
      fnolParams: JsonPath.objectAt("$[2].fnolParams"),
    },
  });
  parallelState.branch(verifyCustSubmitted(scope, props));
  parallelState.branch(verifyCustAccept(scope, props));
  parallelState.branch(fetchAddnlData(scope));

  waitStep.next(parallelState);

  return parallelState;
}

function verifyCustAccept(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Get customer accepted event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Customer.Accepted"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Customer Accepted Event")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.driversLicenseImageUrl.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.carImageUrl.S"))
      ),
      new Pass(scope, "Image URLs exist", {
        parameters: {
          driversLicenseImageUrl: JsonPath.stringAt("$.Item.DATA.M.driversLicenseImageUrl.S"),
          carImageUrl: JsonPath.stringAt("$.Item.DATA.M.carImageUrl.S"),
          cognitoIdentityId: JsonPath.stringAt("$.Item.PK.S"),
        },
      })
    )
    .otherwise(new Fail(scope, "Image URLs do not exist"));

  getItemStep.next(choiseStep);

  return getItemStep;
}

function verifyCustSubmitted(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Get customer submitted event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Customer.Submitted"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Customer Submitted Event")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.cognitoIdentityId.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.SK.S"))
      ),
      new Pass(scope, "Data is valid", {
        parameters: {
          cognitoIdentityId: JsonPath.stringAt("$.Item.DATA.M.cognitoIdentityId.S"),
        },
      })
    )
    .otherwise(new Fail(scope, "Data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}

function addFileUploadStep(signUpValidationStep: INextable, scope: Construct, props: TestApplicationSFProps) {
  const uploadFilesStep = new LambdaInvoke(scope, "Upload Files", {
    lambdaFunction: props.uploadFilesLambdaFunction,
    resultPath: JsonPath.DISCARD,
  });
  signUpValidationStep.next(uploadFilesStep);
  return uploadFilesStep;
}

function fetchAddnlData(scope: Construct): IChainable {
  return new Pass(scope, "Fetch additional data", {
    parameters: {
      dlImageSrcURL: JsonPath.stringAt("$.dlImageSrcURL"),
      carImageSrcURL: JsonPath.stringAt("$.carImageSrcURL"),
      fnolParams: {
        userPoolId: JsonPath.stringAt("$.userPoolId"),
        clientId: JsonPath.stringAt("$.clientId"),
        userName: JsonPath.stringAt("$.userName"),
        password: JsonPath.stringAt("$.password"),
        identityPoolId: JsonPath.stringAt("$.identityPoolId"),
        cognitoIdentityId: JsonPath.stringAt("$.cognitoIdentityId.cognitoIdentityId"),
        fnoldData: JsonPath.objectAt("$.fnolData"),
      },
    },
  });
}

function addDocumentsEventValidationStep(prevStep: INextable, scope: Construct, props: TestApplicationSFProps) {
  const parallelState = new Parallel(scope, "DocumentsEventValidation", {
    resultSelector: {
      customerId: JsonPath.stringAt("$[0].customerId"),
    },
    resultPath: "$.fnolParams.fnoldData.personalInformation.customerId",
  });
  parallelState.branch(verifyDLProcessed(scope, props));
  parallelState.branch(verifyCarProcessed(scope, props));
  parallelState.branch(verifyFraudNotDetectedDL(scope, props));
  parallelState.branch(verifyFraudNotDetectedCar(scope, props));
  parallelState.branch(verifyCustomerDocumentUpdated(scope, props));

  prevStep.next(parallelState);

  return parallelState;
}
