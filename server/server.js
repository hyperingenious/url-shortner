require("dotenv").config();
const express = require("express");
const { limiter } = require("./helpers/limiter");
const { getAnalytics } = require("./helpers/getAnalytics");
const { overall } = require("./api/analytics/overall");
const { shorten } = require("./api/shorten/shorten");
const { shortenAlias } = require("./api/shorten/alias");
const { getAnalyticsByTopic } = require("./api/analytics/topic");
const { getAnalyticsWithAlias } = require("./api/analytics/alias");

const { swaggerUi, specs } = require("./swaggerConfig");
const cron = require('node-cron');

cron.schedule('*/10 * * * *', () => {
  console.log('Cron job pinging itself at', new Date());
  // Add any other logic you want to execute every 10 minutes here. 
});

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Serve Swagger documentation at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));


/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall analytics for a user
 *     description: Retrieves total URLs, clicks, unique users, and analytics data for a given user ID.
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user.
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUrls:
 *                   type: integer
 *                   example: 15
 *                 totalClicks:
 *                   type: integer
 *                   example: 150
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 45
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-02-10"
 *                       totalClick:
 *                         type: integer
 *                         example: 20
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osType:
 *                         type: string
 *                         example: "Windows"
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 30
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 80
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceType:
 *                         type: string
 *                         example: "Desktop"
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 25
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 60
 *       400:
 *         description: Bad request - Missing user_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "missing user_id"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve overall analytics."
 */
app.get("/api/analytics/overall", overall);

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Shorten a long URL
 *     description: Converts a long URL into a shortened one with an optional custom alias and topic.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - longUrl
 *               - user_id
 *             properties:
 *               longUrl:
 *                 type: string
 *                 example: "https://example.com/some/long/url"
 *               user_id:
 *                 type: string
 *                 example: "user_12345"
 *               customAlias:
 *                 type: string
 *                 example: "mycustomalias"
 *                 description: Optional custom alias for the short URL
 *               topic:
 *                 type: string
 *                 example: "Technology"
 *                 description: Optional topic or category for the URL
 *     responses:
 *       200:
 *         description: Successfully created a short URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Request successful"
 *                 createdAt:
 *                   type: string
 *                   example: "2025-02-11T12:00:00Z"
 *                 shortUrl:
 *                   type: string
 *                   example: "https://urlshortnerappdeployedoonvercel.vercel.app/mycustomalias"
 *       400:
 *         description: Bad request - Missing parameters or alias already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "missing 'longUrl' or 'user_id'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 */

app.use("/api/shorten", limiter);
app.post("/api/shorten", shorten);

/**
 * @swagger
 * /api/shorten/{alias}:
 *   get:
 *     summary: Redirect to a long URL using an alias
 *     description: Retrieves the long URL associated with the given alias and redirects the user.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias of the shortened URL
 *     responses:
 *       302:
 *         description: Redirects to the long URL
 *       404:
 *         description: Alias not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *                 message:
 *                   type: string
 *                   example: "Alias exampleAlias not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 */
app.use(getAnalytics);
app.get("/api/shorten/:alias", shortenAlias);

/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Retrieve analytics for a given alias
 *     description: Fetches analytics data including total clicks, unique users, device usage, and OS distribution for the provided alias.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias for which analytics data is requested
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   example: 125
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 80
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [10, 15, 20, 25, 30, 15, 10]
 *                 osData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osType:
 *                         type: string
 *                         example: "Windows"
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 45
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 60
 *                 deviceData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceType:
 *                         type: string
 *                         example: "Phone"
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 50
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 70
 *       404:
 *         description: Alias not found or no analytics data available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *                 message:
 *                   type: string
 *                   example: "Alias exampleAlias not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 */

app.get("/api/analytics/:alias", getAnalyticsWithAlias);

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Retrieve analytics for a given topic and user ID
 *     description: Fetches analytics data including total clicks, unique users, and URL-specific analytics for a provided topic and user.
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic for which analytics data is requested
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID associated with the analytics
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   example: 250
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 180
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-02-10"
 *                       clicks:
 *                         type: integer
 *                         example: 30
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortUrlAlias:
 *                         type: string
 *                         example: "my-short-url"
 *                       totalClicks:
 *                         type: integer
 *                         example: 50
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 40
 *       400:
 *         description: Missing required parameters (user_id or topic)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "user_id and topic are required"
 *       404:
 *         description: No analytics data found for the given topic and user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *                 message:
 *                   type: string
 *                   example: "No entries found for topic myTopic and user 12345"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 */

app.get("/api/analytics/topic/:topic", getAnalyticsByTopic);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:3000/api-docs`);
});
