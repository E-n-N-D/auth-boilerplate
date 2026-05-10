import "dotenv/config";

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  databaseURL: process.env.DATABASE_URL,

  refreshSecret: process.env.REFRESH_SECRET || 'refresh',
  accessSecret: process.env.ACCESS_SECRET || 'access',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});