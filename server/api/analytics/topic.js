const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID, ANALYTICS_COLLECTION_ID } = require('../../databases/appwrite/appwrite');
const { areDatesEqual } = require('../../helpers/compareDate');
const sdk = require("node-appwrite");

async function getAnalyticsByTopic(req, res) {
    try {
        const topic = req.params.topic;
        const user_id = req.body?.user_id


        if (!user_id) {
            return res.status(400).json({ error: "Bad Request", message: "user_id missing" })
        }

        // Getting all the url entries based on the topic
        const entries = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [sdk.Query.equal('user_id', user_id), sdk.Query.equal('topic', topic), sdk.Query.select(['$id', 'alias'])]);

        if(entries.documents.length === 0){
            return res.status(404).json({error: "Not Found", message: `No entries found for topic ${topic} and user ${user_id}`})
        }

        const entriesData = [];
        let totalClicks = 0;
        const uniqueUserSet = new Set();
        const clickDate = [];

        // getting all the data for each of the entries   
        for (let i = 0; i < entries.documents.length; ++i) {
            const entry = entries.documents[i];
            const { documents: newDocs } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [sdk.Query.equal('entries', entry.$id), sdk.Query.limit(10993923)]);
            entriesData.push({...entry, analytics: newDocs});
            totalClicks += newDocs.length;
            for (let j = 0; j < newDocs.length; ++j) {
                uniqueUserSet.add(newDocs[j].ip);
                clickDate.push(new Date(newDocs[j].$createdAt));
            }
        }

        const uniqueDateClickSet = new Set(clickDate.map(date => date.toDateString()));

        const clicksByDate = Array.from(uniqueDateClickSet).map(dateString => {
            return {
                date: dateString,
                clicks: clickDate.filter(date => date.toDateString() === dateString).length
            }
        });

        const urls = entriesData.map(entry => ({
            shortUrlAlias: entry.alias,
            totalClicks: entry.analytics.length,
            uniqueUsers: new Set(entry.analytics.map(analytic => analytic.ip)).size
        }));

        const response = {
            totalClicks,
            uniqueUsers: uniqueUserSet.size,
            clicksByDate,
            urls
        };
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
}
module.exports = {
    getAnalyticsByTopic
};