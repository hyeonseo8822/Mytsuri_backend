const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const festivalRoutes = require("./routes/festivalRoutes");
const searchRoutes = require("./routes/searchRoutes");
const homeRoutes = require("./routes/homeRoutes");
const mapRoutes = require("./routes/mapRoutes");
const listRoutes = require("./routes/listRoutes");

// Models and Data
const { User, Festival, Review, BannerSlide, Category, City, MapFilter } = require("./models");
const { bannerSlides, categories, cities, festivals, mapFilters, festivalMarkers } = require("./data/data");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/lists", listRoutes);

// 404 Handler
app.use((req, res) => {
	res.status(404).json({ message: "Not Found" });
});

// Start Server
const startServer = async () => {
	try {
		if (!MONGO_URI) {
			throw new Error("MONGO_URI is not set");
		}

		await mongoose.connect(MONGO_URI);
		console.log("MongoDB connected");

		// Remove date_label field if exists
		await Festival.updateMany(
			{ date_label: { $exists: true } },
			{ $unset: { date_label: "" } }
		);

		// Seed Data
		const userCount = await User.countDocuments();
		const festivalCount = await Festival.countDocuments();
		const reviewCount = await Review.countDocuments();
		const bannerCount = await BannerSlide.countDocuments();
		const categoryCount = await Category.countDocuments();
		const cityCount = await City.countDocuments();
		const mapFilterCount = await MapFilter.countDocuments();

		if (userCount === 0) {
			await User.create({
				google_id: "demo-google-id",
				nickname: "축제매니아",
				profile_img: "https://example.com/profile.png",
				preference_tags: ["여름축제", "오사카"]
			});
		}

		const normalizedFestivals = festivals.map((festival) => ({
			...festival,
			view_count: festival.view_count ?? festival.bookmark_count ?? 0
		}));

		if (festivalCount === 0) {
			await Festival.insertMany(normalizedFestivals);
		} else {
			await Festival.bulkWrite(
				normalizedFestivals.map((festival) => ({
					updateOne: {
						filter: { name: festival.name },
						update: { $set: festival },
						upsert: true
					}
				}))
			);
		}

		if (bannerCount === 0) {
			await BannerSlide.insertMany(bannerSlides);
		} else {
			await BannerSlide.bulkWrite(
				bannerSlides.map((slide) => ({
					updateOne: {
						filter: { slide_id: slide.slide_id },
						update: { $set: slide },
						upsert: true
					}
				}))
			);
		}

		if (categoryCount === 0) {
			await Category.insertMany(categories);
		} else {
			await Category.bulkWrite(
				categories.map((category) => ({
					updateOne: {
						filter: { category_id: category.category_id },
						update: { $set: category },
						upsert: true
					}
				}))
			);
		}

		if (cityCount === 0) {
			await City.insertMany(cities);
		} else {
			await City.bulkWrite(
				cities.map((city) => ({
					updateOne: {
						filter: { city_id: city.city_id },
						update: { $set: city },
						upsert: true
					}
				}))
			);
		}

		if (mapFilterCount === 0) {
			await MapFilter.insertMany(mapFilters);
		} else {
			await MapFilter.bulkWrite(
				mapFilters.map((filter) => ({
					updateOne: {
						filter: { filter_id: filter.filter_id },
						update: { $set: filter },
						upsert: true
					}
				}))
			);
		}

		// Festival Markers
		await Festival.bulkWrite(
			festivalMarkers.map((marker) => ({
				updateOne: {
					filter: { name: marker.name, longitude: marker.longitude, latitude: marker.latitude },
					update: { $set: marker },
					upsert: true
				}
			}))
		);

		if (reviewCount === 0) {
			const user = await User.findOne();
			const festival = await Festival.findOne();

			if (user && festival) {
				await Review.create({
					user_id: user._id,
					festival_id: festival._id,
					rating: 5,
					content: "정말 최고의 축제였어요!"
				});
			}
		}

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();
