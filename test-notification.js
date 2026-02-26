require("dotenv").config();
const mongoose = require("mongoose");
const { User, List, Notification, Festival } = require("./models");

async function debugNotification() {
	try {
		// MongoDB 연결
		await mongoose.connect(process.env.MONGO_URI);
		console.log("✓ MongoDB 연결됨");

		// 테스트용 계정 찾기
		const users = await User.find().limit(2);
		if (users.length < 2) {
			console.error("❌ 테스트 계정이 부족합니다. 최소 2개 필요");
			process.exit(1);
		}

		const user1 = users[0];
		const user2 = users[1];

		console.log(`\n📌 테스트 계정:`);
		console.log(`  User1(소유자): ${user1._id} - ${user1.nickname} (${user1.email})`);
		console.log(`  User2(협력자): ${user2._id} - ${user2.nickname} (${user2.email})`);

		// User2의 현재 알림 개수 확인
		const beforeNotificationCount = await Notification.countDocuments({ user_id: user2._id });
		console.log(`\n📨 User2의 현재 알림 개수: ${beforeNotificationCount}개`);

		// 기존 리스트 찾기 또는 생성
		let list = await List.findOne({ user_id: user1._id });
		if (!list) {
			console.log(`\n📝 새 리스트 생성...`);
			list = new List({
				user_id: user1._id,
				name: "알림 테스트 리스트",
				description: "알림 기능 테스트용",
				festivals: [],
				collaborators: [
					{
						user_id: user2._id,
						role: "editor",
						status: "accepted"
					}
				]
			});
			await list.save();
			console.log(`✓ 리스트 생성됨: ${list._id}`);
		} else {
			console.log(`\n📝 기존 리스트 사용: ${list._id}`);
			// 협력자 확인
			const collaborator = list.collaborators.find(c => c.user_id.toString() === user2._id.toString());
			if (!collaborator) {
				console.log(`   → User2 협력자로 추가...`);
				list.collaborators.push({
					user_id: user2._id,
					role: "editor",
					status: "accepted"
				});
				await list.save();
				console.log(`✓ User2가 협력자로 추가됨`);
			} else {
				console.log(`   → 협력자 User2 발견:`);
				console.log(`     · Role: ${collaborator.role}`);
				console.log(`     · Status: ${collaborator.status}`);

				// 상태 확인
				if (collaborator.status !== "accepted") {
					console.log(`⚠️  협력자 상태가 "${collaborator.status}"입니다. "accepted"로 변경...`);
					collaborator.status = "accepted";
					await list.save();
				}
				if (collaborator.role !== "editor") {
					console.log(`⚠️  협력자 역할이 "${collaborator.role}"입니다. "editor"로 변경...`);
					collaborator.role = "editor";
					await list.save();
				}
			}
		}

		// 축제 선택 (첫 번째 축제 사용)
		let festival = await Festival.findOne();
		if (!festival) {
			console.error("❌ 사용 가능한 축제가 없습니다");
			process.exit(1);
		}

		console.log(`\n🎪 선택된 축제: ${festival.name} (${festival._id})`);

		// 축제가 이미 리스트에 있는지 확인
		const existingFestival = list.festivals.find(f => f.toString() === festival._id.toString());
		if (!existingFestival) {
			console.log(`\n➕ 축제를 리스트에 추가...`);
			list.festivals.push(festival._id);
			await list.save();
			console.log(`✓ 축제 추가됨`);

			// 수동으로 알림 생성 (addFestivalToList 함수처럼)
			const adderName = user1.nickname || "친구";
			console.log(`\n📬 알림 생성...`);

			const notificationTargets = [];
			const ownerId = list.user_id.toString();
			
			// 소유자가 아닌 경우 소유자에게 알림
			if (ownerId !== user1._id.toString()) {
				notificationTargets.push({ user_id: list.user_id });
			}

			// 협력자 중 수락한 사람들 (본인 제외)
			const acceptedCollaborators = list.collaborators.filter(
				c => c.status === 'accepted' && c.user_id.toString() !== user1._id.toString()
			);
			notificationTargets.push(...acceptedCollaborators.map(c => ({ user_id: c.user_id })));

			console.log(`  → 알림 대상: ${notificationTargets.length}명`);

			if (notificationTargets.length > 0) {
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
					actionUrl: `/list/${list._id}`,
					isRead: false
				}));

				const result = await Notification.insertMany(notifications);
				console.log(`✓ ${result.length}개의 알림 생성됨`);

				// 생성된 알림 상세 확인
				console.log(`\n📌 생성된 알림 상세:`);
				for (const notif of result) {
					console.log(`  • ID: ${notif._id}`);
					console.log(`    User: ${notif.user_id}`);
					console.log(`    Type: ${notif.type}`);
					console.log(`    Message: ${notif.message}`);
					console.log(`    IsRead: ${notif.isRead}`);
				}
			}
		} else {
			console.log(`ℹ️  축제가 이미 리스트에 있습니다. 알림을 수동으로 전송합니다...`);
			
			// 기존 축제의 경우에도 테스트 알림 생성
			const testNotification = new Notification({
				user_id: user2._id,
				type: 'list_festival_added',
				title: list.name,
				message: `테스트 알림: "${festival.name}"이 추가되었습니다`,
				data: {
					listId: list._id,
					festivalId: festival._id,
					festivalName: festival.name,
					adderName: user1.nickname
				},
				actionUrl: `/list/${list._id}`,
				isRead: false
			});
			
			await testNotification.save();
			console.log(`✓ 테스트 알림 생성됨: ${testNotification._id}`);
		}

		// 최종 확인
		console.log(`\n✅ 최종 확인:`);
		const afterNotificationCount = await Notification.countDocuments({ user_id: user2._id });
		const user2Notifications = await Notification.find({ user_id: user2._id })
			.sort({ created_at: -1 })
			.limit(5);

		console.log(`  User2의 총 알림: ${afterNotificationCount}개`);
		console.log(`  최근 알림:`);
		for (const notif of user2Notifications) {
			const isRecent = notif.created_at > new Date(Date.now() - 60000) ? "🔴" : "⚪";
			console.log(`    ${isRecent} [${notif.type}] ${notif.message} (읽음: ${notif.isRead})`);
		}

		// 프론트엔드 테스트 URL
		console.log(`\n🌐 프론트엔드에서 확인:`);
		console.log(`  1. User2 계정으로 로그인`);
		console.log(`  2. 알림 페이지 방문: http://localhost:5173/notification`);
		console.log(`  3. 또는 API 직접 호출: GET /api/notifications`);
		console.log(`  4. 30초 후 홈/지도 페이지의 배지 숫자 확인`);

		await mongoose.connection.close();
		console.log(`\n✓ 연결 종료`);
	} catch (error) {
		console.error("❌ 오류:", error);
		process.exit(1);
	}
}

debugNotification();
