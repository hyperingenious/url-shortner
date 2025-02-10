const { databases, ANALYTICS_COLLECTION_ID, DATABASE_ID } = require("../../databases/appwrite/appwrite");
const sdk = require('node-appwrite')
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");
const client = require("../../redis/client");

/**
 * route handeler redirects user to a longer url using alias 
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
async function shortenAlias(req, res) {
    try {
        const { alias } = req.params;
        const key = `long_url_with_alias:${alias}`
        const long_url = await client.get(key)

        if (long_url !== null) {
            res.redirect(long_url)
        }

        const data = await checkAliasEntry(alias);
        if (!data.isExists) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Alias already exists"
            });
        }

        if (!long_url) {
            await client.set(key, data.long_url, 10)
            res.redirect(data.long_url)
        }

        const { ipAddress, geoLocationCity, geoLocationCountry, osType, deviceType } = req.userInfo;

        await databases.createDocument(DATABASE_ID, ANALYTICS_COLLECTION_ID, sdk.ID.unique(), {
            ip: ipAddress, entries: data.$id, alias, os_type: osType, device_type: deviceType, city: geoLocationCity, country: geoLocationCountry
        })
        return;

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Server Error", message: error.message })
    }
}

module.exports = {
    shortenAlias
}