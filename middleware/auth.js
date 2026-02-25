const jwt = require("jsonwebtoken");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const getAccessTokenFromRequest = (req) => {
	const authHeader = req.headers.authorization || "";
	if (authHeader.startsWith("Bearer ")) {
		return authHeader.replace("Bearer ", "");
	}
	return req.cookies?.access_token;
};

const authenticateToken = (req, res, next) => {
	const token = getAccessTokenFromRequest(req);
	if (!token) {
		return res.status(401).json({ message: "로그인이 필요합니다" });
	}
	if (!JWT_ACCESS_SECRET) {
		return res.status(500).json({ message: "JWT_ACCESS_SECRET is not set" });
	}

	try {
		const payload = jwt.verify(token, JWT_ACCESS_SECRET);
		req.user = { sub: payload.sub, id: payload.sub };
		next();
	} catch (error) {
		return res.status(401).json({ message: "토큰이 유효하지 않습니다" });
	}
};

const optionalAuthenticateToken = async (req, res, next) => {
	const token = getAccessTokenFromRequest(req);
	
	if (!token) {
		// 토큰이 없으면 기본 사용자 사용
		const { User } = require("../models");
		const defaultUser = await User.findOne();
		if (defaultUser) {
			req.user = { sub: defaultUser._id.toString(), id: defaultUser._id.toString() };
		}
		return next();
	}
	
	if (!JWT_ACCESS_SECRET) {
		return res.status(500).json({ message: "JWT_ACCESS_SECRET is not set" });
	}

	try {
		const payload = jwt.verify(token, JWT_ACCESS_SECRET);
		req.user = { sub: payload.sub, id: payload.sub };
		next();
	} catch (error) {
		// 토큰이 유효하지 않으면 기본 사용자 사용
		const { User } = require("../models");
		const defaultUser = await User.findOne();
		if (defaultUser) {
			req.user = { sub: defaultUser._id.toString(), id: defaultUser._id.toString() };
		}
		next();
	}
};

module.exports = { authenticateToken, optionalAuthenticateToken, getAccessTokenFromRequest };
