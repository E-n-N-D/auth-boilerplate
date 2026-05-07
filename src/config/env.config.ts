import "dotenv/config";

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  databaseURL: process.env.DATABASE_URL,

  jwtsecret: process.env.JWT_SECRET,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});