// 리스트 조회
exports.getLists = async (req, res) => {
	res.status(200).json([{ listId: 1, title: "나의 일본 여행" }]);
};

// 리스트 생성
exports.createList = async (req, res) => {
	const { title, background, isPublic } = req.body;
	res.status(201).json({ message: "리스트 생성 완료", title, background, isPublic });
};

// 리스트 수정
exports.updateList = async (req, res) => {
	const { listId } = req.params;
	res.status(200).json({ message: "리스트 수정 완료", listId });
};

// 리스트에 축제 추가
exports.addFestivalToList = async (req, res) => {
	const { listId } = req.params;
	const { festivalId } = req.body;
	res.status(201).json({ message: "축제 추가 완료", listId, festivalId });
};

// 리스트에서 축제 제거
exports.removeFestivalFromList = async (req, res) => {
	const { listId, festivalId } = req.params;
	res.status(204).send();
};

// 리스트에 공동작업자 추가
exports.addCollaborator = async (req, res) => {
	const { listId } = req.params;
	const { email } = req.body;
	res.status(200).json({ message: "공동작업자 추가 완료", listId, email });
};

module.exports = exports;
