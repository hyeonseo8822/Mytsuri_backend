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
	const { season, city, section } = req.query;
	const filter = {};

	const seasonMap = {
		summer: "여름",
		winter: "겨울",
		spring: "봄",
		autumn: "가을",
		food: "먹거리",
		local: "특산물"
	};

	const cityMap = {
		kyoto: "교토시",
		osaka: "오사카시",
		nagoya: "나고야시",
		tokyo: ["도쿄", "도쿄도"],
		fukuoka: "후쿠오카시"
	};

	if (season && seasonMap[season]) {
		filter.type = seasonMap[season];
	}

	if (city && cityMap[city]) {
		// 도쿄는 배열이므로 $in 사용
		if (Array.isArray(cityMap[city])) {
			filter.city = { $in: cityMap[city] };
		} else {
			filter.city = cityMap[city];
		}
	}

	try {
		const festivals = await Festival.find(filter).sort({ created_at: -1 }).lean();
		
		// Review 모델 가져오기
		const { Review } = require("../models");
		
		const festivalsWithReviews = await Promise.all(festivals.map(async (festival) => {
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

			// 각 축제의 리뷰 수 실시간 계산
			const reviews = await Review.find({ festival_id: festival._id }).lean();
			const reviewCount = reviews.length;
			const averageRating = reviews.length > 0
				? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
				: 0;

			return {
				id: festival._id,
				title: festival.name,
				image: festival.image,
				location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
				date: dateStr,
				reviewCount: reviewCount,
				bookmarkCount: festival.bookmark_count,
				viewCount: festival.view_count ?? festival.bookmark_count ?? 0,
				season: season || "all",
				city: festival.city,
				rating: averageRating,
				start_date: festival.start_date,
				end_date: festival.end_date
			};
		}));

		res.status(200).json(festivalsWithReviews);
	} catch (error) {
		console.error("Festival fetch error:", error);
		res.status(500).json({ error: "축제 데이터 조회 실패" });
	}
};

// 축제 상세 정보
exports.getFestivalDetail = async (req, res) => {
	const { festivalId } = req.params;
	try {
		const festival = await Festival.findById(festivalId).lean();
		
		if (!festival) {
			return res.status(404).json({ error: "축제를 찾을 수 없습니다." });
		}

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

		// 예시 데이터 생성
		const festivalType = festival.type || "축제";
		const city = festival.city || "일본";
		
		// 소개 예시
		const descriptionExample = festival.description || `${festival.name}은(는) ${city}에서 개최되는 ${festivalType} 축제입니다. 전통과 현대가 어우러진 다채로운 볼거리와 먹거리가 가득하며, 가족과 친구들과 함께 특별한 추억을 만들 수 있습니다. 현지 문화를 체험하고 다양한 공연과 이벤트를 즐겨보세요.`;
		
		// 시간 예시
		const timeExample = festival.time || "09:00 - 22:00";
		
		// 활동 예시
		const activitiesExample = festival.activities && festival.activities.length > 0 
			? festival.activities 
			: [
				{
					title: "전통 공연 관람",
					subtitle: "현지 전통 음악과 춤 공연",
					image: festival.image || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400"
				},
				{
					title: "먹거리 체험",
					subtitle: "지역 특산물과 축제 음식 즐기기",
					image: festival.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400"
				},
				{
					title: "포토존 & 기념품",
					subtitle: "추억을 남기고 특별한 기념품 구매",
					image: festival.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400"
				}
			];
		
		// 해시태그 예시
		const hashtagsExample = festival.hashtags && festival.hashtags.length > 0
			? festival.hashtags
			: [`#${festivalType}`, `#${city}여행`, `#일본축제`];

		// 리뷰에서 사진 수집 및 리뷰 수 카운트
		const { Review } = require("../models");
		const reviews = await Review.find({ festival_id: festivalId }).lean();
		const reviewPhotos = [];
		reviews.forEach(review => {
			if (review.images && review.images.length > 0) {
				reviewPhotos.push(...review.images);
			}
		});
		const reviewCount = reviews.length;

		// 리뷰의 평균 평점 실시간 계산
		const averageRating = reviews.length > 0
			? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
			: 0;

		res.status(200).json({
			id: festival._id,
			title: festival.name,
			subtitle: festival.subtitle || festival.type || "축제",
			image: festival.image,
			images: [festival.image],
			location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
			lat: festival.latitude || 0,
			lng: festival.longitude || 0,
			date: dateStr,
			time: timeExample,
			rating: averageRating,
			reviewCount: reviewCount,
			bookmarkCount: festival.bookmark_count || 0,
			description: descriptionExample,
			hashtags: hashtagsExample,
			activities: activitiesExample,
			homepage: festival.homepage || "#",
			photos: reviewPhotos
		});
	} catch (error) {
		console.error("Festival detail error:", error);
		res.status(500).json({ error: "축제 상세 정보 조회 실패" });
	}
};

// 축제별 리뷰 조회
exports.getFestivalReviews = async (req, res) => {
	const { festivalId } = req.params;
	try {
		const { Review, User } = require("../models");
		const reviews = await Review.find({ festival_id: festivalId })
			.populate('user_id', 'nickname')
			.sort({ created_at: -1 })
			.lean();
		
		const formattedReviews = reviews.map(review => {
			const createdDate = new Date(review.created_at);
			const dateStr = `${createdDate.getFullYear()}.${String(createdDate.getMonth() + 1).padStart(2, '0')}.${String(createdDate.getDate()).padStart(2, '0')}`;
			
			return {
				id: review._id,
				userName: review.user_id?.nickname || '익명',
				rating: review.rating,
				date: dateStr,
				tags: review.tags || [],
				body: review.content,
				images: review.images || []
			};
		});
		
		res.status(200).json(formattedReviews);
	} catch (error) {
		console.error('Get festival reviews error:', error);
		res.status(500).json({ error: "리뷰 조회 실패" });
	}
};

// 축제 리뷰 작성
exports.createFestivalReview = async (req, res) => {
	const { festivalId } = req.params;
	const { rating, content } = req.body;
	res.status(201).json({ message: "리뷰 작성 완료", festivalId, rating, content });
};

module.exports = exports;
