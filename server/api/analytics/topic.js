const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID, ANALYTICS_COLLECTION_ID } = require('../../databases/appwrite/appwrite');
const { areDatesEqual } = require('../../helpers/compareDate');
const sdk = require("node-appwrite");

async function getAnalyticsByTopic(req, res) {
    try {
        const topic = req.topic;
        const user_id = req.body?.user_id

        if (!(topic.length >= 5)) {
            return res.status(400).json({ error: "Bad request", message: "Alias length too short" })
        }

        if (!user_id) {
            return res.send(400).json({ error: "Bad Request", message: "user_id missing" })
        }

        // Getting all the url entries based on the topic
        const { documents } = databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [sdk.Query.equal('user_id', user_id), sdk.Query.equal('topic', topic), sdk.Query.select(['$id'])]);

        const entriesData = {};
        let totalClicks = 0;
        const uniqueUserSet = new Set();
        const clickDate = [];

        // getting all the data for each of the entries   
        for (let i = 0; i < documents.length; ++i) {
            const { documents: newDocs } = databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [sdk.Query.equal('entries', documents[i].$id)])
            entriesData.documents[i].$id = newDocs;
            totalClicks += newDocs.length
            for (let j = 0; j < newDocs.length; ++j) {
                uniqueUserSet.add(newDocs[j].ip);
                clickDate.push(newDocs[j].createdAt)
            }
        }

        const uniqueDateClickSet = new Set(clickDate);

        const clicksByDate = Array.from({ length: (uniqueDateClickSet.size + 1) }, (_, index) => {
            const arrayToSet = Array.from(uniqueDateClickSet)
            return {
                date: arrayToSet[index], clicks: 0
            }
        }).map(element => {
            const clickCounts = clickDate.filter(date => areDatesEqual(element.date, date)).length
            return {
                date: element, clicks: clickCounts
            }
        })

        const urls = [];
        for (const key in entriesData) {
            const allUrlClicks = entriesData[key]
            const newUser = new Set();
            allUrlClicks.forEach(click => {
                newUser.add(click.ip)
            });
            urls.push({
                shortUrlAlias: allUrlClicks[0].alias,
                totalClicks: allUrlClicks.length,
                uniqueUsers: newUser.size
            })
        }

        const response = {
            totalClicks,
            uniqueUsers: uniqueUserSet.size,
            clicksByDate, urls
        }
        res.status(200).json(response)
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", message: error.message })
    }
}
module.exports = {
    getAnalyticsByTopic
}