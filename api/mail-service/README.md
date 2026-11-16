# mail-service

A small async sidecar that sends the app's transactional emails (password reset, account deactivation). The NestJS API and MySQL are unchanged. The API puts a message on a queue and returns right away; this service delivers the email.

It lives under `api/` because only the API uses it, but it is a separate package: it has its own `package.json`, `node_modules` and `tsconfig.json`. It is excluded from the API's build, tests and Docker image.

```
NestJS API ──SendMessageCommand──▶ SQS: neurocyte-mail ──▶ Lambda: send-email ──▶ SES
                                         │
                                         └─ 3 failed attempts ──▶ SQS: neurocyte-mail-dlq
```

- **Producer:** [api/src/user/mail.service.ts](../src/user/mail.service.ts) builds the email (`{ to, subject, html }`) and sends it to SQS.
- **Consumer:** [lambda/send-email.ts](lambda/send-email.ts) validates each message and calls SES `SendEmail`. It reports failed records individually (`ReportBatchItemFailures`), so only those are retried.
- **Infra:** [lib/mail-service-stack.ts](lib/mail-service-stack.ts) defines the queue, the DLQ, the Lambda, the SES sender identity and the IAM permissions.

## Run locally with LocalStack

Prerequisites: Docker running and Node.js. `cdklocal` is installed as a dev dependency, so no global CLI is needed.

```sh
# 1. Start LocalStack (from the repo root)
docker compose up -d localstack

# 2. Deploy the stack (from api/mail-service/)
npm install
npm run local:bootstrap     # first time only
npm run local:deploy
```

The deploy prints `MailQueueUrl`. The root `.env` should contain:

```
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
MAIL_QUEUE_URL=http://localhost:4566/000000000000/neurocyte-mail
```

When the API runs in docker compose, these are already set on the `api` service and point at `localstack:4566`.

### Try it

```sh
curl -X POST http://localhost:3000/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"email":"<existing user email>"}'

# Emails "sent" through LocalStack SES:
curl -s http://localhost:4566/_aws/ses | jq '.messages[] | {Destination, Subject}'
```

### Debugging

```sh
# Lambda logs
npx awslocal logs tail /aws/lambda/$(npx awslocal lambda list-functions \
  --query 'Functions[?contains(FunctionName, `SendEmail`)].FunctionName' --output text)

# Messages that failed 3 times
npx awslocal sqs receive-message \
  --queue-url http://localhost:4566/000000000000/neurocyte-mail-dlq
```

If you don't have `awslocal`, use `aws --endpoint-url http://localhost:4566 ...` instead.

If SES rejects the sender with "Email address is not verified", verify it by hand:
`aws --endpoint-url http://localhost:4566 ses verify-email-identity --email-address noreply@neurocyte.me`

## Configuration

- **Sender address:** defaults to `mailFrom` in [cdk.json](cdk.json). Override it with `MAIL_FROM=... npm run local:deploy`.
- **Region:** `us-east-1`. Override it with `CDK_DEFAULT_REGION`.

## Real AWS

Run `npx cdk bootstrap` and then `npx cdk deploy`, using real credentials. Then set the API's `MAIL_QUEUE_URL` to the `MailQueueUrl` output and remove `AWS_ENDPOINT_URL` and the test keys. A new SES account is in sandbox mode: it can only send to verified addresses until you request production access.

## Scripts

| Script | What it does |
| --- | --- |
| `npm test` | Lambda handler and stack tests |
| `npm run build` | Type-check |
| `npm run synth` | Synthesize the CloudFormation template |
| `npm run local:bootstrap` / `local:deploy` / `local:destroy` | Bootstrap, deploy or destroy against LocalStack |
