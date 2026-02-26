const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		google_id: { type: String, unique: true, sparse: true },
		email: { type: String, unique: true, sparse: true },
		nickname: { type: String, required: true },
		profile_img: { type: String },
		name: { type: String },
		gender: { type: String },
		age: { type: String },
		survey: { type: [{ question: String, answer: String }], default: [] }
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
		bookmark_count: { type: Number, default: 0, index: true },
		view_count: { type: Number, default: 0 },
		review_count: { type: Number, default: 0 },
		avg_rating: { type: Number, default: 0 }
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
		content: { type: String, required: true },
		tags: { type: [String], default: [] },
		images: { type: [String], default: [] }
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

const listSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		name: { type: String, required: true },
		coverImage: { type: String },
		isPublic: { type: Boolean, default: true },
		festivals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Festival" }],
		collaborators: [{
			user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
			status: { type: String, enum: ['pending', 'accepted'], default: 'accepted' },
			invitedAt: { type: Date, default: Date.now }
		}]
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const notificationSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		type: { type: String, enum: ['list_invite', 'review_reply', 'system', 'festival_upcoming', 'list_festival_added', 'list_festival_removed'], default: 'list_invite' },
		title: { type: String, required: true },
		message: { type: String, required: true },
		data: { type: mongoose.Schema.Types.Mixed },
		isRead: { type: Boolean, default: false },
		actionUrl: { type: String }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const User = mongoose.model("User", userSchema);
const Festival = mongoose.model("Festival", festivalSchema);
const BannerSlide = mongoose.model("BannerSlide", bannerSlideSchema);
const Category = mongoose.model("Category", categorySchema);
const City = mongoose.model("City", citySchema);
const MapFilter = mongoose.model("MapFilter", mapFilterSchema);
const Review = mongoose.model("Review", reviewSchema);
const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);
const List = mongoose.model("List", listSchema);
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = {
	User,
	Festival,
	BannerSlide,
	Category,
	City,
	MapFilter,
	Review,
	SearchHistory,
	List,
	Notification
};
