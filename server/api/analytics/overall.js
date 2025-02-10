const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID, ANALYTICS_COLLECTION_ID } = require("../../databases/appwrite/appwrite");

const sdk = require("node-appwrite");
const { areDatesEqual } = require("../../helpers/compareDate");
const client = require("../../redis/client");
async function overall(req, res) {
    try {
        // Throwing error if user id not present
        const user_id = req.query?.user_id;
        if (!user_id) res.status(400).json({ error: "Bad Request", message: "missing user_id" })

        const key = `overall:${user_id}`
        const value = await client.get(key)

        if (value !== null) {
            const data = JSON.parse(value)
            
            return res.status(200).json(data)
        }

        // Getting total urls creaed by user
        const { documents: entires } = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [sdk.Query.equal('user_id', user_id), sdk.Query.select(['$id']), sdk.Query.limit(38398383)])
        const totalUrls = entires.length;

        let documents = [];

        // getting all the clicks data with user_id
        for (let i = 0; i < entires.length; ++i) {
            const { documents: alskdfk } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [sdk.Query.equal('entries', entires[i].$id), sdk.Query.limit(82383838)])
            documents = [...documents, ...alskdfk]
        }

        const uniqueUserSet = new Set();
        const totalClicks = documents.length

        // counting all unique users with ip
        documents.forEach(element => {
            uniqueUserSet.add(element.ip)
        });

        const clicksByDate = [];

        // getting all the clicks datewise
        const allDateArray = [];
        documents.forEach(el => allDateArray.push(el.$createdAt.split('T')[0]))
        const uniqueDatesSet = new Set(allDateArray)
        const uniqueDatesArray = [...uniqueDatesSet]

        uniqueDatesArray.forEach(uniqueEl => {
            const countedUrl = allDateArray.filter(date => areDatesEqual(uniqueEl, date))
            clicksByDate.push({
                date: uniqueEl,
                totalClick: countedUrl.length
            })
        })

        // array containing all the OS and devices
        const availableOS = ['Windows', 'MacOS', 'Linux', 'Unknown'];
        const availableDevice = ['Phone', 'Tablet', 'Desktop',];

        // arrays to store unique and non-unqique clicks grouped by OS and device type 
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

        // here goes the logic for groupign data
        for (let i = 0; i < documents.length; ++i) {
            const doc = documents[i]
            const ip = doc.ip

            const deviceIndex = availableDevice.indexOf(doc.device_type)
            const osIndex = availableOS.indexOf(doc.os_type)

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

        }

        const response = {
            totalUrls, totalClicks,
            uniqueUsers: uniqueUserSet.size,
            clicksByDate, osType: osData, deviceType: deviceData
        }
        const stringified_data = JSON.stringify(response);
        await client.set(key, stringified_data, 1 * 60 * 10)
        return res.status(200).json(response)

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error", message: error.message })
    }
}

module.exports = {
    overall
}