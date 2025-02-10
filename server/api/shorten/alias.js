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
        const key = `long_url_with_alias:${alias}`;
        let longUrl;

        try {
            longUrl = await client.get(key);
            if (longUrl !== null) {
                return res.redirect(longUrl);
            }
        } catch (cacheError) {
            console.error("Error retrieving URL from cache:", cacheError);
            // Continue to fetch from database even if cache access fails.
        }

        try {
            const data = await checkAliasEntry(alias);
            if (!data.isExists) {
                return res.status(404).json({ // Changed to 404 Not Found
                    error: "Not Found",
                    message: `Alias ${alias} not found`
                });
            }

            if (!longUrl) {
                try {
                    await client.set(key, data.long_url, 10); //Store in cache for 10 seconds. Adjust as needed.
                    longUrl = data.long_url;
                } catch (cacheError) {
                    console.error("Error setting URL in cache:", cacheError);
                    // Proceed even if caching fails.  Log the error for debugging.
                }
                return res.redirect(longUrl);
            }
        } catch (checkAliasError) {
            console.error("Error checking alias:", checkAliasError);
            return res.status(500).json({ error: "Internal Server Error", message: "Failed to check alias." });
        }


        const { ipAddress, geoLocationCity, geoLocationCountry, osType, deviceType } = req.userInfo;

        try {
            await databases.createDocument(DATABASE_ID, ANALYTICS_COLLECTION_ID, sdk.ID.unique(), {
                ip: ipAddress, entries: data.$id, alias, os_type: osType, device_type: deviceType, city: geoLocationCity, country: geoLocationCountry
            });
        } catch (dbError) {
            console.error("Error creating analytics document:", dbError);
            // Decide how to handle database errors.  Options include logging, returning a partial response, or throwing the error.
            // For production, logging and continuing is often the best approach.
        }

    } catch (error) {
        console.error("Unexpected error in shortenAlias:", error);
        return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
}

module.exports = {
    shortenAlias
}