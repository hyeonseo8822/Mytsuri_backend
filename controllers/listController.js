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
		
		// 사용자가 소유한 리스트 또는 협력자로 추가된 리스트 조회
		const lists = await List.find({
			$or: [
				{ user_id: userId },
				{ 'collaborators.user_id': userId, 'collaborators.status': 'accepted' }
			]
		})
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
			collaborators: list.collaborators || [],
			isPublic: list.isPublic,
			isOwner: list.user_id.toString() === userId
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
		
		// "public"이 listId로 전달되면 모든 공개 리스트 반환
		if (listId === "public") {
			const publicLists = await List.find({ isPublic: true })
				.populate("festivals")
				.lean();

			if (!publicLists || publicLists.length === 0) {
				return res.status(200).json([]);
			}

			// 각 리스트의 축제별 리뷰 데이터 계산
			const { Review } = require("../models");
			const listsWithData = await Promise.all(
				publicLists.map(async (list) => {
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

					return {
						id: list._id,
						name: list.name,
						coverImage: list.coverImage || list.festivals?.[0]?.image,
						festivals: festivalsWithData,
						collaborators: list.collaborators || [],
						isPublic: list.isPublic
					};
				})
			);

			return res.status(200).json(listsWithData);
		}

		// 일반 ObjectId 조회
		const list = await List.findById(listId)
			.populate("festivals")
			.populate("collaborators.user_id", "nickname email")
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
			user_id: list.user_id,
			name: list.name,
			coverImage: list.coverImage || list.festivals?.[0]?.image,
			festivals: festivalsWithData,
			collaborators: list.collaborators || [],
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

		// "public" 리스트는 수정 불가
		if (listId === "public") {
			return res.status(403).json({ error: "공개 리스트는 수정할 수 없습니다" });
		}

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

		// "public" 리스트는 삭제 불가
		if (listId === "public") {
			return res.status(403).json({ error: "공개 리스트는 삭제할 수 없습니다" });
		}
		
		// 모든 리스트 조회이므로 user_id 체크 없이 삭제
		const list = await List.findByIdAndDelete(listId);
		
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 리스트의 모든 축제의 bookmark_count 감소 (음수 방지)
		if (list.festivals && list.festivals.length > 0) {
			// 각 축제마다 bookmark_count가 0보다 클 때만 감소
			for (const festivalId of list.festivals) {
				await Festival.findOneAndUpdate(
					{ _id: festivalId, bookmark_count: { $gt: 0 } },
					{ $inc: { bookmark_count: -1 } }
				);
			}
			console.log('bookmark_count 감소 완료');
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
		const userId = req.user?.sub;

		console.log('addFestivalToList 호출 - listId:', listId, 'festivalId:', festivalId, 'userId:', userId);

		const list = await List.findById(listId);
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 권한 체크: 소유자 또는 에디터 역할의 협력자만 추가 가능
		const isOwner = list.user_id.toString() === userId;
		const isEditor = list.collaborators.some(
			c => c.user_id.toString() === userId && c.role === 'editor' && c.status === 'accepted'
		);

		if (!isOwner && !isEditor) {
			console.error('권한 없날: userId', userId);
			return res.status(403).json({ error: "리스트 수정 권한이 없습니다" });
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
			const festival = await Festival.findByIdAndUpdate(
				festivalId, 
				{ $inc: { bookmark_count: 1 } },
				{ new: true }
			);
			console.log('bookmark_count 증가:', festivalId);

			// 소유자와 협력자들에게 알림 전송 (축제 추가한 사람 본인 제외)
			const userId = req.user?.sub;
			const { Notification, User } = require("../models");
			
			console.log('알림 생성 - userId:', userId);
			
			// 추가한 사용자 정보 조회 (userId는 string이므로 직접 사용 가능)
			let adderUser = null;
			try {
				adderUser = await User.findById(userId).lean();
			} catch (e) {
				console.error('User 조회 실패:', e.message);
			}
			console.log('조회된 adderUser:', adderUser?._id, adderUser?.nickname, adderUser?.email);
			const adderName = adderUser?.nickname || adderUser?.name || '친구';
			console.log('adderName:', adderName);
			
			// 알림 받을 사람들 목록 (소유자 + 수락한 협력자들, 본인 제외)
			const notificationTargets = [];
			
			// 소유자 추가 (본인이 아닌 경우)
			const ownerId = list.user_id.toString();
			if (ownerId !== userId) {
				notificationTargets.push({ user_id: list.user_id });
			}
			
			// 협력자들 중 수락한 사람들 추가 (본인 제외)
			const acceptedCollaborators = list.collaborators.filter(
				c => c.status === 'accepted' && c.user_id.toString() !== userId
			);
			notificationTargets.push(...acceptedCollaborators.map(c => ({ user_id: c.user_id })));
			
			if (notificationTargets.length > 0 && festival) {
				const notifications = notificationTargets.map(target => ({
					user_id: target.user_id,
					type: 'list_festival_added',
					title: list.name,
					message: `${adderName}님이 "${festival.name}"을(를) 추가했어요`,
					data: {
						listId: list._id,
						festivalId: festival._id,
						festivalName: festival.name,
						adderName
					},
					actionUrl: `/list/${list._id}`
				}));
				
				await Notification.insertMany(notifications);
				console.log(`소유자 및 협력자 ${notificationTargets.length}명에게 알림 전송`);
			}

			// 축제 날짜 확인 (한 달 남았는지 체크)
			if (festival && festival.start_date) {
				const now = new Date();
				const startDate = new Date(festival.start_date);
				const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
				
				// 30일 미만이고 아직 시작 전이면 알림 생성
				if (daysUntil < 30) {
					// 리스트의 모든 멤버(소유자 + 협력자)에게 알림
					const allMembers = [
						{ user_id: list.user_id },
						...list.collaborators.filter(c => c.status === 'accepted')
					];
					
					// 각 멤버에 대해 이미 festival_upcoming 알림이 있는지 확인하고 중복 제거
					const newNotifications = [];
					for (const member of allMembers) {
						const existingNotification = await Notification.findOne({
							user_id: member.user_id,
							type: 'festival_upcoming',
							'data.festivalId': festival._id
						}).lean();
						
						// 같은 축제에 대한 festival_upcoming 알림이 없으면 생성
						if (!existingNotification) {
							const isOngoing = daysUntil < 0;
							newNotifications.push({
								user_id: member.user_id,
								type: 'festival_upcoming',
								title: '내 축제',
								message: `"${festival.name}"이(가) 곧 시작됩니다!`,
								data: {
									listId: list._id,
									festivalId: festival._id,
									festivalName: festival.name,
									daysUntil,
									isOngoing
								},
								actionUrl: `/festival/${festival._id}`
							});
						}
					}
					
					if (newNotifications.length > 0) {
						await Notification.insertMany(newNotifications);
						const status = daysUntil < 0 ? '진행중' : `D-${daysUntil}`;
						console.log(`축제 알림 생성 - ${festival.name} (${status}, ${newNotifications.length}명)`);
					}
				}
			}
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
		const userId = req.user?.sub;

		console.log('removeFestivalFromList 호출 - listId:', listId, 'festivalId:', festivalId, 'userId:', userId);

		const list = await List.findById(listId);
		if (!list) {
			console.error('리스트를 찾을 수 없음:', listId);
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 권한 체크: 소유자 또는 에디터 역할의 협력자만 제거 가능
		const isOwner = list.user_id.toString() === userId;
		const isEditor = list.collaborators.some(
			c => c.user_id.toString() === userId && c.role === 'editor' && c.status === 'accepted'
		);

		if (!isOwner && !isEditor) {
			console.error('권한 없날: userId', userId);
			return res.status(403).json({ error: "리스트 수정 권한이 없습니다" });
		}

		const festivalIdStr = festivalId.toString();
		const hadFestival = list.festivals.some((f) => f.toString() === festivalIdStr);
		list.festivals = list.festivals.filter((f) => f.toString() !== festivalIdStr);
		await list.save();

		// bookmark_count 감소 (원래 있었던 경우만, 음수 방지)
		if (hadFestival) {
			// 축제 정보 조회
			const festival = await Festival.findById(festivalId);
			const festivalName = festival?.name || '축제';
			
			// bookmark_count 감소
			if (festival && festival.bookmark_count > 0) {
				await Festival.findByIdAndUpdate(
					festivalId,
					{ $inc: { bookmark_count: -1 } },
					{ new: true }
				);
			}
			console.log('bookmark_count 감소:', festivalId);

			// 축제 제거 알림 전송
			const { Notification, User } = require("../models");
			
			console.log('축제 제거 알림 생성 - userId:', userId);
			
			// 제거한 사용자 정보 조회
			let removerUser = null;
			try {
				removerUser = await User.findById(userId).lean();
			} catch (e) {
				console.error('User 조회 실패:', e.message);
			}
			console.log('조회된 removerUser:', removerUser?._id, removerUser?.nickname, removerUser?.email);
			const removerName = removerUser?.nickname || removerUser?.name || '친구';
			console.log('removerName:', removerName);

			// 알림 받을 사람들 목록 (소유자 + 수락한 협력자들, 본인 제외)
			const notificationTargets = [];

			// 소유자 추가 (본인이 아닌 경우)
			const ownerId = list.user_id.toString();
			if (ownerId !== userId) {
				notificationTargets.push({ user_id: list.user_id });
			}

			// 협력자들 중 수락한 사람들 추가 (본인 제외)
			const acceptedCollaborators = list.collaborators.filter(
				c => c.status === 'accepted' && c.user_id.toString() !== userId
			);
			notificationTargets.push(...acceptedCollaborators.map(c => ({ user_id: c.user_id })));

			if (notificationTargets.length > 0) {
				const notifications = notificationTargets.map(target => ({
					user_id: target.user_id,
					type: 'list_festival_removed',
					title: list.name,
					message: `${removerName}님이 "${festivalName}"을(를) 제거했어요`,
					data: {
						listId: list._id,
						festivalId: festival?._id || festivalId,
						festivalName: festivalName,
						removerName
					},
					actionUrl: `/list/${list._id}`,
					isRead: false
				}));

				await Notification.insertMany(notifications);
				console.log(`소유자 및 협력자 ${notificationTargets.length}명에게 제거 알림 전송`);
			} else {
				console.log('알림을 받을 대상이 없음');
			}
		}

		res.status(204).send();
	} catch (error) {
		console.error("Remove festival from list error:", error);
		res.status(500).json({ error: "축제 제거 실패" });
	}
};

// 리스트에 공동작업자 초대
exports.addCollaborator = async (req, res) => {
	try {
		console.log('addCollaborator 호출됨 - listId:', req.params.listId, 'email:', req.body.email, 'userId:', req.user?.sub);
		const { listId } = req.params;
		const { email } = req.body;
		const userId = req.user?.sub;

		if (!email) {
			console.log('이메일 없음');
			return res.status(400).json({ error: "이메일을 입력해주세요" });
		}

		const list = await List.findById(listId);
		console.log('리스트 조회 결과:', list ? '찾음' : '못찾음');
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 소유자 확인
		console.log('리스트 소유자:', list.user_id.toString(), '현재 사용자:', userId);
		if (list.user_id.toString() !== userId) {
			return res.status(403).json({ error: "리스트 소유자만 초대할 수 있습니다" });
		}

		// 이메일로 사용자 찾기
		const { User } = require("../models");
		console.log('이메일로 사용자 검색:', email.trim().toLowerCase());
		const targetUser = await User.findOne({ email: email.trim().toLowerCase() }).lean();
		console.log('대상 사용자 조회 결과:', targetUser ? '찾음' : '못찾음');

		if (!targetUser) {
			return res.status(404).json({ error: "해당 이메일의 사용자를 찾을 수 없습니다" });
		}

		// 자기 자신을 초대하는 경우
		if (targetUser._id.toString() === userId) {
			return res.status(400).json({ error: "자기 자신은 초대할 수 없습니다" });
		}

		// 이미 초대되었는지 확인
		const alreadyInvited = list.collaborators.some(
			c => c.user_id.toString() === targetUser._id.toString()
		);

		if (alreadyInvited) {
			return res.status(400).json({ error: "이미 초대된 사용자입니다" });
		}

		// 협력자 추가
		list.collaborators.push({
			user_id: targetUser._id,
			role: 'editor',
			status: 'pending'
		});

		await list.save();

		// 알림 생성
		const { Notification } = require("../models");
		const inviter = await User.findById(userId).lean();
		
		await Notification.create({
			user_id: targetUser._id,
			type: 'list_invite',
			title: '리스트 공유 초대',
			message: `${inviter?.nickname || '사용자'}님이 "${list.name}" 리스트를 공유했습니다.`,
			data: {
				listId: list._id.toString(),
				listName: list.name,
				inviterId: userId,
				inviterName: inviter?.nickname
			},
			isRead: false
		});

		console.log('알림 생성 완료 - 대상:', targetUser._id);

		res.status(200).json({
			message: "사용자 초대 완료",
			collaborator: {
				user_id: targetUser._id,
				role: 'editor',
				status: 'pending'
			}
		});
	} catch (error) {
		console.error('Add collaborator error:', error);
		res.status(500).json({ error: "협력자 추가 실패" });
	}
};

// 초대 수락
exports.acceptInvitation = async (req, res) => {
	try {
		const { listId } = req.params;
		const userId = req.user?.sub;

		const list = await List.findById(listId);
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 협력자 찾기 및 상태 업데이트
		const collaborator = list.collaborators.find(
			c => c.user_id.toString() === userId
		);

		if (!collaborator) {
			return res.status(404).json({ error: "초대 정보를 찾을 수 없습니다" });
		}

		collaborator.status = 'accepted';
		await list.save();

		res.status(200).json({ message: "초대 수락 완료" });
	} catch (error) {
		console.error('Accept invitation error:', error);
		res.status(500).json({ error: "초대 수락 실패" });
	}
};

// 초대 거절
exports.rejectInvitation = async (req, res) => {
	try {
		const { listId } = req.params;
		const userId = req.user?.sub;

		const list = await List.findById(listId);
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 협력자 제거
		list.collaborators = list.collaborators.filter(
			c => c.user_id.toString() !== userId
		);
		await list.save();

		res.status(200).json({ message: "초대 거절 완료" });
	} catch (error) {
		console.error('Reject invitation error:', error);
		res.status(500).json({ error: "초대 거절 실패" });
	}
};

// 협력자 제거
exports.removeCollaborator = async (req, res) => {
	try {
		const { listId, collaboratorId } = req.params;
		const userId = req.user?.sub;

		const list = await List.findById(listId);
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 소유자 확인
		if (list.user_id.toString() !== userId) {
			return res.status(403).json({ error: "리스트 소유자만 협력자를 제거할 수 있습니다" });
		}

		// 협력자 제거
		list.collaborators = list.collaborators.filter(
			c => c.user_id.toString() !== collaboratorId
		);
		await list.save();

		res.status(200).json({ message: "협력자 제거 완료" });
	} catch (error) {
		console.error('Remove collaborator error:', error);
		res.status(500).json({ error: "협력자 제거 실패" });
	}
};

module.exports = exports;
