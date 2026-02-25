const mongoose = require("mongoose");
require("dotenv").config();

const { User, Festival, Review } = require("../models");

const sampleImages = [
	"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
	"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400",
	"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
	"https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400",
	"https://images.unsplash.com/photo-1526481280693-3bfa7568e0f8?w=400",
	"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
	"https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400",
	"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400",
	"https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400",
	"https://images.unsplash.com/photo-1551641506-ee5bf4cb45f1?w=400",
	"https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400",
	"https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400",
	"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
	"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
	"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400"
];

const reviewTemplates = [
	{
		rating: 5,
		content: "볼거리도 많고 밤에 진행되는 퍼레이드가 특히 인상적이었어요.\n아이와 어른이 함께 즐길 수 있어서 가족 여행 코스로 추천해요.",
		tags: ["전통 행사를 볼 수 있어요", "가족 여행하기 좋아요", "노점이 많아요"],
		hasImages: true
	},
	{
		rating: 4,
		content: "축제 분위기가 정말 좋았어요! 먹거리도 다양하고 현지 문화를 체험할 수 있어서 만족스러웠습니다.",
		tags: ["먹거리가 다양해요", "사진찍기 좋아요", "교통이 편리해요"],
		hasImages: true
	},
	{
		rating: 5,
		content: "매년 가는 축제인데 항상 새롭고 즐거워요. 특히 전통 공연이 인상 깊었습니다.",
		tags: ["전통 행사를 볼 수 있어요", "공연이 훌륭해요", "분위기가 좋아요"],
		hasImages: false
	},
	{
		rating: 4,
		content: "친구들과 함께 갔는데 모두 만족했어요. 다만 사람이 많아서 조금 붐볐습니다.",
		tags: ["친구와 가기 좋아요", "활기차요", "사람이 많아요"],
		hasImages: true
	},
	{
		rating: 5,
		content: "정말 환상적인 경험이었어요! 일본 문화를 제대로 느낄 수 있었고, 사진도 예쁘게 나왔습니다.",
		tags: ["사진찍기 좋아요", "문화 체험이 좋아요", "분위기가 좋아요"],
		hasImages: true
	},
	{
		rating: 3,
		content: "나쁘지 않았지만 기대보다는 조금 아쉬웠어요. 그래도 한 번쯤 가볼 만해요.",
		tags: ["소규모예요", "조용해요"],
		hasImages: false
	},
	{
		rating: 4,
		content: "연인과 함께 갔는데 로맨틱한 분위기가 좋았어요. 저녁에 가면 더 예쁩니다.",
		tags: ["데이트하기 좋아요", "야경이 아름다워요", "사진찍기 좋아요"],
		hasImages: true
	},
	{
		rating: 5,
		content: "현지 음식을 맛볼 수 있는 노점이 정말 많아요. 배불리 먹고 즐겁게 놀았습니다!",
		tags: ["먹거리가 다양해요", "노점이 많아요", "가성비 좋아요"],
		hasImages: true
	}
];

async function seedReviews() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공");

		// 기존 리뷰 삭제
		await Review.deleteMany({});
		console.log("기존 리뷰 삭제 완료");

		// 사용자 및 축제 조회
		let users = await User.find().limit(10);
		const festivals = await Festival.find();

		// 사용자가 없으면 테스트 사용자 생성
		if (users.length === 0) {
			console.log("사용자가 없어 테스트 사용자를 생성합니다...");
			const testUsers = [
				{ nickname: "홍길동", name: "홍길동" },
				{ nickname: "김철수", name: "김철수" },
				{ nickname: "이영희", name: "이영희" },
				{ nickname: "박민수", name: "박민수" },
				{ nickname: "최지은", name: "최지은" }
			];
			users = await User.insertMany(testUsers);
			console.log(`${users.length}명의 테스트 사용자 생성 완료`);
		}

		if (festivals.length === 0) {
			console.log("축제가 없습니다. 먼저 축제 데이터를 삽입해주세요.");
			return;
		}

		const reviews = [];

		// 각 축제마다 2-5개의 리뷰 생성
		for (const festival of festivals) {
			const reviewCount = Math.floor(Math.random() * 4) + 2; // 2-5개

			for (let i = 0; i < reviewCount; i++) {
				const randomUser = users[Math.floor(Math.random() * users.length)];
				const randomTemplate = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];

				// 50% 확률로 사진 추가 (hasImages가 true이고 랜덤 확률)
				const images = [];
				if (randomTemplate.hasImages && Math.random() > 0.4) {
					const imageCount = Math.floor(Math.random() * 3) + 1; // 1-3개 사진
					for (let j = 0; j < imageCount; j++) {
						const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
						images.push(randomImage);
					}
				}

				reviews.push({
					user_id: randomUser._id,
					festival_id: festival._id,
					rating: randomTemplate.rating,
					content: randomTemplate.content,
					tags: randomTemplate.tags,
					images: images
				});
			}
		}

		// 리뷰 삽입
		await Review.insertMany(reviews);
		console.log(`${reviews.length}개의 리뷰 삽입 완료`);

		// 각 축제의 평균 평점 업데이트
		console.log(`${festivals.length}개 축제의 평균 평점 업데이트 중...`);
		let updateCount = 0;
		for (const festival of festivals) {
			try {
				const festivalReviews = await Review.find({ festival_id: festival._id });
				const avgRating = festivalReviews.length > 0
					? festivalReviews.reduce((sum, r) => sum + r.rating, 0) / festivalReviews.length
					: 0;

				await Festival.findByIdAndUpdate(festival._id, {
					avg_rating: Math.round(avgRating * 10) / 10
				});
				updateCount++;
				if (updateCount % 10 === 0) {
					console.log(`${updateCount}개 축제 업데이트 완료...`);
				}
			} catch (err) {
				console.error(`축제 ${festival._id} 업데이트 실패:`, err.message);
			}
		}

		console.log(`총 ${updateCount}개 축제 평균 평점 업데이트 완료`);

		await mongoose.connection.close();
		console.log("작업 완료");
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

seedReviews();
