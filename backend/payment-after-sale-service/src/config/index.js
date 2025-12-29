require('dotenv').config();

module.exports = {
	port: process.env.PORT || 5003,
	nodeEnv: process.env.NODE_ENV || 'development',
  
	// Database configuration
	database: {
		user: process.env.SQL_SERVER_USER || 'sa',
		password: process.env.SQL_SERVER_PASSWORD || 'FurniMart@2024',
		server: process.env.SQL_SERVER_HOST || 'sqlserver',
		database: 'payment_db',
		port: parseInt(process.env.SQL_SERVER_PORT || '1433'),
		options: {
			encrypt: false,
			trustServerCertificate: true,
			enableArithAbort: true,
		},
		pool: {
			max: 10,
			min: 0,
			idleTimeoutMillis: 30000,
		},
	},

	// CORS configuration
	cors: {
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true,
	},
};
