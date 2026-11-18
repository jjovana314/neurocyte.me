export interface Config {
  SECRET_KEY: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_URL: string;
  DATABASE_NAME: string;
  DATABASE_PORT: string;
  AWS_REGION: string;
  AWS_ENDPOINT_URL: string;
  MAIL_QUEUE_URL: string;
  MAIL_FROM: string;
  APP_URL: string;
  FRONTEND_URL: string;
  ACCESS_TOKEN_TIME: string;
  REFRESH_TOKEN_TIME: string;
  CALCULATOR_GRPC_URL: string;
}
