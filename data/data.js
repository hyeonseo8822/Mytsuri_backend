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
