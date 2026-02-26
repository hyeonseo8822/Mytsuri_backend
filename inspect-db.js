require("dotenv").config();
const mongoose = require("mongoose");
const { User, List, Notification } = require("./models");

async function inspectDatabase() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("✓ MongoDB 연결됨\n");

		// 모든 사용자 조회
		const allUsers = await User.find().select('_id email nickname').lean();
		console.log(`📌 모든 사용자 (${allUsers.length}명):\n`);
		for (let i = 0; i < allUsers.length; i++) {
			console.log(`  ${i + 1}. ID: ${allUsers[i]._id}`);
			console.log(`     이메일: ${allUsers[i].email}`);
			console.log(`     닉네임: ${allUsers[i].nickname}\n`);
		}

		// 모든 리스트와 협력자 조회
		const allLists = await List.find()
			.populate('user_id', 'email nickname')
			.lean();

		console.log(`\n📋 모든 리스트 (${allLists.length}개):\n`);
		for (const list of allLists) {
			console.log(`  리스트: ${list.name}`);
			console.log(`  소유자: ${list.user_id.nickname} (${list.user_id.email})`);
			const collaborators = list.collaborators || [];
			console.log(`  협력자 수: ${collaborators.length}`);
			for (const col of collaborators) {
				const colUser = allUsers.find(u => u._id.toString() === col.user_id.toString());
				console.log(`    • ${colUser?.nickname || col.user_id} - Role: ${col.role}, Status: ${col.status}`);
			}
			console.log();
		}

		// 각 사용자별 알림 통계
		console.log(`\n📊 사용자별 알림 통계:\n`);
		for (const user of allUsers) {
			const totalNotif = await Notification.countDocuments({ user_id: user._id });
			const unreadNotif = await Notification.countDocuments({ user_id: user._id, isRead: false });
			const listFestivalAdded = await Notification.countDocuments({
				user_id: user._id,
				type: 'list_festival_added'
			});

			console.log(`  ${user.nickname} (${user.email})`);
			console.log(`    총 알림: ${totalNotif}개`);
			console.log(`    읽지 않은: ${unreadNotif}개`);
			console.log(`    list_festival_added: ${listFestivalAdded}개\n`);
		}

		await mongoose.connection.close();
		console.log(`✓ 연결 종료`);
	} catch (error) {
		console.error("❌ 오류:", error.message);
		process.exit(1);
	}
}

inspectDatabase();
