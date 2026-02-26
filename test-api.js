require("dotenv").config();
const http = require("http");

// User2 정보 (s2402@e-mirim.hs.kr)
const testUser = {
  email: "s2402@e-mirim.hs.kr",
  password: "test123"
};

let authToken = null;
let cookies = "";

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { "Cookie": cookies })
      }
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        // 쿠키 저장
        if (res.headers["set-cookie"]) {
          cookies = res.headers["set-cookie"]
            .map((c) => c.split(";")[0])
            .join("; ");
        }

        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testNotificationAPI() {
  try {
    console.log("🔐 1단계: 로그인\n");
    const loginRes = await request("POST", "/api/auth/login", testUser);
    console.log(`상태: ${loginRes.status}`);
    console.log(`응답:`, JSON.stringify(loginRes.body, null, 2));

    if (loginRes.status !== 200) {
      console.error("❌ 로그인 실패");
      process.exit(1);
    }

    authToken = loginRes.body.token;
    console.log(`✓ 토큰 획득: ${authToken?.substring(0, 50)}...`);
    console.log(`✓ 쿠키: ${cookies}\n`);

    // 2단계: 알림 조회
    console.log("📬 2단계: 알림 조회\n");
    const notificationsRes = await request("GET", "/api/notifications");
    console.log(`상태: ${notificationsRes.status}`);
    if (Array.isArray(notificationsRes.body)) {
      console.log(`알림 개수: ${notificationsRes.body.length}개`);
      console.log("알림 목록:");
      for (const notif of notificationsRes.body) {
        console.log(`  • [${notif.type}] ${notif.message}`);
        console.log(`    ID: ${notif._id}`);
        console.log(`    IsRead: ${notif.isRead}`);
      }
    } else {
      console.error("❌ 응답이 배열이 아닙니다:");
      console.log(JSON.stringify(notificationsRes.body, null, 2));
    }

    // 3단계: 읽지 않은 알림 개수
    console.log("\n📊 3단계: 읽지 않은 알림 개수\n");
    const unreadRes = await request("GET", "/api/notifications/unread-count");
    console.log(`상태: ${unreadRes.status}`);
    console.log(`응답:`, JSON.stringify(unreadRes.body, null, 2));

  } catch (error) {
    console.error("❌ 오류:", error);
    process.exit(1);
  }
}

testNotificationAPI();
