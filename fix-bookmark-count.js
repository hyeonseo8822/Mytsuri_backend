require('dotenv').config();
const mongoose = require('mongoose');
const { Festival } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixBookmarkCount() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 연결 성공');

    // 음수 또는 null인 bookmark_count를 0으로 초기화
    const result = await Festival.updateMany(
      { $or: [
        { bookmark_count: { $lt: 0 } },
        { bookmark_count: null },
        { bookmark_count: { $exists: false } }
      ]},
      { $set: { bookmark_count: 0 } }
    );

    console.log(`수정된 축제 개수: ${result.modifiedCount}`);

    // 모든 축제의 실제 bookmark_count 재계산
    const { List } = require('./models');
    const allFestivals = await Festival.find().lean();
    
    console.log('실제 bookmark_count 재계산 중...');
    
    for (const festival of allFestivals) {
      // 이 축제가 몇 개의 리스트에 포함되어 있는지 확인
      const listsWithThisFestival = await List.countDocuments({
        festivals: festival._id
      });
      
      // 실제 개수로 업데이트
      await Festival.findByIdAndUpdate(festival._id, {
        bookmark_count: listsWithThisFestival
      });
      
      console.log(`축제 "${festival.name}": ${listsWithThisFestival}개 리스트에 포함`);
    }

    console.log('bookmark_count 재계산 완료!');
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

fixBookmarkCount();
