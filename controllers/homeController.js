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

// 축제 조회
exports.getFestivals = async (req, res) => {
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
};

module.exports = exports;
