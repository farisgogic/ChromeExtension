const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    clientId: process.env.CLIENT_ID,
    tenantId: process.env.TENANT_ID
};
