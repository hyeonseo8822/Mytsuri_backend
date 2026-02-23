const bannerSlides = [
	{
		slide_id: 1,
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
		title: "아오모리 네부타 제",
		subtitle: "동북 지방 대표 여름 축제"
	},
	{
		slide_id: 2,
		image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
		title: "교토 기온 마츠리",
		subtitle: "일본 3대 축제 중 하나"
	},
	{
		slide_id: 3,
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
		title: "나고야 축제",
		subtitle: "도시의 문화를 느껴보세요"
	},
	{
		slide_id: 4,
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
		title: "후쿠오카 하카타 기온",
		subtitle: "매년 7월 열리는 전통 축제"
	},
	{
		slide_id: 5,
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
		title: "센다이 다나바타",
		subtitle: "동북 3대 축제 중 하나"
	}
];

const categories = [
	{ category_id: "summer", label: "여름 축제", icon: "⛱️" },
	{ category_id: "winter", label: "겨울 축제", icon: "☃️" },
	{ category_id: "spring", label: "봄 축제", icon: "🌸" },
	{ category_id: "autumn", label: "가을 축제", icon: "🍂" },
	{ category_id: "food", label: "먹거리 축제", icon: "🍜" },
	{ category_id: "local", label: "특산물 축제", icon: "🍎" }
];

const cities = [
	{ city_id: "kyoto", label: "교토", image: "/assets/city/Kyoto.svg" },
	{ city_id: "osaka", label: "오사카", image: "/assets/city/Osaka.svg" },
	{ city_id: "nagoya", label: "나고야", image: "/assets/city/Nagoya.svg" },
	{ city_id: "tokyo", label: "도쿄", image: "/assets/city/Tokyo.svg" },
	{ city_id: "fukuoka", label: "후쿠오카", image: "/assets/city/Fukuoka.svg" }
];

const festivals = [
	{
		name: "타카야마 여름 축제",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "기후현 타카야마시",
		type: "여름축제",
		state: "기후현",
		city: "타카야마시",
		latitude: 36.146,
		longitude: 137.2522,
		start_date: "2026-07-01",
		end_date: "2026-07-31",
		official_site: "https://example.com/takayama",
		avg_rating: 4.8,
		review_count: 231,
		bookmark_count: 124
	},
	{
		name: "고잔 오쿠리비",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "교토",
		type: "여름축제",
		state: "교토부",
		city: "교토",
		latitude: 35.0116,
		longitude: 135.7681,
		start_date: "2026-08-16",
		end_date: "2026-08-20",
		official_site: "https://example.com/gozan",
		avg_rating: 4.7,
		review_count: 198,
		bookmark_count: 210
	},
	{
		name: "후쿠오카 하카타 기온 야마카사",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "후쿠오카현 구시다 신사",
		type: "여름축제",
		state: "후쿠오카현",
		city: "후쿠오카",
		latitude: 33.5904,
		longitude: 130.4017,
		start_date: "2026-07-01",
		end_date: "2026-07-15",
		official_site: "https://example.com/hakata",
		avg_rating: 4.5,
		review_count: 345,
		bookmark_count: 450
	},
	{
		name: "나고야 봄 축제",
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
		location: "나고야현 나고야성",
		type: "봄축제",
		state: "아이치현",
		city: "나고야",
		latitude: 35.1815,
		longitude: 136.9066,
		start_date: "2026-03-20",
		end_date: "2026-04-06",
		official_site: "https://example.com/nagoya",
		avg_rating: 4.2,
		review_count: 126,
		bookmark_count: 453
	},
	{
		name: "아사히카와 겨울 축제",
		image: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=400",
		location: "아사히카와 동물원",
		type: "겨울축제",
		state: "홋카이도",
		city: "아사히카와시",
		latitude: 43.7655,
		longitude: 142.3647,
		start_date: "2026-02-06",
		end_date: "2026-02-11",
		official_site: "https://example.com/asahikawa",
		avg_rating: 4.4,
		review_count: 151,
		bookmark_count: 102
	},
	{
		name: "삿포로 겨울 축제",
		image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
		location: "삿포로 역 앞 거리",
		type: "겨울축제",
		state: "홋카이도",
		city: "삿포로시",
		latitude: 43.0642,
		longitude: 141.3469,
		start_date: "2026-02-04",
		end_date: "2026-02-11",
		official_site: "https://example.com/sapporo",
		avg_rating: 4.8,
		review_count: 231,
		bookmark_count: 124
	},
	{
		name: "조잔케이 눈등로",
		image: "https://images.unsplash.com/photo-1512389142860-9c449e58a943?w=400",
		location: "삿포로 조잔케이신사",
		type: "겨울축제",
		state: "홋카이도",
		city: "삿포로시",
		latitude: 43.1100,
		longitude: 141.3628,
		start_date: "2026-01-27",
		end_date: "2026-02-03",
		official_site: "https://example.com/jozankei",
		avg_rating: 4.8,
		review_count: 231,
		bookmark_count: 124
	},
	{
		name: "유니시가와 온천 눈 축제",
		image: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400",
		location: "토치기현 유니시가와",
		type: "겨울축제",
		state: "토치기현",
		city: "유니시가와",
		latitude: 36.6739,
		longitude: 139.8889,
		start_date: "2026-01-01",
		end_date: "2026-02-28",
		official_site: "https://example.com/unishigawa",
		avg_rating: 4.6,
		review_count: 89,
		bookmark_count: 67
	},
	{
		name: "아오모리 네부타 제",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "아오모리현 아오모리시",
		type: "여름축제",
		state: "아오모리현",
		city: "아오모리시",
		latitude: 40.8221,
		longitude: 140.7474,
		start_date: "2026-08-02",
		end_date: "2026-08-07",
		official_site: "https://example.com/nebuta",
		avg_rating: 4.8,
		review_count: 312,
		bookmark_count: 280
	},
	{
		name: "교토 기온 마츠리",
		image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400",
		location: "교토부 교토시",
		type: "여름축제",
		state: "교토부",
		city: "교토",
		latitude: 35.0116,
		longitude: 135.7681,
		start_date: "2026-07-01",
		end_date: "2026-07-31",
		official_site: "https://example.com/gion",
		avg_rating: 4.9,
		review_count: 445,
		bookmark_count: 520
	},
	{
		name: "히타치 해변 공원 코스모스",
		image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
		location: "이바라키현 히타치시",
		type: "가을축제",
		state: "이바라키현",
		city: "히타치시",
		latitude: 36.3742,
		longitude: 140.6332,
		start_date: "2026-09-01",
		end_date: "2026-10-31",
		official_site: "https://example.com/hitachi",
		avg_rating: 4.6,
		review_count: 198,
		bookmark_count: 167
	},
	{
		name: "도쿄 라멘 쇼",
		image: "https://images.unsplash.com/photo-1569718212165-3a2854114a6e?w=400",
		location: "도쿄 국제전시장",
		type: "먹거리축제",
		state: "도쿄도",
		city: "도쿄",
		latitude: 35.6762,
		longitude: 139.7674,
		start_date: "2026-11-01",
		end_date: "2026-11-30",
		official_site: "https://example.com/ramen-show",
		avg_rating: 4.5,
		review_count: 234,
		bookmark_count: 189
	},
	{
		name: "야마가타 체리 축제",
		image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400",
		location: "야마가타현",
		type: "특산물축제",
		state: "야마가타현",
		city: "야마가타",
		latitude: 38.2425,
		longitude: 140.3633,
		start_date: "2026-06-01",
		end_date: "2026-06-30",
		official_site: "https://example.com/yamagata-cherry",
		avg_rating: 4.7,
		review_count: 156,
		bookmark_count: 98
	},
	{
		name: "오사카 덴진 마츠리",
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
		location: "오사카부 오사카시",
		type: "여름축제",
		state: "오사카부",
		city: "osaka",
		latitude: 34.7075,
		longitude: 135.5017,
		start_date: "2026-07-01",
		end_date: "2026-07-31",
		official_site: "https://example.com/tenjin",
		avg_rating: 4.7,
		review_count: 289,
		bookmark_count: 312
	}
];

const mapFilters = [
	{ filter_id: "all", label: "전체", active: true, icon: null },
	{ filter_id: "region", label: "지역", active: false, icon: "location" },
	{ filter_id: "date", label: "날짜", active: false, icon: "calendar" },
	{ filter_id: "type", label: "종류", active: false, icon: null }
];

const festivalMarkers = [
	{
		name: "기후 타카야마 축제",
		type: "여름축제",
		location: "기후현 타카야마시",
		longitude: 137.2522,
		latitude: 36.146,
		state: "기후현",
		city: "타카야마시",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		start_date: "2026-07-01",
		end_date: "2026-07-31",
		official_site: "https://example.com/takayama",
		avg_rating: 4.5,
		review_count: 98,
		bookmark_count: 56
	},
	{
		name: "교토 기온 마츠리",
		type: "여름축제",
		location: "교토부 교토시",
		longitude: 135.7681,
		latitude: 35.0116,
		state: "교토부",
		city: "교토시",
		image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400",
		start_date: "2026-07-01",
		end_date: "2026-07-31",
		official_site: "https://example.com/gion",
		avg_rating: 4.9,
		review_count: 412,
		bookmark_count: 357
	},
	{
		name: "아오모리 네부타",
		type: "여름축제",
		location: "아오모리현 아오모리시",
		longitude: 140.7474,
		latitude: 40.8221,
		state: "아오모리현",
		city: "아오모리시",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		start_date: "2026-08-02",
		end_date: "2026-08-07",
		official_site: "https://example.com/nebuta",
		avg_rating: 4.8,
		review_count: 287,
		bookmark_count: 245
	},
	{
		name: "센다이 다나바타",
		type: "여름축제",
		location: "미야기현 센다이시",
		longitude: 140.8694,
		latitude: 38.2688,
		state: "미야기현",
		city: "센다이시",
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
		start_date: "2026-08-06",
		end_date: "2026-08-08",
		official_site: "https://example.com/tanabata",
		avg_rating: 4.6,
		review_count: 176,
		bookmark_count: 134
	}
];

module.exports = {
	bannerSlides,
	categories,
	cities,
	festivals,
	mapFilters,
	festivalMarkers
};
