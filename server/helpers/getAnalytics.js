const ipStackKey = process.env.IP_STACK_KEY
function getAnalytics(req, _, next) {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geoUrl = `https://api.ipstack.com/${ipAddress}?access_key=${ipStackKey}`;

    https.get(geoUrl, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const geoInfo = JSON.parse(data);
            const { country_name, city } = geoInfo;
            const userAgent = req.headers['user-agent'];
            let osType = 'Unknown';
            let deviceType = 'Desktop';

            if (userAgent.includes('Windows')) {
                osType = 'Windows';
            } else if (userAgent.includes('Mac')) {
                osType = 'MacOS';
            } else if (userAgent.includes('Linux')) {
                osType = 'Linux';
            }

            if (/mobile/i.test(userAgent)) {
                deviceType = 'Phone';
            } else if (/tablet/i.test(userAgent)) {
                deviceType = 'Tablet';
            }

            req.userInfo = {
                ipAddress,
                geoLocationCity: city,
                geoLocationCountry: country_name,
                osType,
                deviceType
            };

            next();
        });
    }).on('error', (err) => {
        next(err);
    });
}

module.exports = { getAnalytics }