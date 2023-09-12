import { Choice, Condition, Fail, IChainable, IntegrationPattern, JsonPath, Pass } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { DynamoGetItem, DynamoAttributeValue } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { TestApplicationSFProps } from "./testAppSF";

//Document.Processed.DRIVERS_LICENSE
export function verifyDLProcessed(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Validate Document.Processed.DRIVERS_LICENSE Event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Document.Processed.DRIVERS_LICENSE"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Document.Processed.DRIVERS_LICENSE Data")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.documentType.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.analyzedFieldAndValues"))
      ),
      new Pass(scope, "DRIVERS_LICENSE event data is valid", {
        result: {
          value: {
            customerId: JsonPath.stringAt("$.Item.DATA.M.customerId.S")
          },
        },
      })
    )
    .otherwise(new Fail(scope, "DRIVERS_LICENSE event data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}
//Document.Processed.CAR
export function verifyCarProcessed(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Validate Document.Processed.CAR Event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Document.Processed.CAR"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Document.Processed.CAR Data")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.documentType.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.analyzedFieldAndValues"))
      ),
      new Pass(scope, "CAR event data is valid", {
        result: {
          value: {},
        },
      })
    )
    .otherwise(new Fail(scope, "CAR event data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}
//Fraud.Not.Detected.DRIVERS_LICENSE
export function verifyFraudNotDetectedDL(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Validate Fraud.Not.Detected.DRIVERS_LICENSE Event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Fraud.Not.Detected.DRIVERS_LICENSE"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Fraud.Not.Detected.DRIVERS_LICENSE Data")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.documentType.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.analyzedFieldAndValues"))
      ),
      new Pass(scope, "Fraud.Not.Detected.DRIVERS_LICENSE event data is valid", {
        result: {
          value: {},
        },
      })
    )
    .otherwise(new Fail(scope, "Fraud.Not.Detected.DRIVERS_LICENSE event data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}

//Fraud.Not.Detected.CAR
export function verifyFraudNotDetectedCar(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Validate Fraud.Not.Detected.CAR Event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Fraud.Not.Detected.CAR"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Fraud.Not.Detected.CAR Data")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.documentType.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.analyzedFieldAndValues"))
      ),
      new Pass(scope, "Fraud.Not.Detected.CAR event data is valid", {
        result: {
          value: {},
        },
      })
    )
    .otherwise(new Fail(scope, "Fraud.Not.Detected.CAR event data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}

//Customer.Document.Updated
export function verifyCustomerDocumentUpdated(scope: Construct, props: TestApplicationSFProps): IChainable {
  const getItemStep = new DynamoGetItem(scope, "Validate Customer.Document.Updated Event", {
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    table: props.testDataTable,
    key: {
      PK: DynamoAttributeValue.fromString(JsonPath.stringAt("$.cognitoIdentityId")),
      SK: DynamoAttributeValue.fromString("Customer.Document.Updated"),
    },
  });

  const choiseStep = new Choice(scope, "Validate Customer.Document.Updated Data")
    .when(
      Condition.and(
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.documentType.S")),
        Condition.isNotNull(JsonPath.stringAt("$.Item.DATA.M.customerId.S"))
      ),
      new Pass(scope, "Customer.Document.Updated event data is valid", {
        result: {
          value: {},
        },
      })
    )
    .otherwise(new Fail(scope, "Customer.Document.Updated event data is invalid"));

  getItemStep.next(choiseStep);

  return getItemStep;
}
