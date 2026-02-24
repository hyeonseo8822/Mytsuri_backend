const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || "30d";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const accessCookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: false,
	maxAge: 1000 * 60 * 15
};

const refreshCookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: false,
	maxAge: 1000 * 60 * 60 * 24 * 30
};

const createAccessToken = (userId) =>
	jwt.sign({ sub: userId }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_TTL });

const createRefreshToken = (userId) =>
	jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_TTL });

const setAuthCookies = (res, accessToken, refreshToken) => {
	res.cookie("access_token", accessToken, accessCookieOptions);
	res.cookie("refresh_token", refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
	res.clearCookie("access_token", accessCookieOptions);
	res.clearCookie("refresh_token", refreshCookieOptions);
};

// Google OAuth 로그인
exports.googleAuth = async (req, res) => {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ message: "idToken is required" });
		}
		if (!GOOGLE_CLIENT_ID) {
			return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not set" });
		}
		if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
			return res.status(500).json({ message: "JWT secrets are not set" });
		}

		const ticket = await googleClient.verifyIdToken({
			idToken,
			audience: GOOGLE_CLIENT_ID
		});
		const payload = ticket.getPayload();
		if (!payload) {
			return res.status(401).json({ message: "Google 인증 실패" });
		}

		const googleId = payload.sub;
		const nickname = payload.name || "사용자";
		const profileImg = payload.picture || "";

		let user = await User.findOne({ google_id: googleId });
		let isNewUser = false;

		if (user) {
			user.nickname = nickname;
			user.profile_img = profileImg;
			user = await user.save();
		} else {
			isNewUser = true;
			user = await User.create({
				google_id: googleId,
				nickname,
				profile_img: profileImg,
				preference_tags: []
			});
		}

		const accessToken = createAccessToken(user._id);
		const refreshToken = createRefreshToken(user._id);
		setAuthCookies(res, accessToken, refreshToken);

		res.status(200).json({
			isNewUser,
			userId: user._id,
			nickname: user.nickname,
			profileImg: user.profile_img,
			accessToken
		});
	} catch (error) {
		res.status(401).json({ message: "Google 인증 실패" });
	}
};

// 토큰 갱신
exports.refreshTokens = async (req, res) => {
	const refreshToken = req.cookies?.refresh_token;
	if (!refreshToken) {
		return res.status(401).json({ message: "리프레시 토큰이 필요합니다" });
	}
	if (!JWT_REFRESH_SECRET || !JWT_ACCESS_SECRET) {
		return res.status(500).json({ message: "JWT secrets are not set" });
	}

	try {
		const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
		const user = await User.findById(payload.sub).lean();
		if (!user) {
			return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
		}

		const newAccessToken = createAccessToken(user._id);
		const newRefreshToken = createRefreshToken(user._id);
		setAuthCookies(res, newAccessToken, newRefreshToken);

		return res.status(200).json({ userId: user._id });
	} catch (error) {
		return res.status(401).json({ message: "리프레시 토큰이 유효하지 않습니다" });
	}
};

// 로그아웃
exports.logout = (req, res) => {
	clearAuthCookies(res);
	res.status(200).json({ message: "로그아웃 완료" });
};

module.exports = exports;
