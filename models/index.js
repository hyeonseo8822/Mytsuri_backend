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

const festivalTagSchema = new mongoose.Schema(
	{
		festival_id: { type: mongoose.Schema.Types.ObjectId, ref: "Festival", required: true },
		tag_name: { type: String, required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

festivalTagSchema.index({ festival_id: 1, tag_name: 1 }, { unique: true });

const reviewPhotoSchema = new mongoose.Schema(
	{
		review_id: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
		photo_url: { type: String, required: true },
		sequence: { type: Number, default: 0 }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const listSchema = new mongoose.Schema(
	{
		owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		title: { type: String, required: true },
		bg_image: { type: String },
		is_public: { type: Boolean, default: false }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const listItemSchema = new mongoose.Schema(
	{
		list_id: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
		festival_id: { type: mongoose.Schema.Types.ObjectId, ref: "Festival", required: true }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

listItemSchema.index({ list_id: 1, festival_id: 1 }, { unique: true });

const listCollaboratorSchema = new mongoose.Schema(
	{
		list_id: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		joined_at: { type: Date, default: Date.now }
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

listCollaboratorSchema.index({ list_id: 1, user_id: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Festival = mongoose.model("Festival", festivalSchema);
const BannerSlide = mongoose.model("BannerSlide", bannerSlideSchema);
const Category = mongoose.model("Category", categorySchema);
const City = mongoose.model("City", citySchema);
const MapFilter = mongoose.model("MapFilter", mapFilterSchema);
const Review = mongoose.model("Review", reviewSchema);
const FestivalTag = mongoose.model("FestivalTag", festivalTagSchema);
const ReviewPhoto = mongoose.model("ReviewPhoto", reviewPhotoSchema);
const List = mongoose.model("List", listSchema);
const ListItem = mongoose.model("ListItem", listItemSchema);
const ListCollaborator = mongoose.model("ListCollaborator", listCollaboratorSchema);

module.exports = {
	User,
	Festival,
	BannerSlide,
	Category,
	City,
	MapFilter,
	Review,
	FestivalTag,
	ReviewPhoto,
	List,
	ListItem,
	ListCollaborator
};
