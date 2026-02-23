const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		google_id: { type: String, unique: true, sparse: true },
		nickname: { type: String, required: true },
		profile_img: { type: String },
		preference_tags: { type: [String], default: [] }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const festivalSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		image: { type: String },
		location: { type: String },
		type: { type: String },
		state: { type: String },
		city: { type: String },
		address: { type: String },
		official_site: { type: String },
		latitude: { type: Number },
		longitude: { type: Number },
		start_date: { type: Date },
		end_date: { type: Date },
		avg_rating: { type: Number, default: 0 },
		review_count: { type: Number, default: 0 },
		bookmark_count: { type: Number, default: 0 }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const bannerSlideSchema = new mongoose.Schema(
	{
		slide_id: { type: Number, required: true, unique: true },
		image: { type: String, required: true },
		title: { type: String, required: true },
		subtitle: { type: String, required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const categorySchema = new mongoose.Schema(
	{
		category_id: { type: String, required: true, unique: true },
		label: { type: String, required: true },
		icon: { type: String, required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const citySchema = new mongoose.Schema(
	{
		city_id: { type: String, required: true, unique: true },
		label: { type: String, required: true },
		image: { type: String, required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const mapFilterSchema = new mongoose.Schema(
	{
		filter_id: { type: String, required: true, unique: true },
		label: { type: String, required: true },
		icon: { type: String },
		active: { type: Boolean, default: false }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const reviewSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		festival_id: { type: mongoose.Schema.Types.ObjectId, ref: "Festival", required: true },
		rating: { type: Number, min: 1, max: 5, required: true },
		content: { type: String, required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const searchHistorySchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		query: { type: String, required: true },
		searched_at: { type: Date, default: Date.now }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

searchHistorySchema.index({ user_id: 1, searched_at: -1 });

const User = mongoose.model("User", userSchema);
const Festival = mongoose.model("Festival", festivalSchema);
const BannerSlide = mongoose.model("BannerSlide", bannerSlideSchema);
const Category = mongoose.model("Category", categorySchema);
const City = mongoose.model("City", citySchema);
const MapFilter = mongoose.model("MapFilter", mapFilterSchema);
const Review = mongoose.model("Review", reviewSchema);
const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);

module.exports = {
	User,
	Festival,
	BannerSlide,
	Category,
	City,
	MapFilter,
	Review,
	SearchHistory
};
