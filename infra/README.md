# @hacklanta/infra

AWS CDK (TypeScript) infrastructure-as-code for the Hacklanta platform.

## Stacks

| Stack               | Resources                              |
| ------------------- | -------------------------------------- |
| `NetworkStack`      | VPC, subnets, security groups          |
| `DatabaseStack`     | RDS PostgreSQL 16, ElastiCache Redis   |
| `ApiStack`          | ECS Fargate, ALB, ECR                  |
| `StorageStack`      | S3 buckets (resumes, assets)           |
| `EmailStack`        | SES domain verification                |
| `MonitoringStack`   | CloudWatch alarms                      |

All stacks are currently scaffolded with empty constructors — resource definitions will be added as the project progresses.

## Structure

```
infra/
├── bin/
│   └── infra.ts              # CDK app entry point
├── lib/
│   ├── network-stack.ts
│   ├── database-stack.ts
│   ├── api-stack.ts
│   ├── storage-stack.ts
│   ├── email-stack.ts
│   └── monitoring-stack.ts
├── cdk.json
└── tsconfig.json
```

## Setup

```bash
# Install dependencies (from repo root)
pnpm install

# Or from this directory
pnpm install
```

## Commands

Run from this directory:

| Command                       | Description             |
| ----------------------------- | ----------------------- |
| `pnpm build`                  | Compile TypeScript      |
| `pnpm lint`                   | Type check (tsc)        |
| `pnpm cdk synth`              | Synthesize CloudFormation |
| `pnpm cdk diff`               | Preview changes         |
| `pnpm cdk deploy --all`       | Deploy all stacks       |
| `pnpm cdk destroy --all`      | Tear down all stacks    |

## Prerequisites

- AWS CLI configured with credentials
- CDK bootstrapped in target account/region: `pnpm cdk bootstrap aws://ACCOUNT/REGION`
