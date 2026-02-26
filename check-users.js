require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({}, 'nickname email').lean();
  console.log('=== 등록된 사용자들 ===');
  users.forEach(u => console.log(`${u.nickname || '(이름없음)'} - ${u.email || '(이메일없음)'}`));
  process.exit();
}).catch(e => {
  console.error('에러:', e.message);
  process.exit(1);
});
