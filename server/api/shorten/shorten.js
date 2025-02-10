const sdk = require("node-appwrite");
const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID } = require("../../databases/appwrite/appwrite");
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");
const { generateRandomAlias } = require("../../helpers/generateRandomAlias"); //Import the function

async function shorten(req, res) {
    if (!req.body.longUrl || !req.body.user_id) {
        return res.status(400).json({ error: "Parameters missing", message: "missing 'longUrl' or 'user_id'" });
    }

    const { longUrl, user_id } = req.body;
    let customAlias = req.body?.customAlias;
    let topic = req.body?.topic || '';

    try {
        //Generate alias only if not provided
        if (!customAlias) {
            customAlias = await generateRandomAlias();
        }

        const { isExists, error: aliasCheckError } = await checkAliasEntry(customAlias); //Handle potential errors from checkAliasEntry

        if (aliasCheckError) {
            console.error("Error checking alias:", aliasCheckError);
            return res.status(500).json({ error: "Internal Server Error", message: "Failed to check alias." });
        }

        if (isExists) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Alias already exists"
            });
        }

        try {
            const { $createdAt, short_url } = await databases.createDocument(DATABASE_ID, ENTIRES_COLLECTION_ID, sdk.ID.unique(), {
                alias: customAlias, long_url: longUrl, topic, short_url: `https://urlshortnerappdeployedoonvercel.vercel.app/${customAlias}`, user_id
            });

            res.status(200).json({
                message: "Request successful",
                createdAt: $createdAt,
                shortUrl: short_url
            });
        } catch (dbError) {
            console.error("Database error creating document:", dbError);
            //More specific error handling for database issues.  Consider retry logic or more sophisticated error reporting.
            return res.status(500).json({ error: "Internal Server Error", message: "Failed to create short URL." });
        }

    } catch (error) {
        console.error("Unexpected error in shorten:", error);
        //Generic catch-all for unexpected errors.  Log the error for debugging purposes.
        return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
}

module.exports = { shorten }