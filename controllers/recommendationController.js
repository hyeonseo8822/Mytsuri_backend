const { Festival, Review, User } = require("../models");

// 설문 답변을 선호도로 매핑
const mapSurveyToPreferences = (survey) => {
  const preferences = {
    atmosphere: [],
    importance: [],
    crowding: "neutral",
    company: []
  };

  if (!survey || !Array.isArray(survey)) {
    return preferences;
  }

  survey.forEach((item) => {
    const question = item.question || "";
    const answer = item.answer || "";

    // Q1: 축제 분위기
    if (question.includes("분위기")) {
      if (answer.includes("조용")) preferences.atmosphere.push("quiet");
      if (answer.includes("활기")) preferences.atmosphere.push("lively");
      if (answer.includes("감성")) preferences.atmosphere.push("artistic");
      if (answer.includes("체험")) preferences.atmosphere.push("participatory");
    }

    // Q2: 중요한 것
    if (question.includes("중요")) {
      if (answer.includes("볼거리") || answer.includes("공연")) preferences.importance.push("performance");
      if (answer.includes("먹거리") || answer.includes("음식")) preferences.importance.push("food");
      if (answer.includes("사진")) preferences.importance.push("photo");
      if (answer.includes("체험")) preferences.importance.push("experience");
    }

    // Q3: 사람 많은 축제
    if (question.includes("사람")) {
      if (answer.includes("좋아")) preferences.crowding = "crowded";
      if (answer.includes("괜찮")) preferences.crowding = "neutral";
      if (answer.includes("피하")) preferences.crowding = "prefer_quiet";
    }

    // Q4: 함께 가는 사람
    if (question.includes("누구")) {
      if (answer.includes("혼자")) preferences.company.push("solo");
      if (answer.includes("친구")) preferences.company.push("friends");
      if (answer.includes("연인")) preferences.company.push("couple");
      if (answer.includes("가족")) preferences.company.push("family");
    }
  });

  // 기본값 설정 (답변이 없으면)
  if (preferences.atmosphere.length === 0) preferences.atmosphere = ["lively", "artistic"];
  if (preferences.importance.length === 0) preferences.importance = ["performance", "food"];
  if (preferences.company.length === 0) preferences.company = ["friends", "family"];

  return preferences;
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.sub;

    // 사용자의 설문 데이터 가져오기
    let userPreferences = {
      atmosphere: ["lively", "artistic"],
      importance: ["performance", "food"],
      crowding: "neutral",
      company: ["friends", "family"]
    };

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user && user.survey && Array.isArray(user.survey)) {
        userPreferences = mapSurveyToPreferences(user.survey);
      }
    }

    // 데이터베이스에서 모든 축제 조회
    const allFestivals = await Festival.find().limit(100).lean();

    if (!allFestivals || allFestivals.length === 0) {
      return res.json([]);
    }

    // 모든 축제의 리뷰 데이터를 한 번에 조회
    const allReviews = await Review.find().lean();
    const reviewsByFestivalId = {};
    allReviews.forEach((review) => {
      const festivalId = review.festival_id?.toString() || review.festival_id;
      if (!reviewsByFestivalId[festivalId]) {
        reviewsByFestivalId[festivalId] = [];
      }
      reviewsByFestivalId[festivalId].push(review);
    });

    // 선호도 기반 스코어링
    const scoredFestivals = allFestivals.map((festival) => {
      let score = 0;
      const festivalType = (festival.type || "").toLowerCase();
      const festivalId = festival._id?.toString();

      // 각 축제의 평균 평점 계산
      const reviews = reviewsByFestivalId[festivalId] || [];
      const averageRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length) * 10) / 10
        : 0;

      // 1. 선호하는 중요 요소 점수
      userPreferences.importance.forEach((imp) => {
        if (imp === "food" && (festivalType.includes("food") || festivalType.includes("먹거리") || festivalType.includes("음식"))) {
          score += 40;
        }
        if (imp === "performance" && (festivalType.includes("축제") || festivalType.includes("공연")) && !festivalType.includes("food")) {
          score += 35;
        }
        if (imp === "photo") {
          score += averageRating * 6;
        }
        if (imp === "experience" && (festivalType.includes("체험") || festivalType.includes("참여"))) {
          score += 30;
        }
      });

      // 2. 인기도 점수
      const bookmarkScore = (festival.bookmark_count || 0) * 2;
      const ratingScore = averageRating * 20;

      score += bookmarkScore + ratingScore;

      return {
        ...festival,
        score,
        averageRating,
        location: festival.location || festival.city || "미상"
      };
    });

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
        name: festival.name,
        image: festival.image,
        location: festival.location,
        rating: festival.averageRating,
        bookmarkCount: festival.bookmark_count || 0,
        startDate: festival.start_date,
        endDate: festival.end_date,
        type: festival.type || ""
      }));

    res.json(recommendedFestivals);
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ error: "추천 생성 실패: " + error.message });
  }
};


