const { MapFilter, Festival } = require("../models");

// 맵 필터 조회
exports.getFilters = async (req, res) => {
	const filters = await MapFilter.find().sort({ filter_id: 1 }).lean();
	res.status(200).json(filters.map((filter) => ({
		id: filter.filter_id,
		label: filter.label,
		icon: filter.icon,
		active: filter.active
	})));
};

// 맵 마커 조회 (마커 데이터)
exports.getMarkers = async (req, res) => {
	const { prefecture, date, startDate, endDate, type } = req.query;
	const filter = { longitude: { $exists: true }, latitude: { $exists: true } };

	if (prefecture) {
		filter.state = prefecture;
	}

	// 날짜 범위 필터 (startDate, endDate 우선)
	if (startDate && endDate) {
		const parsedStart = new Date(startDate);
		const parsedEnd = new Date(endDate);
		if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
			return res.status(400).json({ error: "startDate and endDate must be valid ISO dates" });
		}
		filter.start_date = { $lte: parsedEnd };
		filter.end_date = { $gte: parsedStart };
	} else if (date) {
		const parsedDate = new Date(date);
		if (Number.isNaN(parsedDate.getTime())) {
			return res.status(400).json({ error: "date must be a valid ISO date (YYYY-MM-DD)" });
		}
		filter.start_date = { $lte: parsedDate };
		filter.end_date = { $gte: parsedDate };
	}

	if (type) {
		filter.type = type;
	}

	try {
		const markers = await Festival.find(filter).lean();
		res.status(200).json(markers.map((marker) => ({
			id: marker._id,
			name: marker.name,
			startDate: marker.start_date,
			endDate: marker.end_date,
			location: marker.location || `${marker.state || ""} ${marker.city || ""}`.trim(),
			lon: marker.longitude,
			lat: marker.latitude
		})));
	} catch (error) {
		res.status(500).json({ error: "마커 데이터 조회 실패" });
	}
};

module.exports = exports;
