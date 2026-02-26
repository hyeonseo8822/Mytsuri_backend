const mongoose = require("mongoose");
require("dotenv").config();

const { User } = require("../models");

async function addEmailToUsers() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공\n");

		const users = await User.find();
		console.log(`총 ${users.length}명의 사용자를 찾았습니다.\n`);

		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			
			if (!user.email) {
				// 닉네임을 기반으로 이메일 생성
				const emailName = user.nickname
					.replace(/[^a-zA-Z0-9가-힣]/g, '')
					.toLowerCase();
				const email = `${emailName}${i + 1}@test.com`;
				
				user.email = email;
				await user.save();
				
				console.log(`✓ ${user.nickname}에게 이메일 추가: ${email}`);
			} else {
				console.log(`- ${user.nickname}는 이미 이메일이 있습니다: ${user.email}`);
			}
		}

		console.log("\n이메일 추가 완료!");
		await mongoose.connection.close();
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

addEmailToUsers();
