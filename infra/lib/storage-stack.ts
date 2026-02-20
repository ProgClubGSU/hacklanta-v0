import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Import existing uploads bucket (read-only reference) ──
    const uploadsBucket = s3.Bucket.fromBucketName(
      this,
      'ImportedUploadsBucket',
      'hacklanta-uploads',
    );

    // ── Backup bucket for replicated/archived uploads ──
    this.backupBucket = new s3.Bucket(this, 'UploadsBackupBucket', {
      bucketName: 'hacklanta-uploads-backup',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          // Transition current versions to Infrequent Access after 30 days
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          // Expire old non-current versions after 90 days
          noncurrentVersionExpiration: cdk.Duration.days(90),
          // Clean up incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // ── Stack Outputs ──
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'Source uploads bucket (imported)',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'Backup bucket for uploads',
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'ARN of the backup bucket',
    });

    // ── AWS Backup for S3 (requires versioning on source bucket first) ──
    // NOTE: Enable versioning on 'hacklanta-uploads' via the AWS Console before
    // uncommenting this section. CDK cannot enable versioning on imported buckets.
    //
    // import * as backup from 'aws-cdk-lib/aws-backup';
    //
    // const s3BackupPlan = new backup.BackupPlan(this, 'S3BackupPlan', {
    //   backupPlanName: 'hacklanta-s3-backup-plan',
    //   backupPlanRules: [
    //     new backup.BackupPlanRule({
    //       ruleName: 'DailyS3Backup',
    //       scheduleExpression: events.Schedule.cron({ hour: '7', minute: '0' }),
    //       deleteAfter: cdk.Duration.days(14),
    //     }),
    //   ],
    // });
    //
    // s3BackupPlan.addSelection('S3Selection', {
    //   resources: [backup.BackupResource.fromArn(uploadsBucket.bucketArn)],
    // });
  }
}
