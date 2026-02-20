#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';
import { EmailStack } from '../lib/email-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-2',
};

const network = new NetworkStack(app, 'HacklantaNetwork', { env });
const database = new DatabaseStack(app, 'HacklantaDatabase', { env });
const storage = new StorageStack(app, 'HacklantaStorage', { env });
const email = new EmailStack(app, 'HacklantaEmail', { env });
const api = new ApiStack(app, 'HacklantaApi', { env });
const monitoring = new MonitoringStack(app, 'HacklantaMonitoring', { env });

// Storage stack depends on database stack (backup vault must exist first)
storage.addDependency(database);
