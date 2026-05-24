import "dotenv/config";

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  databaseURL: process.env.DATABASE_URL,

  refreshSecret: process.env.REFRESH_SECRET || 'refresh',
  accessSecret: process.env.ACCESS_SECRET || 'access',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM
  }

});