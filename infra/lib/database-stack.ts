import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly backupVaultArn: string;
  public readonly backupPlanId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Reference existing RDS instance by ARN (read-only, CDK will NOT modify it) ──
    const rdsArn = `arn:aws:rds:${this.region}:${this.account}:db:hacklanta-db`;

    // ── AWS Backup Vault ──
    const vault = new backup.BackupVault(this, 'DbBackupVault', {
      backupVaultName: 'hacklanta-db-vault',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── AWS Backup Plan ──
    const plan = new backup.BackupPlan(this, 'DbBackupPlan', {
      backupPlanName: 'hacklanta-db-backup-plan',
      backupPlanRules: [
        // Daily backup at 06:00 UTC, 14-day retention
        new backup.BackupPlanRule({
          ruleName: 'DailyBackup',
          scheduleExpression: events.Schedule.cron({
            hour: '6',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(14),
          backupVault: vault,
        }),
        // Weekly backup on Sunday at 04:00 UTC, 35-day retention
        new backup.BackupPlanRule({
          ruleName: 'WeeklyBackup',
          scheduleExpression: events.Schedule.cron({
            weekDay: 'SUN',
            hour: '4',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(35),
          backupVault: vault,
        }),
      ],
    });

    // Attach the RDS instance as a backup resource
    plan.addSelection('RdsSelection', {
      resources: [backup.BackupResource.fromArn(rdsArn)],
    });

    // ── Stack Outputs ──
    new cdk.CfnOutput(this, 'BackupVaultArn', {
      value: vault.backupVaultArn,
      description: 'ARN of the database backup vault',
    });

    new cdk.CfnOutput(this, 'BackupPlanId', {
      value: plan.backupPlanId,
      description: 'ID of the database backup plan',
    });

    new cdk.CfnOutput(this, 'RdsInstanceIdentifier', {
      value: 'hacklanta-db',
      description: 'RDS instance identifier (imported)',
    });

    this.backupVaultArn = vault.backupVaultArn;
    this.backupPlanId = plan.backupPlanId;
  }
}
