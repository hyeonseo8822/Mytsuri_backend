const { User, Review } = require("../models");
const path = require("path");
const fs = require("fs");

// 사용자 정보 조회
exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id nickname profile_img email name gender age survey').lean();
		if (!user) {
			return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
		}
		
		res.status(200).json({
			userId: user._id,
			nickname: user.nickname,
			profileImg: user.profile_img || null,
			email: user.email || null,
			name: user.name,
			gender: user.gender,
			age: user.age,
			survey: user.survey || []
		});
	} catch (error) {
		res.status(500).json({ message: "사용자 정보 조회 실패" });
	}
};

// 사용자 프로필 수정
exports.updateProfile = async (req, res) => {
	try {
		const { nickname, name, gender, age } = req.body;
		const updateData = {};
		
		if (nickname !== undefined) updateData.nickname = nickname;
		if (name !== undefined) updateData.name = name;
		if (gender !== undefined) updateData.gender = gender;
		if (age !== undefined) updateData.age = age;
		
		// 파일 업로드가 있으면 경로 저장
		if (req.file) {
			// 기존 프로필 이미지 삭제 (기본 이미지가 아닌 경우)
			const oldUser = await User.findById(req.user.id).select('profile_img');
			if (oldUser && oldUser.profile_img && !oldUser.profile_img.includes('default.svg')) {
				const oldPath = path.join(__dirname, '..', oldUser.profile_img);
				if (fs.existsSync(oldPath)) {
					fs.unlinkSync(oldPath);
				}
			}
			
			updateData.profile_img = `/uploads/profiles/${req.file.filename}`;
		}
		
		const user = await User.findByIdAndUpdate(
			req.user.id,
			updateData,
			{ new: true, runValidators: true }
		).select('nickname profile_img name gender age');
		
		if (!user) {
			return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
		}
		
		res.status(200).json({ 
			message: "프로필 수정 완료",
			user: {
				nickname: user.nickname,
				profileImg: user.profile_img || '/uploads/profiles/default.svg',
				name: user.name,
				gender: user.gender,
				age: user.age
			}
		});
	} catch (error) {
		console.error('Profile update error:', error);
		res.status(500).json({ message: "프로필 수정 실패" });
	}
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
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(200).json([]);
		}

		const reviews = await Review.find({ user_id: userId })
			.populate('festival_id', 'name')
			.sort({ created_at: -1 })
			.lean();

		const formattedReviews = reviews.map((review) => ({
			id: review._id,
			festivalName: review.festival_id?.name || '축제명 없음',
			festivalId: review.festival_id?._id,
			rating: review.rating,
			content: review.content,
			tags: review.tags || [],
			images: review.images || [],
			date: review.created_at ? new Date(review.created_at).toLocaleDateString('ko-KR') : ''
		}));

		res.status(200).json(formattedReviews);
	} catch (error) {
		console.error('Get my reviews error:', error);
		res.status(500).json({ message: "리뷰 조회 실패" });
	}
};

// 사용자 선호도 설문 저장
exports.saveSurvey = async (req, res) => {
	try {
		const { survey } = req.body;
		
		if (!survey || !Array.isArray(survey)) {
			return res.status(400).json({ message: "잘못된 설문 데이터입니다" });
		}
		
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ survey },
			{ new: true, runValidators: true }
		).select('survey');
		
		if (!user) {
			return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
		}
		
		res.status(200).json({ 
			message: "선호도 설문 저장 완료",
			survey: user.survey
		});
	} catch (error) {
		console.error('Survey save error:', error);
		res.status(500).json({ message: "설문 저장 실패" });
	}
};

module.exports = exports;
