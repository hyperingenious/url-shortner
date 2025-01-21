const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID } = require("../databases/appwrite/appwrite");
const sdk = require("node-appwrite");

async function checkAliasEntry(alias) {
    const { documents } = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [sdk.Query.equal('alias', alias)]);
    return { isExists: documents.length > 0, ...documents[0] }
}

module.exports = { checkAliasEntry }