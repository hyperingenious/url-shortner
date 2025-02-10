const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "URL Shortener API",
            version: "1.0.0",
            description: "API documentation for URL shortening and analytics",
        },
        servers: [{ url: "http://localhost:3000" }],
    },
    apis: ["./server.js"], // Path to the file containing route annotations
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };

