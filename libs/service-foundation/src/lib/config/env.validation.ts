import * as Joi from 'joi';

/**
 * Joi validation schema for all required environment variables.
 *
 * Validates that all critical env vars are present and conform to expected
 * formats. Services may extend this schema with additional vars.
 *
 * @default
 * - NODE_ENV — must be 'development', 'production', or 'test'
 * - PORT — must be a numeric string between 1–65535
 * - SERVICE_NAME — non-empty string
 * - DATABASE_URL — valid URI starting with postgresql://
 * - REDIS_URL — valid URI starting with redis://
 * - KAFKA_BROKERS — comma-separated host:port pairs
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3000')
    .messages({
      'string.pattern.base': 'PORT must be a numeric string',
    }),
  SERVICE_NAME: Joi.string().required().messages({
    'any.required': 'SERVICE_NAME is required',
    'string.empty': 'SERVICE_NAME must not be empty',
  }),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required().messages({
    'any.required': 'DATABASE_URL is required',
    'string.uri': 'DATABASE_URL must be a valid postgresql:// URI',
  }),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required().messages({
    'any.required': 'REDIS_URL is required',
    'string.uri': 'REDIS_URL must be a valid redis:// URI',
  }),
  KAFKA_BROKERS: Joi.string().required().messages({
    'any.required': 'KAFKA_BROKERS is required',
    'string.empty': 'KAFKA_BROKERS must not be empty',
  }),
});

/**
 * Validates environment variables against the schema and returns the
 * validated (and defaulted) values.
 *
 * Throws a descriptive error if any required var is missing or invalid.
 *
 * @param env - Raw environment variables (typically `process.env`).
 * @returns The validated environment config object.
 * @throws {Error} With a message listing the first validation failure.
 */
export function validateEnv(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const { error, value } = envValidationSchema.validate(env, {
    allowUnknown: true,
    stripUnknown: true,
    abortEarly: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
