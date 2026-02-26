const mongoose = require("mongoose");
require("dotenv").config();

const { Festival } = require("../models");

// 북마크를 초기화할 축제 이름들
const festivalNamesToReset = [
	"기온 마쓰리(기원제)",        // 교토 기온 마츠리
	"네부타축제",                 // 아오모리 네부타
	"센다이타나바타축제",         // 센다이 다나바타
	"다카야마봄축제"              // 기후 타카야마 축제
];

async function fixBookmarks() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공");

		// 각 축제를 찾아 북마크 수를 0으로 설정
		for (const festivalName of festivalNamesToReset) {
			const result = await Festival.findOneAndUpdate(
				{ name: festivalName },
				{ bookmark_count: 0 },
				{ new: true }
			);

			if (result) {
				console.log(`✓ ${festivalName}: 북마크 수를 0으로 초기화 (이전 값: ${result.bookmark_count})`);
			} else {
				console.log(`✗ ${festivalName}: 축제를 찾을 수 없습니다.`);
			}
		}

		console.log("\n북마크 초기화 완료!");
		await mongoose.connection.close();
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

fixBookmarks();
