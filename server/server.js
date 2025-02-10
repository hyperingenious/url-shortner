require('dotenv').config()
const express = require('express');
const { limiter } = require('./helpers/limiter');
const { getAnalytics } = require('./helpers/getAnalytics');
const app = express();

const { overall } = require('./api/analytics/overall');
const { shorten } = require('./api/shorten/shorten');
const { shortenAlias } = require('./api/shorten/alias');
const { getAnalyticsByTopic } = require('./api/analytics/topic');
const { getAnalyticsWithAlias } = require('./api/analytics/alias');

app.use(express.json());
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

/**
 * @route GET /api/analytics/overall
 * @description Gets the overall analytics for a given user ID.
 * @access Public
 */
app.get('/api/analytics/overall', overall)

/**
 * @route POST /api/shorten
 * @description Shortens a long URL and returns the shortened URL.
 * @access Public
 * @rateLimit Uses the limiter middleware to rate-limit requests.
 */
app.use('/api/shorten', limiter);
app.post('/api/shorten', shorten);

/**
 * @route GET /api/shorten/:alias
 * @description Redirects to the long URL associated with the given alias.
 * @access Public
 * @middleware Uses the getAnalytics middleware to track analytics.
 */
app.use(getAnalytics);
app.get('/api/shorten/:alias', shortenAlias)

/**
 * @route GET /api/analytics/:alias
 * @description Gets the analytics for a given alias.
 * @access Public
 */
app.get('/api/analytics/:alias', getAnalyticsWithAlias)

/**
 * @route GET /api/analytics/topic/:topic
 * @description Gets the analytics for a given topic.
 * @access Public
 */
app.get('/api/analytics/topic/:topic', getAnalyticsByTopic)


// Starting the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});