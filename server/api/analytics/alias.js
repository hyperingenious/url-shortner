const { databases, DATABASE_ID, ANALYTICS_COLLECTION_ID } = require("../../databases/appwrite/appwrite");
const { checkAliasEntry } = require("../../helpers/checkAliasEntry");
const sdk = require('node-appwrite');
const client = require("../../redis/client");
/**
 * @description Gets the analytics for a given alias.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>}
 */
async function getAnalyticsWithAlias(req, res) {
    const alias = req.params.alias;

    const key = `analytics_data_with_alias:${alias}`
    const cachedAnalyticsData = await client.get(key)

    if (cachedAnalyticsData !== null) {
        const cachedDataParsed = JSON.parse(cachedAnalyticsData)
        return res.status(200).json(cachedDataParsed)
    }

    const availableOS = ['Windows', 'MacOS', 'Linux', 'Unknown'];
    const availableDevice = ['Phone', 'Tablet', 'Desktop',];

    const data = checkAliasEntry(alias)
    if (data.isExists) {
        return res.status(404).json({
            error: "Not Found",
            message: `Alias ${alias} not found`
        });
    }

    /* total clicks */
    const { documents } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [
        sdk.Query.equal('alias', alias)
    ])

    const totalClicks = documents.length;
    let uniqueUsers = 0
    const clicksByDate = Array.from({ length: 7 }, () => 0)

    const osData = Array.from({ length: 4 }, (_, i) => {
        return {
            osType: availableOS[i],
            uniqueUsers: 0,
            uniqueClicks: 0
        }
    })

    const deviceData = Array.from({ length: 3 }, (_, i) => {
        return {
            deviceType: availableDevice[i],
            uniqueClicks: 0,
            uniqueUsers: 0
        }
    })

    const uniqueUsersIPs = new Set()
    const today = new Date();

    for (let i = 0; i < totalClicks; ++i) {
        const doc = documents[i]
        const ip = doc.ip

        const deviceIndex = availableDevice.indexOf(doc.device_type)
        const osIndex = availableOS.indexOf(doc.os_type)

        if (!uniqueUsersIPs.has(ip)) {
            uniqueUsersIPs.add(ip)
            ++uniqueUsers;
        }

        if (deviceIndex !== -1) {
            deviceData[deviceIndex].uniqueClicks += 1;
        }

        if (osIndex !== -1) {
            osData[osIndex].uniqueClicks += 1;
        }

        if (!uniqueUsersIPs.has(ip)) {
            if (deviceIndex !== -1) {
                deviceData[deviceIndex].uniqueUsers += 1
            }
            if (osIndex !== -1) {
                osData[osIndex].uniqueUsers += 1
            }
        }

        let sinceToday = Math.floor((today - new Date(documents[i].$createdAt)) / (1000 * 60 * 60 * 24));
        if (sinceToday <= 7) {
            clicksByDate[sinceToday] = clicksByDate[sinceToday] + 1
        }
    }
    const aboutToShoot = { totalClicks, uniqueUsers, clicksByDate, osData, deviceData }
    const dataStringified = JSON.stringify(aboutToShoot)
    await client.set(key, dataStringified)

    return res.status(200).json(aboutToShoot)
}

module.exports = {
    getAnalyticsWithAlias
}