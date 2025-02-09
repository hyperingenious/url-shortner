require('dotenv').config()
const sdk = require("node-appwrite");

const APPWRITE_CLOUD_URL = process.env.APPWRITE_CLOUD_URL;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_APP_KEY = process.env.APPWRITE_APP_KEY;

const client = new sdk.Client()
  .setEndpoint(APPWRITE_CLOUD_URL)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_APP_KEY);

const databases = new sdk.Databases(client);

//  Constants
const DATABASE_ID = process.env.DATABASE_ID
const ENTIRES_COLLECTION_ID = process.env.APPWRITE_ENTRIES_COLLECTION_ID
const ANALYTICS_COLLECTION_ID = process.env.APPWRITE_ANALYTICS_COLLECTION_ID


module.exports = {
  APPWRITE_CLOUD_URL,
  APPWRITE_PROJECT_ID,
  APPWRITE_APP_KEY,

  ENTIRES_COLLECTION_ID,
  ANALYTICS_COLLECTION_ID,

  databases,
  DATABASE_ID,
}