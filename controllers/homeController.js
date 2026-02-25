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

// 축제 조회 (최적화된 aggregation 사용)
exports.getFestivals = async (req, res) => {
	try {
		const festivalsWithReviews = await Festival.aggregate([
			{
				$sort: { bookmark_count: -1 }
			},
			{
				$limit: 20
			},
			{
				$lookup: {
					from: "reviews",
					localField: "_id",
					foreignField: "festival_id",
					as: "reviews"
				}
			},
			{
				$addFields: {
					reviewCount: { $size: "$reviews" },
					avgRating: {
						$cond: [
							{ $gt: [{ $size: "$reviews" }, 0] },
							{
								$round: [
									{
										$divide: [
											{ $sum: "$reviews.rating" },
											{ $size: "$reviews" }
										]
									},
									1
								]
							},
							0
						]
					}
				}
			},
			{
				$project: {
					_id: 0,
					id: "$_id",
					image: 1,
					title: "$name",
					location: {
						$ltrim: {
							input: {
								$concat: [
									{ $cond: [{ $eq: ["$state", null] }, "", "$state"] },
									" ",
									{ $cond: [{ $eq: ["$city", null] }, "", "$city"] }
								]
							},
							chars: " "
						}
					},
					startDate: "$start_date",
					endDate: "$end_date",
					rating: "$avgRating",
					reviewCount: 1,
					bookmarkCount: "$bookmark_count"
				}
			}
		]);

		res.status(200).json(festivalsWithReviews);
	} catch (error) {
		console.error("Error fetching festivals:", error);
		res.status(500).json({ message: "축제 데이터를 불러오는데 실패했습니다." });
	}
};

module.exports = exports;
