const admin = require("firebase-admin");
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)),
  projectId: "web-main-nodsync"
});

const uid = "kQpT8RcdzBSXRRfiLlWV5o9yr0i2";

// use setCustomUserClaims(uid, null) to remove admin claims.
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Custom claims set for user", uid);
  })
  .catch(error => {
    console.error("Error setting custom claims:", error);
  });