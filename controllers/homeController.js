const { BannerSlide, Category, City, Festival } = require("../models");

// 배너 조회
exports.getBanners = async (req, res) => {
	const banners = await BannerSlide.find().sort({ slide_id: 1 }).lean();
	res.status(200).json(banners.map((slide) => ({
		id: slide.slide_id,
		image: slide.image,
		title: slide.title,
		subtitle: slide.subtitle
	})));
};

// 카테고리 조회
exports.getCategories = async (req, res) => {
	const categories = await Category.find().sort({ category_id: 1 }).lean();
	res.status(200).json(categories.map((category) => ({
		id: category.category_id,
		label: category.label,
		icon: category.icon
	})));
};

// 도시 조회
exports.getCities = async (req, res) => {
	const cities = await City.find().sort({ city_id: 1 }).lean();
	res.status(200).json(cities.map((city) => ({
		id: city.city_id,
		label: city.label,
		image: city.image
	})));
};

// 축제 조회 (최적화: 미리 계산된 review_count, avg_rating 사용)
exports.getFestivals = async (req, res) => {
	try {
		const festivals = await Festival.find()
			.sort({ bookmark_count: -1 })
			.limit(20)
			.select('_id name image state city start_date end_date bookmark_count review_count avg_rating')
			.lean();

		const festivalsData = festivals.map(festival => {
			const location = [festival.state, festival.city]
				.filter(Boolean)
				.join(' ')
				.trim();
			
			return {
				id: festival._id,
				image: festival.image,
				title: festival.name,
				location: location || '',
				startDate: festival.start_date,
				endDate: festival.end_date,
				rating: festival.avg_rating || 0,
				reviewCount: festival.review_count || 0,
				bookmarkCount: festival.bookmark_count || 0
			};
		});

		res.status(200).json(festivalsData);
	} catch (error) {
		console.error("Error fetching festivals:", error);
		res.status(500).json({ message: "축제 데이터를 불러오는데 실패했습니다." });
	}
};

module.exports = exports;
