import mongoose from "mongoose";

const PACE = ["relaxed", "balanced", "packed"];
const INTERESTS = [
  "food",
  "heritage",
  "nature",
  "nightlife",
  "shopping",
  "adventure",
  "wellness",
  "beaches",
];

const tripSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    travelersCount: { type: Number, required: true, min: 1, default: 1 },
    budgetCap: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true },
    pace: { type: String, enum: PACE, default: "balanced" },
    interests: [{ type: String }],
    preferredPlaces: { type: String, default: "", trim: true },
    mustSee: { type: String, default: "", trim: true },
    avoid: { type: String, default: "", trim: true },
    diet: {
      type: String,
      enum: ["veg", "nonveg"],
      default: "veg",
    },
    otherPreferences: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "generated"],
      default: "draft",
    },
    members: { type: Array, default: [] },
    coords: {
      lat: Number,
      lon: Number,
      label: String,
    },
    forecast: { type: Array, default: [] },
    plan: { type: mongoose.Schema.Types.Mixed, default: null },
    generationSource: { type: String, enum: ["llm", "fallback"], default: undefined },
    generationError: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export function toPublicTrip(trip) {
  return {
    id: trip._id.toString(),
    ownerId: trip.ownerId.toString(),
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelersCount: trip.travelersCount,
    budgetCap: trip.budgetCap,
    currency: trip.currency,
    pace: trip.pace,
    interests: trip.interests,
    preferredPlaces: trip.preferredPlaces || trip.mustSee || "",
    mustSee: trip.mustSee || trip.preferredPlaces || "",
    avoid: trip.avoid,
    diet: trip.diet || "veg",
    otherPreferences: trip.otherPreferences || "",
    notes: trip.notes,
    status: trip.status,
    coords: trip.coords || null,
    forecast: trip.forecast || [],
    plan: trip.plan || null,
    generationSource: trip.generationSource || null,
    generationError: trip.generationError || "",
    generatedAt: trip.generatedAt || null,
    createdAt: trip.createdAt,
  };
}

export const Trip = mongoose.model("Trip", tripSchema);
export { PACE, INTERESTS };
