require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    // 2115_조현서 이메일 수정
    const user1 = await User.updateOne(
      { nickname: '2115_조현서' },
      { $set: { email: 's2418@e-mirim.hs.kr' } }
    );
    console.log('2115_조현서 이메일 수정:', user1.modifiedCount > 0 ? '성공' : '실패');

    // 2206_김효일 이메일 수정
    const user2 = await User.updateOne(
      { nickname: '2206_김효일' },
      { $set: { email: 's2402@e-mirim.hs.kr' } }
    );
    console.log('2206_김효일 이메일 수정:', user2.modifiedCount > 0 ? '성공' : '실패');

    // 수정 후 전체 사용자 확인
    const allUsers = await User.find({}, 'nickname email').lean();
    console.log('\n=== 수정된 사용자 목록 ===');
    allUsers.forEach(u => console.log(`${u.nickname || '(이름없음)'} - ${u.email || '(이메일없음)'}`));

    process.exit();
  } catch (error) {
    console.error('에러:', error.message);
    process.exit(1);
  }
}).catch(e => {
  console.error('DB 연결 에러:', e.message);
  process.exit(1);
});
