

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || "30d";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const { User, Festival, Review, BannerSlide, Category, City, MapFilter, SearchHistory } = require("./models");
const { bannerSlides, categories, cities, festivals, mapFilters, festivalMarkers } = require("./data/data");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// ------------------------------------------------------------------
// Auth & User
// ------------------------------------------------------------------
const accessCookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: false, // 개발: false, 프로덕션: true
	maxAge: 1000 * 60 * 15
};

const refreshCookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: false, // 개발: false, 프로덕션: true
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
		req.user = { id: payload.sub };
		next();
	} catch (error) {
		return res.status(401).json({ message: "토큰이 유효하지 않습니다" });
	}
};

app.post("/api/auth/google", async (req, res) => {
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
});

app.post("/api/auth/refresh", async (req, res) => {
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
});

app.post("/api/auth/logout", (req, res) => {
	clearAuthCookies(res);
	res.status(200).json({ message: "로그아웃 완료" });
});

app.put("/api/users/me/preferences", authenticateToken, async (req, res) => {
	try {
		const { preferences } = req.body;
		res.status(200).json({ message: "취향 태그 업데이트 성공", preferences });
	} catch (error) {
		res.status(500).json({ message: "서버 오류" });
	}
});

app.get("/api/users/me", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id nickname profile_img preference_tags').lean();
		if (!user) {
			return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
		}
		res.status(200).json({
			userId: user._id,
			nickname: user.nickname,
			profileImg: user.profile_img,
			preferences: user.preference_tags || []
		});
	} catch (error) {
		res.status(500).json({ message: "사용자 정보 조회 실패" });
	}
});

app.put("/api/users/me", authenticateToken, async (req, res) => {
	const { nickname, profileImageUrl } = req.body;
	res.status(200).json({ message: "프로필 수정 완료", nickname, profileImageUrl });
});

app.get("/api/users/me/reviews", authenticateToken, async (req, res) => {
	res.status(200).json([{ reviewId: 1, festivalId: 10, rating: 5, content: "최고!" }]);
});

// ------------------------------------------------------------------
// Festivals
// ------------------------------------------------------------------
app.get("/api/festivals/recommended", async (req, res) => {
	res.status(200).json([{ festivalId: 1, name: "추천 축제" }]);
});

app.get("/api/festivals/trending", async (req, res) => {
	res.status(200).json([{ festivalId: 2, name: "인기 급상승 축제" }]);
});

app.get("/api/festivals/popular", async (req, res) => {
	res.status(200).json([{ festivalId: 3, name: "리뷰 많은 축제" }]);
});

app.get("/api/festivals/map", async (req, res) => {
	const { lat, lng, radius, region, month, type } = req.query;
	res.status(200).json([
		{ festivalId: 4, name: "도쿄 여름축제", lat: 35.6895, lng: 139.6917, category: "여름축제", query: { lat, lng, radius, region, month, type } }
	]);
});

app.get("/api/festivals", async (req, res) => {
	const { season, city } = req.query;
	const filter = {};

	// 시즌 영어 -> 한글 매핑
	const seasonMap = {
		summer: "여름축제",
		winter: "겨울축제",
		spring: "봄축제",
		autumn: "가을축제",
		food: "먹거리축제",
		local: "특산물축제"
	};

	// 도시 영어 -> 한글 매핑
	const cityMap = {
		kyoto: "교토",
		osaka: "오사카",
		nagoya: "나고야",
		tokyo: "도쿄",
		fukuoka: "후쿠오카"
	};

	// 시즌별 필터 (type 필드 사용)
	if (season && seasonMap[season]) {
		filter.type = seasonMap[season];
	}

	// 도시별 필터
	if (city && cityMap[city]) {
		filter.city = cityMap[city];
	}

	try {
		const festivals = await Festival.find(filter).sort({ created_at: -1 }).lean();
		res.status(200).json(festivals.map((festival) => {
			const startDate = new Date(festival.start_date);
			const endDate = new Date(festival.end_date);
			const startMonth = startDate.getMonth() + 1;
			const startDay = startDate.getDate();
			const endMonth = endDate.getMonth() + 1;
			const endDay = endDate.getDate();
			const year = startDate.getFullYear();

			let dateStr;
			if (startMonth === endMonth) {
				dateStr = `${year}년 ${startMonth}월 ${startDay}일~${endDay}일`;
			} else {
				dateStr = `${year}년 ${startMonth}월 ${startDay}일~${endMonth}월 ${endDay}일`;
			}

			return {
				id: festival._id,
				title: festival.name,
				image: festival.image,
				location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
				date: dateStr,
				rating: festival.avg_rating,
				reviewCount: festival.review_count,
				bookmarkCount: festival.bookmark_count,
				season: season || "all",
				city: festival.city
			};
		}));
	} catch (error) {
		res.status(500).json({ error: "축제 데이터 조회 실패" });
	}
});

app.get("/api/festivals/:festivalId", async (req, res) => {
	const { festivalId } = req.params;
	res.status(200).json({ festivalId, name: "상세 축제 이름", description: "..." });
});

app.get("/api/festivals/:festivalId/reviews", async (req, res) => {
	const { festivalId } = req.params;
	res.status(200).json([{ reviewId: 1, content: "멋진 축제", festivalId }]);
});

app.post("/api/festivals/:festivalId/reviews", async (req, res) => {
	const { festivalId } = req.params;
	const { rating, content } = req.body;
	res.status(201).json({ message: "리뷰 작성 완료", festivalId, rating, content });
});

// ------------------------------------------------------------------
// Search
// ------------------------------------------------------------------
// 축제 검색
app.get("/api/search", async (req, res) => {
	const { q, prefecture, startDate, endDate, type } = req.query;

	if (!q || q.trim().length === 0) {
		return res.status(400).json({ error: "검색어를 입력해주세요" });
	}

	console.log("검색 파라미터:", { q, prefecture, startDate, endDate, type });

	const filter = {};

	// 텍스트 검색 (이름, 위치, 주소 등)
	const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	console.log("이스케이프된 쿼리:", escapedQuery);
	
	const searchRegex = { $regex: escapedQuery, $options: 'i' };
	console.log("정규식 객체:", searchRegex);
	
	filter.$or = [
		{ name: searchRegex },
		{ location: searchRegex },
		{ state: searchRegex },
		{ city: searchRegex },
		{ address: searchRegex },
		{ type: searchRegex }
	];

	// 지역 필터 (state 필드와 정확히 매칭)
	// 일본어 행정구역: ~부 (부산부, 오사카부) 또는 ~현 (교토현, 기후현) 또는 ~도 (도쿄도)
	if (prefecture) {
		filter.state = prefecture;  // 사용자가 입력한 값 그대로 사용
	}

	// 날짜 범위 필터
	if (startDate && endDate) {
		const parsedStart = new Date(startDate);
		const parsedEnd = new Date(endDate);
		if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
			filter.start_date = { $lte: parsedEnd };
			filter.end_date = { $gte: parsedStart };
		}
	}

	// 축제 타입 필터
	if (type) {
		filter.type = type;
	}

	console.log("필터 조건:", JSON.stringify(filter, null, 2));

	try {
		const results = await Festival.find(filter).sort({ bookmark_count: -1 }).limit(20).lean();
		console.log("검색 결과 개수:", results.length);
		
		res.status(200).json(results.map((festival) => {
			const startDate = new Date(festival.start_date);
			const endDate = new Date(festival.end_date);
			const year = startDate.getFullYear();
			const startMonth = startDate.getMonth() + 1;
			const startDay = startDate.getDate();
			const endMonth = endDate.getMonth() + 1;
			const endDay = endDate.getDate();

			let dateStr;
			if (startMonth === endMonth) {
				dateStr = `${year}년 ${startMonth}월 ${startDay}일~${endDay}일`;
			} else {
				dateStr = `${year}년 ${startMonth}월 ${startDay}일~${endMonth}월 ${endDay}일`;
			}

			return {
				id: festival._id,
				title: festival.name,
				image: festival.image,
				location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
				date: dateStr,
				rating: festival.avg_rating,
				reviewCount: festival.review_count,
				bookmarkCount: festival.bookmark_count
			};
		}));
	} catch (error) {
		console.error("검색 에러:", error);
		res.status(500).json({ error: "검색 실패" });
	}
});

// 최근 검색어 조회 (로그인 사용자만 DB 조회, 비로그인 사용자는 빈 배열)
app.get("/api/search/history", async (req, res) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.access_token;
		
		if (!token) {
			// 비로그인 사용자: 빈 배열 반환
			return res.status(200).json([]);
		}

		try {
			const payload = jwt.verify(token, JWT_ACCESS_SECRET);
			const history = await SearchHistory.find({ user_id: payload.sub })
				.sort({ searched_at: -1 })
				.limit(8)
				.lean();
			
			res.status(200).json(history.map((item) => item.query));
		} catch (error) {
			// 토큰 검증 실패: 빈 배열 반환
			res.status(200).json([]);
		}
	} catch (error) {
		res.status(500).json({ error: "검색 기록 조회 실패" });
	}
});

// 최근 검색어 저장 (로그인 사용자만 서버에 저장)
app.post("/api/search/history", async (req, res) => {
	const { query } = req.body;

	if (!query || query.trim().length === 0) {
		return res.status(400).json({ error: "검색어를 입력해주세요" });
	}

	try {
		const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.access_token;
		
		if (!token) {
			// 비로그인 사용자: 성공 응답만 (프론트에서 localStorage 처리)
			return res.status(201).json({ message: "검색 기록 저장됨 (로컬)" });
		}

		try {
			const payload = jwt.verify(token, JWT_ACCESS_SECRET);
			
			// 중복 제거: 같은 검색어가 있으면 삭제
			await SearchHistory.deleteMany({ user_id: payload.sub, query: query.trim() });
			
			// 새로 추가
			await SearchHistory.create({
				user_id: payload.sub,
				query: query.trim()
			});

			res.status(201).json({ message: "검색 기록 저장 완료" });
		} catch (error) {
			// 토큰 검증 실패: 성공 응답 (프론트에서 localStorage 처리)
			res.status(201).json({ message: "검색 기록 저장됨 (로컬)" });
		}
	} catch (error) {
		res.status(500).json({ error: "검색 기록 저장 실패" });
	}
});

// 인기 축제 (북마크 많은 순)
app.get("/api/search/popular", async (req, res) => {
	try {
		const popular = await Festival.find({ longitude: { $exists: true }, latitude: { $exists: true } })
			.sort({ bookmark_count: -1 })
			.limit(3)
			.lean();

		res.status(200).json(popular.map((festival) => {
			const startDate = new Date(festival.start_date);
			const endDate = new Date(festival.end_date);
			const year = startDate.getFullYear();
			const startMonth = startDate.getMonth() + 1;
			const startDay = startDate.getDate();
			const endMonth = endDate.getMonth() + 1;
			const endDay = endDate.getDate();

			let dateStr;
			if (startMonth === endMonth) {
				dateStr = `${year}년 ${startMonth}월`;
			} else {
				dateStr = `${year}년 ${startMonth}월~${endMonth}월`;
			}

			return {
				id: festival._id,
				title: festival.name,
				image: festival.image,
				location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
				date: dateStr,
				rating: festival.avg_rating,
				reviewCount: festival.review_count,
				bookmarkCount: festival.bookmark_count
			};
		}));
	} catch (error) {
		res.status(500).json({ error: "인기 축제 조회 실패" });
	}
});

// ------------------------------------------------------------------
// Home Data
// ------------------------------------------------------------------
app.get("/api/home/banners", async (req, res) => {
	const banners = await BannerSlide.find().sort({ slide_id: 1 }).lean();
	res.status(200).json(banners.map((slide) => ({
		id: slide.slide_id,
		image: slide.image,
		title: slide.title,
		subtitle: slide.subtitle
	})));
});

app.get("/api/home/categories", async (req, res) => {
	const categories = await Category.find().sort({ category_id: 1 }).lean();
	res.status(200).json(categories.map((category) => ({
		id: category.category_id,
		label: category.label,
		icon: category.icon
	})));
});

app.get("/api/home/cities", async (req, res) => {
	const cities = await City.find().sort({ city_id: 1 }).lean();
	res.status(200).json(cities.map((city) => ({
		id: city.city_id,
		label: city.label,
		image: city.image
	})));
});

app.get("/api/home/festivals", async (req, res) => {
	const festivals = await Festival.find().sort({ created_at: -1 }).limit(20).lean();
	res.status(200).json(festivals.map((festival) => ({
		id: festival._id,
		image: festival.image,
		title: festival.name,
		location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
		startDate: festival.start_date,
		endDate: festival.end_date,
		rating: festival.avg_rating,
		reviewCount: festival.review_count,
		bookmarkCount: festival.bookmark_count
	})));
});

// ------------------------------------------------------------------
// Map Data
// ------------------------------------------------------------------
app.get("/api/map/filters", async (req, res) => {
	const filters = await MapFilter.find().sort({ filter_id: 1 }).lean();
	res.status(200).json(filters.map((filter) => ({
		id: filter.filter_id,
		label: filter.label,
		icon: filter.icon,
		active: filter.active
	})));
});

app.get("/api/map/markers", async (req, res) => {
	const { prefecture, date, startDate, endDate, type } = req.query;
	const filter = { longitude: { $exists: true }, latitude: { $exists: true } };

	if (prefecture) {
		filter.state = prefecture;
	}

	// 날짜 범위 필터 (startDate, endDate 우선)
	if (startDate && endDate) {
		const parsedStart = new Date(startDate);
		const parsedEnd = new Date(endDate);
		if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
			return res.status(400).json({ error: "startDate and endDate must be valid ISO dates" });
		}
		// 축제 기간이 검색 범위와 겹치는 경우 (AND 조건)
		filter.start_date = { $lte: parsedEnd };
		filter.end_date = { $gte: parsedStart };
	} else if (date) {
		// 단일 날짜 (해당 날짜에 진행 중인 축제)
		const parsedDate = new Date(date);
		if (Number.isNaN(parsedDate.getTime())) {
			return res.status(400).json({ error: "date must be a valid ISO date (YYYY-MM-DD)" });
		}
		filter.start_date = { $lte: parsedDate };
		filter.end_date = { $gte: parsedDate };
	}

	if (type) {
		filter.type = type;
	}

	try {
		const markers = await Festival.find(filter).lean();
		res.status(200).json(markers.map((marker) => ({
			id: marker._id,
			name: marker.name,
			startDate: marker.start_date,
			endDate: marker.end_date,
			location: marker.location || `${marker.state || ""} ${marker.city || ""}`.trim(),
			lon: marker.longitude,
			lat: marker.latitude
		})));
	} catch (error) {
		res.status(500).json({ error: "마커 데이터 조회 실패" });
	}
});

// ------------------------------------------------------------------
// Lists
// ------------------------------------------------------------------
app.get("/api/lists", authenticateToken, async (req, res) => {
	res.status(200).json([{ listId: 1, title: "나의 일본 여행" }]);
});

app.post("/api/lists", authenticateToken, async (req, res) => {
	const { title, background, isPublic } = req.body;
	res.status(201).json({ message: "리스트 생성 완료", title, background, isPublic });
});

app.put("/api/lists/:listId", authenticateToken, async (req, res) => {
	const { listId } = req.params;
	res.status(200).json({ message: "리스트 수정 완료", listId });
});

app.post("/api/lists/:listId/items", authenticateToken, async (req, res) => {
	const { listId } = req.params;
	const { festivalId } = req.body;
	res.status(201).json({ message: "축제 추가 완료", listId, festivalId });
});

app.delete("/api/lists/:listId/items/:festivalId", authenticateToken, async (req, res) => {
	const { listId, festivalId } = req.params;
	res.status(204).send();
});

app.post("/api/lists/:listId/collaborators", authenticateToken, async (req, res) => {
	const { listId } = req.params;
	const { email } = req.body;
	res.status(200).json({ message: "공동작업자 추가 완료", listId, email });
});

// ------------------------------------------------------------------
// 404 Handler
// ------------------------------------------------------------------
app.use((req, res) => {
	res.status(404).json({ message: "Not Found" });
});

const startServer = async () => {
	try {
		if (!MONGO_URI) {
			throw new Error("MONGO_URI is not set");
		}

		await mongoose.connect(MONGO_URI);
		console.log("MongoDB connected");

		await Festival.updateMany(
			{ date_label: { $exists: true } },
			{ $unset: { date_label: "" } }
		);

		// ------------------------------------------------------------------
		// Seed data (runs only if collections are empty)
		// ------------------------------------------------------------------
		const userCount = await User.countDocuments();
		const festivalCount = await Festival.countDocuments();
		const reviewCount = await Review.countDocuments();
		const bannerCount = await BannerSlide.countDocuments();
		const categoryCount = await Category.countDocuments();
		const cityCount = await City.countDocuments();
		const mapFilterCount = await MapFilter.countDocuments();

		if (userCount === 0) {
			await User.create({
				google_id: "demo-google-id",
				nickname: "축제매니아",
				profile_img: "https://example.com/profile.png",
				preference_tags: ["여름축제", "오사카"]
			});
		}

		if (festivalCount === 0) {
			await Festival.insertMany(festivals);
		} else {
			await Festival.bulkWrite(
				festivals.map((festival) => ({
					updateOne: {
						filter: { name: festival.name },
						update: { $set: festival },
						upsert: true
					}
				}))
			);
		}

		if (bannerCount === 0) {
			await BannerSlide.insertMany(bannerSlides);
		} else {
			await BannerSlide.bulkWrite(
				bannerSlides.map((slide) => ({
					updateOne: {
						filter: { slide_id: slide.slide_id },
						update: { $set: slide },
						upsert: true
					}
				}))
			);
		}

		if (categoryCount === 0) {
			await Category.insertMany(categories);
		} else {
			await Category.bulkWrite(
				categories.map((category) => ({
					updateOne: {
						filter: { category_id: category.category_id },
						update: { $set: category },
						upsert: true
					}
				}))
			);
		}

		if (cityCount === 0) {
			await City.insertMany(cities);
		} else {
			await City.bulkWrite(
				cities.map((city) => ({
					updateOne: {
						filter: { city_id: city.city_id },
						update: { $set: city },
						upsert: true
					}
				}))
			);
		}

		if (mapFilterCount === 0) {
			await MapFilter.insertMany(mapFilters);
		} else {
			await MapFilter.bulkWrite(
				mapFilters.map((filter) => ({
					updateOne: {
						filter: { filter_id: filter.filter_id },
						update: { $set: filter },
						upsert: true
					}
				}))
			);
		}

		// festivalMarkers를 Festival 컬렉션에 추가 (longitude, latitude 필드로 구분)
		await Festival.bulkWrite(
			festivalMarkers.map((marker) => ({
				updateOne: {
					filter: { name: marker.name, longitude: marker.longitude, latitude: marker.latitude },
					update: { $set: marker },
					upsert: true
				}
			}))
		);

		if (reviewCount === 0) {
			const user = await User.findOne();
			const festival = await Festival.findOne();

			if (user && festival) {
				await Review.create({
					user_id: user._id,
					festival_id: festival._id,
					rating: 5,
					content: "정말 최고의 축제였어요!"
				});
			}
		}

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();
