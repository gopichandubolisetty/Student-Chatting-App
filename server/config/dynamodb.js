const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// DynamoDBClient with automatic credential resolution via default provider chain.
// On AWS EC2: Automatically fetches temporary IAM role credentials via Instance Metadata Service (IMDS).
// Locally: Automatically falls back to AWS credentials/config file (~/.aws/credentials) or environment variables.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
});

// DynamoDBDocumentClient handles automatic marshalling/unmarshalling of JavaScript types
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const OTP_TABLE_NAME = process.env.DYNAMODB_OTP_TABLE || 'CampusConnect-OTP';

module.exports = {
  client,
  docClient,
  OTP_TABLE_NAME,
};
