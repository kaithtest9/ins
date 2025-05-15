import dotenv from 'dotenv';

dotenv.config();

const config = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default_super_secret',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  // S3_OBJECT_BASE_URL: process.env.S3_OBJECT_BASE_URL || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
};

// Basic validation for essential configs
if (!config.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL is not defined in .env");
  process.exit(1);
}
if (config.JWT_SECRET === 'default_super_secret') {
  console.warn("WARNING: JWT_SECRET is using a default value. Set a strong secret in your .env file for production.");
}
if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY || !config.AWS_REGION || !config.S3_BUCKET_NAME) {
    console.warn(
        "WARNING: AWS S3 configuration is incomplete. Image upload functionality may not work." +
        " Please check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET_NAME in your .env file."
    );
}


export default config;