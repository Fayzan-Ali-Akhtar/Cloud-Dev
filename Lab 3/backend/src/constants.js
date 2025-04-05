// src/constants.js
module.exports = {
    PORT: process.env.PORT || 3001,
    DB: {
      user: process.env.DB_USER || "",
      host: process.env.DB_HOST || "",
      database: process.env.DB_NAME || "",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || "5432",
    },
    COGNITO: {
      USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "",
      REGION: process.env.COGNITO_REGION || ""
    }
  };
  