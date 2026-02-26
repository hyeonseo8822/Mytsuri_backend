const mongoose = require("mongoose");
require("dotenv").config();

const { User } = require("../models");

async function checkUsers() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공\n");

		const users = await User.find().limit(10).lean();
		console.log(`총 ${users.length}명의 사용자가 있습니다.\n`);

		users.forEach((user, index) => {
			console.log(`${index + 1}. ID: ${user._id}`);
			console.log(`   닉네임: ${user.nickname || '없음'}`);
			console.log(`   이메일: ${user.email || '❌ 없음'}`);
			console.log(`   Google ID: ${user.google_id || '없음'}`);
			console.log("");
		});

		const usersWithoutEmail = users.filter(u => !u.email);
		if (usersWithoutEmail.length > 0) {
			console.log(`⚠️  경고: ${usersWithoutEmail.length}명의 사용자가 이메일이 없습니다.`);
			console.log("Google OAuth로 로그인하면 이메일이 자동으로 추가됩니다.\n");
		} else {
			console.log("✓ 모든 사용자가 이메일을 가지고 있습니다.\n");
		}

		await mongoose.connection.close();
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

checkUsers();
