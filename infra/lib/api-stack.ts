import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: ECS Fargate service, ALB, ECR repo
  }
}
