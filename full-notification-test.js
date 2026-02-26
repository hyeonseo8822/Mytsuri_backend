require("dotenv").config();
const mongoose = require("mongoose");
const { User, List, Notification, Festival } = require("./models");

async function fullNotificationTest() {
	try {
		// MongoDB 연결
		await mongoose.connect(process.env.MONGO_URI);
		console.log("✓ MongoDB 연결됨\n");

		// 테스트용 계정 찾기
		const users = await User.find().limit(2);
		if (users.length < 2) {
			console.error("❌ 테스트 계정이 부족합니다. 최소 2개 필요");
			process.exit(1);
		}

		const user1 = users[0];
		const user2 = users[1];

		console.log(`📌 테스트 계정:`);
		console.log(`  User1(소유자): ${user1._id} - ${user1.nickname} (${user1.email})`);
		console.log(`  User2(협력자): ${user2._id} - ${user2.nickname} (${user2.email})\n`);

		// ============ SCENARIO 1: User1이 추가 -> User2가 받음 ============
		console.log(`\n${'='.repeat(60)}`);
		console.log(`🔴 시나리오 1: User1(소유자)이 축제 추가`);
		console.log(`${'='.repeat(60)}\n`);

		// 프로세스 1: 테스트용 리스트 생성 또는 존재하는 것 사용
		let list = await List.findOne({ user_id: user1._id });
		if (!list) {
			list = new List({
				user_id: user1._id,
				name: "[시나리오1] User1의 리스트",
				description: "User1이 소유, User2가 협력자",
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
			console.log(`✓ 새 리스트 생성: ${list._id}`);
		} else {
			// 기존 리스트에 User2를 협력자로 추가
			const col = list.collaborators.find(c => c.user_id.toString() === user2._id.toString());
			if (!col) {
				list.collaborators.push({
					user_id: user2._id,
					role: "editor",
					status: "accepted"
				});
				await list.save();
				console.log(`✓ User2를 리스트에 협력자로 추가`);
			}
		}

		// 2: 축제 추가
		let festival = await Festival.findOne();
		if (!festival) {
			console.error("❌ 사용 가능한 축제가 없습니다");
			process.exit(1);
		}

		const existingFestival = list.festivals.find(f => f.toString() === festival._id.toString());
		if (!existingFestival) {
			list.festivals.push(festival._id);
			await list.save();
			console.log(`✓ 축제 추가: ${festival.name}`);

			// 3: 알림 생성 (addFestivalToList 로직)
			const user1Name = user1.nickname || "친구";
			const notifications = [{
				user_id: user2._id,
				type: 'list_festival_added',
				title: list.name,
				message: `${user1Name}님이 "${festival.name}"을(를) 추가했어요`,
				data: {
					listId: list._id,
					festivalId: festival._id,
					festivalName: festival.name,
					adderName: user1Name
				},
				actionUrl: `/list/${list._id}`,
				isRead: false
			}];

			await Notification.insertMany(notifications);
			console.log(`✓ 알림 생성됨 (User2에게 전송)`);
		}

		// 4: 결과 확인
		const user2Notifications = await Notification.countDocuments({
			user_id: user2._id,
			type: 'list_festival_added'
		});
		console.log(`\n📊 User2가 받은 'list_festival_added' 알림: ${user2Notifications}개`);

		if (user2Notifications > 0) {
			const recentNotif = await Notification.findOne({
				user_id: user2._id,
				type: 'list_festival_added'
			}).sort({ created_at: -1 });
			console.log(`   최근: "${recentNotif.message}"`);
			console.log(`   읽음: ${recentNotif.isRead}`);
		}

		// ============ SCENARIO 2: User2가 추가 -> User1이 받음 ============
		console.log(`\n${'='.repeat(60)}`);
		console.log(`🔵 시나리오 2: User2(협력자)가 축제 추가`);
		console.log(`${'='.repeat(60)}\n`);

		// 1: 다른 축제 찾기
		let festival2 = await Festival.findOne({ _id: { $ne: festival._id } });
		if (!festival2) {
			festival2 = festival; // 같은 축제 재사용
		}

		const existingFestival2 = list.festivals.find(f => f.toString() === festival2._id.toString());
		if (!existingFestival2) {
			list.festivals.push(festival2._id);
			await list.save();
			console.log(`✓ 축제 추가: ${festival2.name}`);

			// 2: 알림 생성 (User2 → User1)
			const user2Name = user2.nickname || "친구";
			const notifications = [{
				user_id: user1._id,
				type: 'list_festival_added',
				title: list.name,
				message: `${user2Name}님이 "${festival2.name}"을(를) 추가했어요`,
				data: {
					listId: list._id,
					festivalId: festival2._id,
					festivalName: festival2.name,
					adderName: user2Name
				},
				actionUrl: `/list/${list._id}`,
				isRead: false
			}];

			await Notification.insertMany(notifications);
			console.log(`✓ 알림 생성됨 (User1에게 전송)`);
		}

		// 3: 결과 확인
		const user1Notifications = await Notification.countDocuments({
			user_id: user1._id,
			type: 'list_festival_added'
		});
		console.log(`\n📊 User1이 받은 'list_festival_added' 알림: ${user1Notifications}개`);

		if (user1Notifications > 0) {
			const recentNotif = await Notification.findOne({
				user_id: user1._id,
				type: 'list_festival_added'
			}).sort({ created_at: -1 });
			console.log(`   최근: "${recentNotif.message}"`);
			console.log(`   읽음: ${recentNotif.isRead}`);
		}

		// ============ 프론트엔드 테스트 방법 ============
		console.log(`\n${'='.repeat(60)}`);
		console.log(`🌐 프론트엔드에서 확인하는 방법`);
		console.log(`${'='.repeat(60)}\n`);

		console.log(`1️⃣  User1(조현서) 호풤로 로그인됨:
   → /debug/notifications 방문
   → "🧪 테스트 시작" 클릭
   → ✅ "협력자 역할 리스트"는 없음 (소유자이므로)
   → ✅ "총 알림: ${user1Notifications}개" 표시됨\n`);

		console.log(`2️⃣  User2(김효일)로 로그인:
   → 프론트엔드 새로고침 또는 다시 로그인
   → /debug/notifications 방문
   → "🧪 테스트 시작" 클릭
   → ✅ "협력자 역할 리스트"에 리스트 표시됨 (Role: editor, Status: accepted)
   → ✅ "총 알림: ${user2Notifications}개" 표시됨\n`);

		console.log(`3️⃣  /notifications 페이지에서 확인:
   → 알림이 목록에 표시되어야 함
   → 배지 카운트가 업데이트되어야 함 (30초 주기)\n`);

		await mongoose.connection.close();
		console.log(`\n✓ 테스트 완료 및 연결 종료`);
	} catch (error) {
		console.error("❌ 오류:", error.message);
		process.exit(1);
	}
}

fullNotificationTest();
