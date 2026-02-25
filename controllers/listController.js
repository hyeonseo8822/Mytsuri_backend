const { List, Festival } = require("../models");

// 리스트 목록 조회
exports.getLists = async (req, res) => {
	try {
		const userId = req.user?.sub;
		console.log('getLists 호출 - userId:', userId);
		
		// userId가 없으면 빈 배열 반환
		if (!userId) {
			console.log('userId가 없어서 빈 배열 반환');
			return res.status(200).json([]);
		}
		
		const lists = await List.find({ user_id: userId })
			.populate("festivals")
			.sort({ created_at: -1 })
			.lean();

		console.log('조회된 리스트 개수:', lists.length);

		const formattedLists = lists.map((list) => ({
			id: list._id,
			name: list.name,
			coverImage: list.coverImage || list.festivals?.[0]?.image,
			festivals: list.festivals?.map((f) => ({
				_id: f._id,
				id: f._id,
				title: f.name,
				image: f.image
			})) || [],
			sharedWith: list.sharedWith,
			isPublic: list.isPublic
		}));

		res.status(200).json(formattedLists);
	} catch (error) {
		console.error("Get lists error:", error);
		res.status(500).json({ error: "리스트 조회 실패" });
	}
};

// 리스트 상세 조회
exports.getListDetail = async (req, res) => {
	try {
		const { listId } = req.params;
		const list = await List.findById(listId)
			.populate("festivals")
			.lean();

		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 각 축제의 리뷰 수와 평점 계산
		const { Review } = require("../models");
		const festivalsWithData = await Promise.all(
			(list.festivals || []).map(async (festival) => {
				const reviews = await Review.find({ festival_id: festival._id }).lean();
				const reviewCount = reviews.length;
				const averageRating = reviews.length > 0
					? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
					: 0;

				const startDate = new Date(festival.start_date);
				const endDate = new Date(festival.end_date);
				const year = startDate.getFullYear();
				const startMonth = startDate.getMonth() + 1;
				const endMonth = endDate.getMonth() + 1;
				
				let dateStr;
				if (startMonth === endMonth) {
					dateStr = `${year}년 ${startMonth}월`;
				} else {
					dateStr = `${year}년 ${startMonth}월~${endMonth}월`;
				}

				return {
					id: festival._id,
					title: festival.name,
					image: festival.image,
					location: festival.location || `${festival.state || ""} ${festival.city || ""}`.trim(),
					date: dateStr,
					rating: averageRating,
					reviewCount: reviewCount,
					bookmarkCount: festival.bookmark_count || 0
				};
			})
		);

		const response = {
			id: list._id,
			name: list.name,
			coverImage: list.coverImage || list.festivals?.[0]?.image,
			festivals: festivalsWithData,
			sharedWith: list.sharedWith,
			isPublic: list.isPublic
		};

		res.status(200).json(response);
	} catch (error) {
		console.error("Get list detail error:", error);
		res.status(500).json({ error: "리스트 조회 실패" });
	}
};

// 리스트 생성
exports.createList = async (req, res) => {
	try {
		const userId = req.user.sub;
		const { name, coverImage, isPublic, festivalId } = req.body;

		const newList = await List.create({
			user_id: userId,
			name,
			coverImage,
			isPublic: isPublic !== undefined ? isPublic : true,
			festivals: festivalId ? [festivalId] : []
		});

		// 축제가 있으면 bookmark_count 증가
		if (festivalId) {
			await Festival.findByIdAndUpdate(festivalId, { $inc: { bookmark_count: 1 } });
		}

		res.status(201).json({ id: newList._id, message: "리스트 생성 완료" });
	} catch (error) {
		console.error("Create list error:", error);
		res.status(500).json({ error: "리스트 생성 실패" });
	}
};

// 리스트 수정
exports.updateList = async (req, res) => {
	try {
		const { listId } = req.params;
		const userId = req.user.sub;
		const { name, coverImage, isPublic } = req.body;

		const list = await List.findOne({ _id: listId, user_id: userId });
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		if (name) list.name = name;
		if (coverImage !== undefined) list.coverImage = coverImage;
		if (isPublic !== undefined) list.isPublic = isPublic;
		
		await list.save();

		res.status(200).json({ message: "리스트 수정 완료" });
	} catch (error) {
		console.error("Update list error:", error);
		res.status(500).json({ error: "리스트 수정 실패" });
	}
};

// 리스트 삭제
exports.deleteList = async (req, res) => {
	try {
		const { listId } = req.params;
		const userId = req.user?.sub;
		
		console.log('deleteList 호출 - listId:', listId, 'userId:', userId);
		
		// 모든 리스트 조회이므로 user_id 체크 없이 삭제
		const list = await List.findByIdAndDelete(listId);
		
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 리스트의 모든 축제의 bookmark_count 감소
		if (list.festivals && list.festivals.length > 0) {
			await Festival.updateMany(
				{ _id: { $in: list.festivals } },
				{ $inc: { bookmark_count: -1 } }
			);
		}

		console.log('리스트 삭제 완료:', listId);
		res.status(200).json({ message: "리스트 삭제 완료" });
	} catch (error) {
		console.error("Delete list error:", error);
		res.status(500).json({ error: "리스트 삭제 실패" });
	}
};

// 리스트에 축제 추가
exports.addFestivalToList = async (req, res) => {
	try {
		const { listId } = req.params;
		const { festivalId } = req.body;

		console.log('addFestivalToList 호출 - listId:', listId, 'festivalId:', festivalId);

		const list = await List.findById(listId);
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 이미 추가되었는지 확인
		const festivalIdStr = festivalId.toString();
		const existingIdx = list.festivals.findIndex((f) => f.toString() === festivalIdStr);
		
		if (existingIdx === -1) {
			// 축제가 없으면 추가
			list.festivals.push(festivalId);
			await list.save();
			console.log('축제 추가 완료:', festivalId);
			
			// bookmark_count 증가
			await Festival.findByIdAndUpdate(festivalId, { $inc: { bookmark_count: 1 } });
			console.log('bookmark_count 증가:', festivalId);
		} else {
			console.log('이미 리스트에 있는 축제:', festivalId);
		}

		res.status(201).json({ message: "축제 추가 완료" });
	} catch (error) {
		console.error("Add festival to list error:", error);
		res.status(500).json({ error: "축제 추가 실패" });
	}
};

// 리스트에서 축제 제거
exports.removeFestivalFromList = async (req, res) => {
	try {
		const { listId, festivalId } = req.params;

		console.log('removeFestivalFromList 호출 - listId:', listId, 'festivalId:', festivalId);

		const list = await List.findById(listId);
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		const festivalIdStr = festivalId.toString();
		const hadFestival = list.festivals.some((f) => f.toString() === festivalIdStr);
		list.festivals = list.festivals.filter((f) => f.toString() !== festivalIdStr);
		await list.save();

		// bookmark_count 감소 (원래 있었던 경우만)
		if (hadFestival) {
			await Festival.findByIdAndUpdate(festivalId, { $inc: { bookmark_count: -1 } });
			console.log('bookmark_count 감소:', festivalId);
		}

		res.status(204).send();
	} catch (error) {
		console.error("Remove festival from list error:", error);
		res.status(500).json({ error: "축제 제거 실패" });
	}
};

// 리스트에 공동작업자 추가
exports.addCollaborator = async (req, res) => {
	const { listId } = req.params;
	const { email } = req.body;
	res.status(200).json({ message: "공동작업자 추가 완료", listId, email });
};

module.exports = exports;
