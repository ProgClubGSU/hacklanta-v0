import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: S3 buckets (resumes, assets)
  }
}
