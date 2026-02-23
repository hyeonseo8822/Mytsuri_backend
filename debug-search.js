const mongoose = require('mongoose');
const { Festival } = require('./models');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB 연결됨\n');

    // 1. 모든 고유한 type 값들
    const uniqueTypes = await Festival.distinct('type');
    console.log('===== 모든 type 필드 고유값 =====');
    uniqueTypes.sort().forEach(t => console.log(`"${t}"`));

    // 2. "여름"이 포함된 축제들의 type
    const summerfestivals = await Festival.find({ name: { $regex: '여름', $options: 'i' } }).limit(3).lean();
    console.log('\n===== "여름"이 포함된 축제들의 type =====');
    summerfestivals.forEach(f => {
      console.log(`${f.name}: type="${f.type}"`);
    });

    // 3. type 필터링 테스트 (예시: "여름 축제")
    const summerfestivalCount = await Festival.find({ type: '여름 축제' }).countDocuments();
    console.log(`\n===== type: "여름 축제" 검색 결과: ${summerfestivalCount}개 =====`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
})();
