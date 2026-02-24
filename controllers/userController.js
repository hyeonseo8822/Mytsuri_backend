const { User } = require("../models");

// 사용자 정보 조회
exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id nickname profile_img preference_tags').lean();
		if (!user) {
			return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
		}
		res.status(200).json({
			userId: user._id,
			nickname: user.nickname,
			profileImg: user.profile_img,
			preferences: user.preference_tags || []
		});
	} catch (error) {
		res.status(500).json({ message: "사용자 정보 조회 실패" });
	}
};

// 사용자 프로필 수정
exports.updateProfile = async (req, res) => {
	const { nickname, profileImageUrl } = req.body;
	res.status(200).json({ message: "프로필 수정 완료", nickname, profileImageUrl });
};

// 사용자 선호도 업데이트
exports.updatePreferences = async (req, res) => {
	try {
		const { preferences } = req.body;
		res.status(200).json({ message: "취향 태그 업데이트 성공", preferences });
	} catch (error) {
		res.status(500).json({ message: "서버 오류" });
	}
};

// 사용자 작성 리뷰 조회
exports.getMyReviews = async (req, res) => {
	res.status(200).json([{ reviewId: 1, festivalId: 10, rating: 5, content: "최고!" }]);
};

module.exports = exports;
