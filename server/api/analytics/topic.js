const { databases, DATABASE_ID, ENTIRES_COLLECTION_ID, ANALYTICS_COLLECTION_ID } = require('../../databases/appwrite/appwrite');
const sdk = require("node-appwrite");
const client = require('../../redis/client');

/**
 * @description Gets the analytics for a given topic and user ID.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>}
 */
async function getAnalyticsByTopic(req, res) {
    try {
        const topic = req.params?.topic;
        const user_id = req.query?.user_id;

        if (!user_id || !topic) {
            return res.status(400).json({ error: "Bad Request", message: "user_id and topic are required" });
        }

        const key = `analytics_by_topic_and_user_id:${topic}:${user_id}`;
        try {
            const cachedData = await client.get(key);
            if (cachedData !== null) {
                const cachedDataParsed = JSON.parse(cachedData);
                return res.status(200).json(cachedDataParsed);
            }
        } catch (cacheError) {
            console.error("Error accessing or parsing cache:", cacheError);
            // Continue to fetch data from the database even if cache access fails.
        }


        try {
            // Getting all the url entries based on the topic
            const entries = await databases.listDocuments(DATABASE_ID, ENTIRES_COLLECTION_ID, [
                sdk.Query.equal('user_id', user_id),
                sdk.Query.equal('topic', topic),
                sdk.Query.select(['$id', 'alias'])
            ]);

            if (entries.documents.length === 0) {
                return res.status(404).json({ error: "Not Found", message: `No entries found for topic ${topic} and user ${user_id}` });
            }

            const entriesData = [];
            let totalClicks = 0;
            const uniqueUserSet = new Set();
            const clickDate = [];

            // getting all the data for each of the entries   
            for (let i = 0; i < entries.documents.length; ++i) {
                const entry = entries.documents[i];
                try {
                    const { documents: newDocs } = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION_ID, [
                        sdk.Query.equal('entries', entry.$id),
                        sdk.Query.limit(10993923) //Consider removing this limit if it's not necessary for performance
                    ]);
                    entriesData.push({ ...entry, analytics: newDocs });
                    totalClicks += newDocs.length;
                    for (let j = 0; j < newDocs.length; ++j) {
                        uniqueUserSet.add(newDocs[j].ip);
                        clickDate.push(new Date(newDocs[j].$createdAt));
                    }
                } catch (dbError) {
                    console.error(`Error fetching analytics for entry ${entry.$id}:`, dbError);
                    // Handle the error appropriately.  Options include:
                    // 1. Skip this entry and continue.
                    // 2. Return a partial result.
                    // 3. Throw the error to be handled at a higher level.  For production, option 1 or 2 is generally preferred.
                    // Here, we'll skip the entry and log the error.
                }
            }

            const uniqueDateClickSet = new Set(clickDate.map(date => date.toDateString()));

            const clicksByDate = Array.from(uniqueDateClickSet).map(dateString => {
                return {
                    date: dateString,
                    clicks: clickDate.filter(date => date.toDateString() === dateString).length
                };
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

            try {
                const stringify = JSON.stringify(response);
                await client.set(key, stringify);
            } catch (cacheError) {
                console.error("Error setting data in cache:", cacheError);
                // Decide how to handle cache errors.  You might log the error and continue, or throw it.
            }

            return res.status(200).json(response);
        } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).json({ error: "Internal server error", message: "Failed to retrieve analytics from database." });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal server error", message: "An unexpected error occurred." });
    }
}

module.exports = {
    getAnalyticsByTopic
};