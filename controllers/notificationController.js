const { Notification, List, User } = require("../models");
const mongoose = require("mongoose");

// 알림 목록 조회
exports.getNotifications = async (req, res) => {
	try {
		const userId = req.user?.sub;
		
		if (!userId) {
			return res.status(401).json({ error: "로그인이 필요합니다" });
		}

		const notifications = await Notification.find({ user_id: userId })
			.sort({ created_at: -1 })
			.limit(50)
			.lean();

		// 리스트 초대 알림의 경우 추가 정보 가져오기
		const enrichedNotifications = await Promise.all(
			notifications.map(async (notification) => {
				if (notification.type === 'list_invite' && notification.data?.listId) {
					const list = await List.findById(notification.data.listId)
						.populate('user_id', 'nickname email')
						.lean();
					
					if (list) {
						return {
							...notification,
							data: {
								...notification.data,
								listName: list.name,
								inviterName: list.user_id.nickname
							}
						};
					}
				}
				
				// 리스트 축제 추가 알림의 경우
				if (notification.type === 'list_festival_added' && notification.data?.listId) {
					const list = await List.findById(notification.data.listId).lean();
					if (list) {
						return {
							...notification,
							data: {
								...notification.data,
								listName: list.name
							}
						};
					}
				}
				
				// 리스트 축제 제거 알림의 경우
				if (notification.type === 'list_festival_removed' && notification.data?.listId) {
					const list = await List.findById(notification.data.listId).lean();
					if (list) {
						return {
							...notification,
							data: {
								...notification.data,
								listName: list.name
							}
						};
					}
				}
				
				// 축제 다가옴 알림은 그대로 반환
				return notification;
			})
		);

		res.status(200).json(enrichedNotifications);
	} catch (error) {
		console.error("Get notifications error:", error);
		res.status(500).json({ error: "알림 조회 실패" });
	}
};

// 알림 읽음 처리
exports.markAsRead = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user?.sub;

		console.log('markAsRead 호출 - notificationId:', notificationId, 'userId:', userId);

		const notification = await Notification.findById(notificationId);
		console.log('조회된 notification:', notification ? '있음' : '없음');
		
		if (!notification) {
			console.error('알림을 찾을 수 없음:', notificationId);
			return res.status(404).json({ error: "알림을 찾을 수 없습니다" });
		}

		// userId 비교 (ObjectId vs string)
		console.log('notification.user_id:', notification.user_id.toString(), 'userId:', userId);
		if (notification.user_id.toString() !== userId) {
			console.error('권한 없음:', notification.user_id.toString(), '!=', userId);
			return res.status(403).json({ error: "이 알림을 수정할 권한이 없습니다" });
		}

		notification.isRead = true;
		await notification.save();

		console.log('알림 읽음 처리 완료:', notificationId);
		res.status(200).json({ message: "알림을 읽음 처리했습니다" });
	} catch (error) {
		console.error("Mark as read error:", error.message, error.stack);
		res.status(500).json({ error: "알림 읽음 처리 실패: " + error.message });
	}
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (req, res) => {
	try {
		const userId = req.user?.sub;

		await Notification.updateMany(
			{ user_id: userId, isRead: false },
			{ isRead: true }
		);

		res.status(200).json({ message: "모든 알림을 읽음 처리했습니다" });
	} catch (error) {
		console.error("Mark all as read error:", error);
		res.status(500).json({ error: "알림 읽음 처리 실패" });
	}
};

// 알림 삭제
exports.deleteNotification = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user?.sub;

		const result = await Notification.deleteOne({ _id: notificationId, user_id: userId });
		
		if (result.deletedCount === 0) {
			return res.status(404).json({ error: "알림을 찾을 수 없습니다" });
		}

		res.status(200).json({ message: "알림 삭제 완료" });
	} catch (error) {
		console.error("Delete notification error:", error);
		res.status(500).json({ error: "알림 삭제 실패" });
	}
};

// 읽지 않은 알림 개수
exports.getUnreadCount = async (req, res) => {
	try {
		const userId = req.user?.sub;
		
		if (!userId) {
			return res.status(401).json({ error: "로그인이 필요합니다" });
		}

		const count = await Notification.countDocuments({ user_id: userId, isRead: false });

		res.status(200).json({ count });
	} catch (error) {
		console.error("Get unread count error:", error);
		res.status(500).json({ error: "알림 개수 조회 실패" });
	}
};

// 리스트 초대 수락 (알림에서)
exports.acceptListInvite = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user?.sub;

		const notification = await Notification.findOne({ 
			_id: notificationId, 
			user_id: userId,
			type: 'list_invite'
		});
		
		if (!notification) {
			return res.status(404).json({ error: "초대 알림을 찾을 수 없습니다" });
		}

		const listId = notification.data?.listId;
		if (!listId) {
			return res.status(400).json({ error: "유효하지 않은 알림입니다" });
		}

		const list = await List.findById(listId);
		if (!list) {
			return res.status(404).json({ error: "리스트를 찾을 수 없습니다" });
		}

		// 협력자 찾기 및 상태 업데이트
		const collaborator = list.collaborators.find(
			c => c.user_id.toString() === userId && c.status === 'pending'
		);

		if (!collaborator) {
			return res.status(404).json({ error: "초대 정보를 찾을 수 없습니다" });
		}

		collaborator.status = 'accepted';
		await list.save();

		// 알림 삭제
		await Notification.deleteOne({ _id: notificationId });

		res.status(200).json({ message: "초대를 수락했습니다", listId });
	} catch (error) {
		console.error("Accept list invite error:", error);
		res.status(500).json({ error: "초대 수락 실패" });
	}
};

// 리스트 초대 거절 (알림에서)
exports.rejectListInvite = async (req, res) => {
	try {
		const { notificationId } = req.params;
		const userId = req.user?.sub;

		const notification = await Notification.findOne({ 
			_id: notificationId, 
			user_id: userId,
			type: 'list_invite'
		});
		
		if (!notification) {
			return res.status(404).json({ error: "초대 알림을 찾을 수 없습니다" });
		}

		const listId = notification.data?.listId;
		if (!listId) {
			return res.status(400).json({ error: "유효하지 않은 알림입니다" });
		}

		const list = await List.findById(listId);
		if (!list) {
			// 리스트가 이미 삭제된 경우 알림만 삭제
			await Notification.deleteOne({ _id: notificationId });
			return res.status(200).json({ message: "초대를 거절했습니다" });
		}

		// 협력자 제거
		list.collaborators = list.collaborators.filter(
			c => c.user_id.toString() !== userId
		);
		await list.save();

		// 알림 삭제
		await Notification.deleteOne({ _id: notificationId });

		res.status(200).json({ message: "초대를 거절했습니다" });
	} catch (error) {
		console.error("Reject list invite error:", error);
		res.status(500).json({ error: "초대 거절 실패" });
	}
};
// 디버그: 현재 사용자의 협력자 상태 확인
exports.getDebugInfo = async (req, res) => {
	try {
		const userId = req.user?.sub;
		
		if (!userId) {
			return res.status(401).json({ error: "로그인이 필요합니다" });
		}

		// 현재 사용자 조회
		const currentUser = await User.findById(userId).lean();
		if (!currentUser) {
			return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
		}

		// 이 사용자가 협력자로 있는 리스트들 찾기
		const listsAsCollaborator = await List.find({
			"collaborators.user_id": userId
		}).select('_id name user_id collaborators').lean();

		// 이 사용자가 소유한 리스트들
		const listsAsOwner = await List.find({
			user_id: userId
		}).select('_id name collaborators').lean();

		// 이 사용자의 알림 통계
		const totalNotifications = await Notification.countDocuments({ user_id: userId });
		const unreadNotifications = await Notification.countDocuments({ user_id: userId, isRead: false });
		const notificationsByType = await Notification.aggregate([
			{ $match: { user_id: new mongoose.Types.ObjectId(userId) } },
			{ $group: { _id: "$type", count: { $sum: 1 } } }
		]);

		res.status(200).json({
			currentUser: {
				_id: currentUser._id,
				email: currentUser.email,
				nickname: currentUser.nickname
			},
			collaboratorStatus: {
				listsAsCollaborator: listsAsCollaborator.map(list => {
					const col = list.collaborators.find(c => c.user_id.toString() === userId);
					return {
						listId: list._id,
						listName: list.name,
						ownerId: list.user_id,
						role: col?.role,
						status: col?.status
					};
				}),
				listsAsOwner: listsAsOwner.map(list => ({
					listId: list._id,
					listName: list.name,
					collaboratorCount: list.collaborators.length
				}))
			},
			notificationStats: {
				total: totalNotifications,
				unread: unreadNotifications,
				byType: notificationsByType
			}
		});
	} catch (error) {
		console.error("Get debug info error:", error);
		res.status(500).json({ error: "디버그 정보 조회 실패" });
	}
};