// src/constants.js
export const AWS_CONFIG = {
    Auth: {
      region: "us-east-1",
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID, // Set in .env file
      userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID, // Set in .env file
      mandatorySignIn: true,
      oauth: {
        domain: import.meta.env.VITE_COGNITO_DOMAIN, // e.g. your-cognito-domain.auth.us-east-1.amazoncognito.com
        scope: ["email", "openid", "profile"],
        redirectSignIn: import.meta.env.DEV
          ? "http://localhost:3000/"
          : "https://your-production-domain.com/",
        redirectSignOut: import.meta.env.DEV
          ? "http://localhost:3000/"
          : "https://your-production-domain.com/",
        responseType: "code"
      }
    },
    API: {
      endpoint: import.meta.env.DEV
        ? "http://localhost:3001"
        : "https://your-backend-api-endpoint"
    }
  };
  