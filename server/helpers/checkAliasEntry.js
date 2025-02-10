const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID } = require("../databases/appwrite/appwrite");
const sdk = require("node-appwrite");

/**
 * @description Takes in an alias and checks if there's already an entry with the existing alias.
 * @param {String} alias URL alias
 * @returns {Object} An object containing a boolean indicating whether the alias exists and the document if it does.
 */
async function checkAliasEntry(alias) {
    const { documents } = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [sdk.Query.equal('alias', alias)]);
    return { isExists: documents.length > 0, ...documents[0] }
}

module.exports = { checkAliasEntry }