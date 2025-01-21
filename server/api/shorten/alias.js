const { databases, ANALYTICS_COLLECTION_ID, DATABASE_ID } = require("../../databases/appwrite/appwrite");
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");

async function shortenAlias(req, res) {
    try {
        const alias = req.params;
        const data = await checkAliasEntry(alias);

        if (!data.isExists) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Alias already exists"
            });
        }

        const { ipAddress, geoLocationCity, geoLocationCountry, osType, deviceType } = req.userInfo;

        await databases.createDocument(DATABASE_ID, ANALYTICS_COLLECTION_ID, {
            ip: ipAddress,
            entries, alias, os_type: osType, device_type: deviceType, city: geoLocationCity, country: geoLocationCountry
        })

        res.redirect(data.long_url)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Server Error", message: error.message })
    }
}

module.exports = {
shortenAlias
}