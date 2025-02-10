const sdk = require("node-appwrite");
const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID } = require("../../databases/appwrite/appwrite");
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");

async function shorten(req, res) {
    if (!req.body.longUrl || !req.body.user_id) {
        return res.status(400).json({ error: "Parameters missing", message: "missing 'longUrl' or 'user_id'" });
    }

    const { longUrl, user_id } = req.body;
    let customAlias = req.body?.customAlias || generateRandomAlias(), topic = req.body?.topic || '';

    try {
        const { isExists } = await checkAliasEntry(customAlias);
        if (isExists) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Alias already exists"
            });
        }

        const { $createdAt, short_url } = await databases.createDocument(DATABASE_ID, ENTIRES_COLLECTION_ID, sdk.ID.unique(), {
            alias: customAlias, long_url: longUrl, topic, short_url: `https://urlshortnerappdeployedoonvercel.vercel.app/${customAlias}`, user_id
        });

        res.status(200).json({
            message: "Request successful",
            createdAt: $createdAt,
            shortUrl: short_url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ...error });
    }
}

module.exports = { shorten }