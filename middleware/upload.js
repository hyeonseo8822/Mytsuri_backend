const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads/profiles 폴더가 없으면 생성
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// 저장 설정
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// 파일명: userId_timestamp.확장자
		const userId = req.user?.id || 'guest';
		const timestamp = Date.now();
		const ext = path.extname(file.originalname);
		cb(null, `${userId}_${timestamp}${ext}`);
	}
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = allowedTypes.test(file.mimetype);
	
	if (extname && mimetype) {
		cb(null, true);
	} else {
		cb(new Error('이미지 파일만 업로드 가능합니다'));
	}
};

// multer 인스턴스
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
	fileFilter
});

module.exports = upload;
