const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID, ANALYTICS_COLLECTION_ID } = require("../../databases/appwrite/appwrite");

const sdk = require("node-appwrite");
const { areDatesEqual } = require("../../helpers/compareDate");
const client = require("../../redis/client");
async function overall(req, res) {
    try {
        // Throwing error if user id not present
        const user_id = req.query?.user_id;
        if (!user_id) {
            return res.status(400).json({ error: "Bad Request", message: "missing user_id" });
        }

        const key = `overall:${user_id}`;
        const value = await client.get(key);

        if (value !== null) {
            try {
                const data = JSON.parse(value);
                return res.status(200).json(data);
            } catch (jsonError) {
                console.error("Error parsing JSON from cache:", jsonError);
                // Proceed to fetch data from the database
            }
        }

        // Getting total urls created by user
        const { documents: entires } = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [
            sdk.Query.equal('user_id', user_id),
            sdk.Query.select(['$id']),
            sdk.Query.limit(1000) //Added limit for safety. Adjust as needed.
        ]);
        const totalUrls = entires.length;

        let documents = [];

        // Getting all the clicks data with user_id
        for (let i = 0; i < entires.length; ++i) {
            try {
                const { documents: alskdfk } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [
                    sdk.Query.equal('entries', entires[i].$id),
                    sdk.Query.limit(1000) //Added limit for safety. Adjust as needed.
                ]);
                documents = [...documents, ...alskdfk];
            } catch (dbError) {
                console.error(`Error fetching analytics for entry ${entires[i].$id}:`, dbError);
                //Consider alternative handling:  log the error, skip this entry, or return a partial result.
            }
        }

        const uniqueUserSet = new Set();
        const totalClicks = documents.length;

        // Counting all unique users with ip
        documents.forEach(element => {
            uniqueUserSet.add(element.ip);
        });

        const clicksByDate = [];

        // Getting all the clicks datewise
        const allDateArray = [];
        documents.forEach(el => allDateArray.push(el.$createdAt.split('T')[0]));
        const uniqueDatesSet = new Set(allDateArray);
        const uniqueDatesArray = [...uniqueDatesSet];

        uniqueDatesArray.forEach(uniqueEl => {
            const countedUrl = allDateArray.filter(date => areDatesEqual(uniqueEl, date));
            clicksByDate.push({
                date: uniqueEl,
                totalClick: countedUrl.length
            });
        });

        // Array containing all the OS and devices
        const availableOS = ['Windows', 'MacOS', 'Linux', 'Unknown'];
        const availableDevice = ['Phone', 'Tablet', 'Desktop'];

        // Arrays to store unique and non-unique clicks grouped by OS and device type
        const osData = Array.from({ length: 4 }, (_, i) => ({
            osType: availableOS[i],
            uniqueUsers: 0,
            uniqueClicks: 0
        }));
        const deviceData = Array.from({ length: 3 }, (_, i) => ({
            deviceType: availableDevice[i],
            uniqueClicks: 0,
            uniqueUsers: 0
        }));

        const uniqueUsersIPs = new Set();

        // Here goes the logic for grouping data
        for (let i = 0; i < documents.length; ++i) {
            const doc = documents[i];
            const ip = doc.ip;

            const deviceIndex = availableDevice.indexOf(doc.device_type);
            const osIndex = availableOS.indexOf(doc.os_type);

            if (deviceIndex !== -1) {
                deviceData[deviceIndex].uniqueClicks += 1;
            }

            if (osIndex !== -1) {
                osData[osIndex].uniqueClicks += 1;
            }

            if (!uniqueUsersIPs.has(ip)) {
                if (deviceIndex !== -1) {
                    deviceData[deviceIndex].uniqueUsers += 1;
                }
                if (osIndex !== -1) {
                    osData[osIndex].uniqueUsers += 1;
                }
                uniqueUsersIPs.add(ip);
            }
        }

        const response = {
            totalUrls,
            totalClicks,
            uniqueUsers: uniqueUserSet.size,
            clicksByDate,
            osType: osData,
            deviceType: deviceData
        };
        const stringified_data = JSON.stringify(response);
        await client.set(key, stringified_data, 1 * 60 * 10);
        return res.status(200).json(response);
    } catch (error) {
        console.error("Error in overall analytics:", error);
        return res.status(500).json({ error: "Internal server error", message: "Failed to retrieve overall analytics." });
    }
}

module.exports = {
    overall
};