const { Festival } = require("../models");

// 고정 선호도 데이터
const defaultPreferences = {
  atmosphere: ["festive", "artistic", "traditional"],
  importance: ["food", "performance", "photo"],
  crowding: "neutral",
  company: ["friends", "family"]
};

exports.getRecommendations = async (req, res) => {
  try {
    // 데이터베이스에서 모든 축제 조회
    const allFestivals = await Festival.find().limit(100).lean();
    
    if (!allFestivals || allFestivals.length === 0) {
      return res.json([]);
    }

    // Review 모델 가져오기
    const { Review } = require("../models");

    // 선호도 기반 스코어링
    const scoredFestivals = await Promise.all(allFestivals.map(async (festival) => {
      let score = 0;
      const festivalType = (festival.type || "").toLowerCase();

      // 각 축제의 평균 평점 실시간 계산
      const reviews = await Review.find({ festival_id: festival._id }).lean();
      const averageRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
        : 0;

      // 1. 선호하는 축제 타입 점수
      if (defaultPreferences.importance.includes("food")) {
        if (festivalType.includes("food") || festivalType.includes("먹거리") || festivalType.includes("음식")) {
          score += 40;
        }
      }
      
      if (defaultPreferences.importance.includes("performance")) {
        if ((festivalType.includes("축제") || festivalType.includes("공연")) && !festivalType.includes("food")) {
          score += 30;
        }
      }
      
      if (defaultPreferences.importance.includes("photo")) {
        score += averageRating * 5;
      }

      // 2. 인기도 점수
      const bookmarkScore = (festival.bookmark_count || 0) * 3;
      const ratingScore = averageRating * 20;

      score += bookmarkScore + ratingScore;

      return {
        ...festival,
        score,
        averageRating,
        location: festival.location || festival.city || "미상"
      };
    }));

    // 스코어 기준으로 정렬, 지역 다양성 고려하여 상위 5개 선택
    const uniqueLocations = new Set();
    const recommendedFestivals = scoredFestivals
      .sort((a, b) => b.score - a.score)
      .filter((festival) => {
        // 지역 다양성: 같은 지역이 2개 이상 나오지 않도록
        if (uniqueLocations.has(festival.location)) {
          return false;
        }
        uniqueLocations.add(festival.location);
        return true;
      })
      .slice(0, 5)
      .map((festival) => ({
        id: festival._id,
        title: festival.title || festival.name,
        image: festival.image,
        location: festival.location,
        rating: festival.averageRating,
        reviewCount: 0,
        bookmarkCount: festival.bookmark_count || 0,
        start_date: festival.start_date,
        end_date: festival.end_date,
        subtitle: festival.location || "추천 축제"
      }));

    res.json(recommendedFestivals);
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ error: "추천 생성 실패: " + error.message });
  }
};
