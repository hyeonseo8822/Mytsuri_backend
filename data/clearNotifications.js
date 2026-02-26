const mongoose = require("mongoose");
require("dotenv").config();

const { Notification } = require("../models");

async function clearNotifications() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB 연결 성공");

		const result = await Notification.deleteMany({});
		console.log(`알림 ${result.deletedCount}건 삭제 완료`);

		await mongoose.connection.close();
	} catch (error) {
		console.error("에러 발생:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

clearNotifications();
