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
		date_label: "2026년 7월",
		state: "기후현",
		city: "타카야마시",
		avg_rating: 4.8,
		review_count: 231,
		bookmark_count: 124
	},
	{
		name: "고잔 오쿠리비",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "교토",
		date_label: "매년 8월 16일",
		state: "교토부",
		city: "교토",
		avg_rating: 4.7,
		review_count: 198,
		bookmark_count: 210
	},
	{
		name: "후쿠오카 하카타 기온 야마카사",
		image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
		location: "후쿠오카현 구시다 신사",
		date_label: "매년 7월 1일~7월 15일",
		state: "후쿠오카현",
		city: "후쿠오카",
		avg_rating: 4.5,
		review_count: 345,
		bookmark_count: 450
	},
	{
		name: "나고야 봄 축제",
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
		location: "나고야현 나고야성",
		date_label: "2026년 3월 20일 ~ 4월 6일",
		state: "아이치현",
		city: "나고야",
		avg_rating: 4.2,
		review_count: 126,
		bookmark_count: 453
	}
];

module.exports = {
	bannerSlides,
	categories,
	cities,
	festivals
};
