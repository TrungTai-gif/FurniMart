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

	// Payment Gateway Configurations
	paymentGateways: {
		vnpay: {
			tmnCode: process.env.VNPAY_TMN_CODE || '',
			hashSecret: process.env.VNPAY_HASH_SECRET || '',
			url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
			returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/return',
			ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5003/api/payments/vnpay/ipn',
		},
		momo: {
			partnerCode: process.env.MOMO_PARTNER_CODE || '',
			accessKey: process.env.MOMO_ACCESS_KEY || '',
			secretKey: process.env.MOMO_SECRET_KEY || '',
			endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
			returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:3000/payment/momo/return',
			ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5003/api/payments/momo/ipn',
		},
		zalopay: {
			appId: process.env.ZALOPAY_APP_ID || '',
			key1: process.env.ZALOPAY_KEY1 || '',
			key2: process.env.ZALOPAY_KEY2 || '',
			endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
			returnUrl: process.env.ZALOPAY_RETURN_URL || 'http://localhost:3000/payment/zalopay/return',
			callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:5003/api/payments/zalopay/callback',
		},
	},
};
