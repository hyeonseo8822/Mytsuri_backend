const mongoose = require("mongoose");
require("dotenv").config();

const { Festival, Review } = require("./models");

const updateFestivalStats = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결됨");

		const festivals = await Festival.find().lean();
		console.log(`총 ${festivals.length}개 축제 업데이트 시작...`);

		const updates = [];
		for (const festival of festivals) {
			const reviews = await Review.find({ festival_id: festival._id }).lean();
			const reviewCount = reviews.length;
			const avgRating = reviewCount > 0
				? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
				: 0;

			updates.push({
				updateOne: {
					filter: { _id: festival._id },
					update: {
						$set: {
							review_count: reviewCount,
							avg_rating: avgRating
						}
					}
				}
			});

			if (updates.length % 50 === 0) {
				console.log(`${updates.length}/${festivals.length} 처리 중...`);
			}
		}

		if (updates.length > 0) {
			const result = await Festival.bulkWrite(updates);
			console.log(`✅ ${result.modifiedCount}개 축제 통계 업데이트 완료`);
		}

		await mongoose.connection.close();
		console.log("MongoDB 연결 종료");
		process.exit(0);
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
};

updateFestivalStats();
