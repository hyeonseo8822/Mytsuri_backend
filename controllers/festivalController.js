const { Festival } = require("../models");

// 추천 축제
exports.getRecommended = async (req, res) => {
	res.status(200).json([{ festivalId: 1, name: "추천 축제" }]);
};

// 인기 급상승 축제
exports.getTrending = async (req, res) => {
	res.status(200).json([{ festivalId: 2, name: "인기 급상승 축제" }]);
};

// 리뷰 많은 축제
exports.getPopular = async (req, res) => {
	res.status(200).json([{ festivalId: 3, name: "리뷰 많은 축제" }]);
};

// 지도 데이터 축제
exports.getMapFestivals = async (req, res) => {
	const { lat, lng, radius, region, month, type } = req.query;
	res.status(200).json([
		{ festivalId: 4, name: "도쿄 여름축제", lat: 35.6895, lng: 139.6917, category: "여름축제", query: { lat, lng, radius, region, month, type } }
	]);
};

// 축제 리스트 조회 (시즌, 도시 필터)
exports.getFestivals = async (req, res) => {
	const { season, city } = req.query;
	const filter = {};

	const seasonMap = {
		summer: "여름축제",
		winter: "겨울축제",
		spring: "봄축제",
		autumn: "가을축제",
		food: "먹거리축제",
		local: "특산물축제"
	};

	const cityMap = {
		kyoto: "교토",
		osaka: "오사카",
		nagoya: "나고야",
		tokyo: "도쿄",
		fukuoka: "후쿠오카"
	};

	if (season && seasonMap[season]) {
		filter.type = seasonMap[season];
	}

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
				viewCount: festival.view_count ?? festival.bookmark_count ?? 0,
				season: season || "all",
				city: festival.city
			};
		}));
	} catch (error) {
		res.status(500).json({ error: "축제 데이터 조회 실패" });
	}
};

// 축제 상세 정보
exports.getFestivalDetail = async (req, res) => {
	const { festivalId } = req.params;
	res.status(200).json({ festivalId, name: "상세 축제 이름", description: "..." });
};

// 축제별 리뷰 조회
exports.getFestivalReviews = async (req, res) => {
	const { festivalId } = req.params;
	res.status(200).json([{ reviewId: 1, content: "멋진 축제", festivalId }]);
};

// 축제 리뷰 작성
exports.createFestivalReview = async (req, res) => {
	const { festivalId } = req.params;
	const { rating, content } = req.body;
	res.status(201).json({ message: "리뷰 작성 완료", festivalId, rating, content });
};

module.exports = exports;
