require("dotenv").config();
const mongoose = require("mongoose");
const { User, List, Notification, Festival } = require("./models");

async function testUser3Notifications() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("✓ MongoDB 연결됨\n");

		// User3 찾기 (s2418@e-mirim.hs.kr)
		const user3 = await User.findOne({ email: "s2418@e-mirim.hs.kr" });
		if (!user3) {
			console.error("❌ User3를 찾을 수 없습니다");
			process.exit(1);
		}

		// User1 찾기 (소유자)
		const user1 = await User.findOne({ email: "hyeonseojo929@gmail.com" });

		console.log(`👤 테스트 계정:`);
		console.log(`  User1(소유자): ${user1._id} - ${user1.nickname}`);
		console.log(`  User3(협력자): ${user3._id} - ${user3.nickname}\n`);

		// User3이 협력자로 있는 리스트 찾기
		const userList = await List.findOne({
			"collaborators.user_id": user3._id
		}).populate('user_id', 'nickname');

		if (!userList) {
			console.error("❌ User3이 협력자로 있는 리스트를 찾을 수 없습니다");
			process.exit(1);
		}

		console.log(`📋 협력자로 있는 리스트: ${userList.name}`);
		console.log(`   소유자: ${userList.user_id.nickname}`);
		console.log(`   현재 축제 개수: ${userList.festivals.length}개\n`);

		// 축제 찾기
		let festival = await Festival.findOne();
		if (!festival) {
			console.error("❌ 축제를 찾을 수 없습니다");
			process.exit(1);
		}

		// 축제가 이미 리스트에 있는지 확인
		const existingFestival = userList.festivals.find(f => f.toString() === festival._id.toString());

		if (existingFestival) {
			console.log(`⚠️  축제 "${festival.name}"이 이미 리스트에 있습니다. 다른 축제로 시도합니다.\n`);
			// 다른 축제 찾기
			const otherFestival = await Festival.findOne({ _id: { $ne: festival._id } });
			if (otherFestival && !userList.festivals.find(f => f.toString() === otherFestival._id.toString())) {
				festival = otherFestival;
				console.log(`✓ 다른 축제 사용: ${festival.name}\n`);
			}
		}

		// ============ 축제 추가 시뮬레이션 ============
		console.log(`${'='.repeat(60)}`);
		console.log(`➕ User1이 "${festival.name}"을 리스트에 추가합니다`);
		console.log(`${'='.repeat(60)}\n`);

		// 축제 추가
		if (!userList.festivals.find(f => f.toString() === festival._id.toString())) {
			userList.festivals.push(festival._id);
			await userList.save();
			console.log(`✓ 축제 추가 완료`);
		}

		// 알림 생성 (addFestivalToList 로직 재현)
		const adderName = user1.nickname || "친구";
		const notificationTargets = [];

		// User3 (협력자)에게 알림 전송 (본인 제외)
		const col = userList.collaborators.find(c => c.user_id.toString() === user3._id.toString());
		if (col && col.status === 'accepted') {
			notificationTargets.push({ user_id: user3._id });
			console.log(`✓ User3(협력자)를 알림 대상에 추가`);
		}

		if (notificationTargets.length > 0) {
			const newNotifications = notificationTargets.map(target => ({
				user_id: target.user_id,
				type: 'list_festival_added',
				title: userList.name,
				message: `${adderName}님이 "${festival.name}"을(를) 추가했어요`,
				data: {
					listId: userList._id,
					festivalId: festival._id,
					festivalName: festival.name,
					adderName
				},
				actionUrl: `/list/${userList._id}`,
				isRead: false
			}));

			const result = await Notification.insertMany(newNotifications);
			console.log(`✓ 알림 생성: ${result.length}개`);
		}

		// ============ 결과 확인 ============
		console.log(`\n${'='.repeat(60)}`);
		console.log(`📊 최종 결과`);
		console.log(`${'='.repeat(60)}\n`);

		const user3Notifis = await Notification.find({ user_id: user3._id })
			.sort({ created_at: -1 })
			.limit(5);

		console.log(`User3의 총 알림: ${user3Notifis.length}개\n`);

		for (const notif of user3Notifis) {
			const isRecent = notif.created_at > new Date(Date.now() - 60000) ? "🔴" : "⚪";
			console.log(`${isRecent} [${notif.type}] ${notif.message}`);
			console.log(`   읽음: ${notif.isRead}`);
			console.log();
		}

		// ============ 프론트엔드 테스트 방법 ============
		console.log(`${'='.repeat(60)}`);
		console.log(`🌐 프론트엔드에서 확인하는 방법`);
		console.log(`${'='.repeat(60)}\n`);

		console.log(`1. 브라우저 새로고침 (Ctrl+R 또는 Cmd+R)`);
		console.log(`2. http://localhost:5173/debug/notifications 페이지 방문`);
		console.log(`3. "🧪 테스트 시작" 버튼 클릭`);
		console.log(`4. 다음을 확인:`);
		console.log(`   ✅ 현재 사용자: 2115_조현서 (s2418@e-mirim.hs.kr)`);
		console.log(`   ✅ 협력자 역할 리스트: 1개 (친구랑 공유하는 리스트)`);
		console.log(`   ✅ 총 알림: ${user3Notifis.length}개 (list_festival_added)`);
		console.log(`\n5. http://localhost:5173/notifications 페이지 방문`);
		console.log(`   ✅ 알림이 목록에 표시되어야 함`);
		console.log(`   ✅ 홈/지도 페이지의 배지가 업데이트되어야 함 (30초 후)`);

		await mongoose.connection.close();
		console.log(`\n✓ 테스트 완료 및 연결 종료`);
	} catch (error) {
		console.error("❌ 오류:", error.message);
		console.error(error);
		process.exit(1);
	}
}

testUser3Notifications();
