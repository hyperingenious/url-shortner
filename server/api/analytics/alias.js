const { databases, DATABASE_ID, ANALYTICS_COLLECTION_ID } = require("../../databases/appwrite/appwrite");
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");
const sdk = require('node-appwrite');
const client = require("../../redis/client");

/**
 * @description Retrieves analytics for a given alias.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>}
 */
async function getAnalyticsWithAlias(req, res) {
    const alias = req.params.alias;
    const key = `analytics_data_with_alias:${alias}`;

    try {
        // Try to retrieve data from cache
        const cachedAnalyticsData = await client.get(key);
        if (cachedAnalyticsData !== null) {
            const parsedData = JSON.parse(cachedAnalyticsData);
            return res.status(200).json(parsedData);
        }

        const availableOS = ['Windows', 'MacOS', 'Linux', 'Unknown'];
        const availableDevices = ['Phone', 'Tablet', 'Desktop'];

        // Check if alias exists
        const aliasData = checkAliasEntry(alias);
        if (!aliasData.isExists) {
            return res.status(404).json({ error: "Not Found", message: `Alias ${alias} not found` });
        }

        // Fetch analytics data from database
        const { documents } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [
            sdk.Query.equal('alias', alias)
        ]);

        if (!documents || documents.length === 0) {
            return res.status(404).json({ error: "Not Found", message: `No data found for alias ${alias}` });
        }

        const totalClicks = documents.length;
        const uniqueUsers = new Set();
        const clicksByDate = Array.from({ length: 7 }, () => 0);
        const osData = availableOS.map(osType => ({ osType, uniqueUsers: 0, uniqueClicks: 0 }));
        const deviceData = availableDevices.map(deviceType => ({ deviceType, uniqueClicks: 0, uniqueUsers: 0 }));
        const today = new Date();

        for (const doc of documents) {
            const ip = doc.ip;
            const deviceIndex = availableDevices.indexOf(doc.device_type);
            const osIndex = availableOS.indexOf(doc.os_type);

            uniqueUsers.add(ip); //Efficiently tracks unique users

            if (deviceIndex !== -1) {
                deviceData[deviceIndex].uniqueClicks++;
                deviceData[deviceIndex].uniqueUsers++; //Simplified unique user count
            }

            if (osIndex !== -1) {
                osData[osIndex].uniqueClicks++;
                osData[osIndex].uniqueUsers++; //Simplified unique user count
            }

            const daysSinceToday = Math.floor((today - new Date(doc.$createdAt)) / (1000 * 60 * 60 * 24));
            if (daysSinceToday < 7) {
                clicksByDate[daysSinceToday]++;
            }
        }

        const analyticsData = {
            totalClicks,
            uniqueUsers: uniqueUsers.size,
            clicksByDate,
            osData,
            deviceData
        };

        // Cache the analytics data
        await client.set(key, JSON.stringify(analyticsData));
        return res.status(200).json(analyticsData);
    } catch (error) {
        console.error("Error in getAnalyticsWithAlias:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}

module.exports = { getAnalyticsWithAlias };