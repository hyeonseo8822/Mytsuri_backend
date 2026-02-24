const jwt = require("jsonwebtoken");
const { Festival, SearchHistory } = require("../models");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// 축제 검색
exports.search = async (req, res) => {
	const { q, prefecture, startDate, endDate, type } = req.query;

	if (!q || q.trim().length === 0) {
		return res.status(400).json({ error: "검색어를 입력해주세요" });
	}

	const filter = {};

	// 정규식 특수문자 이스케이프
	const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const searchRegex = { $regex: escapedQuery, $options: 'i' };

	filter.$or = [
		{ name: searchRegex },
		{ location: searchRegex },
		{ state: searchRegex },
		{ city: searchRegex },
		{ address: searchRegex },
		{ type: searchRegex }
	];

	// 지역 필터
	if (prefecture) {
		filter.state = prefecture;
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

	try {
		const results = await Festival.find(filter).sort({ bookmark_count: -1 }).limit(20).lean();

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
		res.status(500).json({ error: "검색 실패" });
	}
};

// 최근 검색어 조회
exports.getSearchHistory = async (req, res) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.access_token;

		if (!token) {
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
			res.status(200).json([]);
		}
	} catch (error) {
		res.status(500).json({ error: "검색 기록 조회 실패" });
	}
};

// 최근 검색어 저장
exports.saveSearchHistory = async (req, res) => {
	const { query } = req.body;

	if (!query || query.trim().length === 0) {
		return res.status(400).json({ error: "검색어를 입력해주세요" });
	}

	try {
		const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.access_token;

		if (!token) {
			return res.status(201).json({ message: "검색 기록 저장됨 (로컬)" });
		}

		try {
			const payload = jwt.verify(token, JWT_ACCESS_SECRET);

			// 중복 제거
			await SearchHistory.deleteMany({ user_id: payload.sub, query: query.trim() });

			// 새로 추가
			await SearchHistory.create({
				user_id: payload.sub,
				query: query.trim()
			});

			res.status(201).json({ message: "검색 기록 저장 완료" });
		} catch (error) {
			res.status(201).json({ message: "검색 기록 저장됨 (로컬)" });
		}
	} catch (error) {
		res.status(500).json({ error: "검색 기록 저장 실패" });
	}
};

// 인기 축제 조회
exports.getPopularFestivals = async (req, res) => {
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
};

module.exports = exports;
