const express = require('express');
const { limiter } = require('./helpers/limiter');
const { getAnalytics } = require('./helpers/getAnalytics');
const app = express();

const { overall } = require('./api/analytics/overall');
const { shorten } = require('./api/shorten/shorten');
const { shortenAlias } = require('./api/shorten/alias');
app.use(express.json());

app.use('/api/shorten', limiter);
app.post('/api/shorten', shorten);

app.use(getAnalytics);
app.get('/api/shorten/:alias', shortenAlias)

app.get('/api/analytics/{alias}', getAnalyticsWithAlias)
app.get('/api/analytics/topic/{topic}', getAnalyticsByTopic)
app.get('/api/analytics/overall', overall)

// Starting the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}

8""""8                                         8   8                                    8"""8                          8  
8    8   eeeee eeeee  e     eeee eeeee e   e   8   8  e   e eeeee e     e  eeee eeeee   8   8  eeeee eeee e   e  eeeee 88 
8eeee8ee 8   8 8   8  8     8    8   " 8   8   8eee8e 8   8 8   8 8     8  8    8   8   8eee8e 8  88 8  8 8   8  8   " 88 
88     8 8eee8 8eee8e 8e    8eee 8eeee 8eee8   88   8 8eee8 8eee8 8e    8e 8eee 8eee8   88   8 8   8 8e   8eee8e 8eeee 88 
88     8 88  8 88   8 88    88      88 88  8   88   8 88  8 88  8 88    88 88   88  8   88   8 8   8 88   88   8    88    
88eeeee8 88  8 88eee8 88eee 88ee 8ee88 88  8   88   8 88  8 88  8 88eee 88 88   88  8   88   8 8eee8 88e8 88   8 8ee88 88

`);
});
