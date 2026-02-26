const mongoose = require("mongoose");
require("dotenv").config();

const { Festival, Review } = require("../models");

async function checkFestivalStats() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공\n");

		const festivalNames = [
			"기온 마쓰리(기원제)",
			"네부타축제",
			"센다이타나바타축제",
			"다카야마봄축제"
		];

		console.log("=== 네 축제의 상세 정보 ===\n");

		for (const name of festivalNames) {
			const festival = await Festival.findOne({ name });
			
			if (festival) {
				const reviews = await Review.find({ festival_id: festival._id });
				const avgRating = reviews.length > 0
					? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
					: 0;

				console.log(`축제명: ${name}`);
				console.log(`  - 북마크 수: ${festival.bookmark_count}`);
				console.log(`  - 조회 수: ${festival.view_count}`);
				console.log(`  - 리뷰 수: ${reviews.length}`);
				console.log(`  - 평균 평점: ${avgRating}`);
				console.log(`  - DB ID: ${festival._id}`);
				console.log("");
			}
		}

		await mongoose.connection.close();
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

checkFestivalStats();
