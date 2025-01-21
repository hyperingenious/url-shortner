const rateLimit = require('express-rate-limit');

// Rate Limiting: Max 5 URLs per hour per user
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again after an hour.',
  keyGenerator: (req) => req.body.user_id
});

module.exports = { limiter }