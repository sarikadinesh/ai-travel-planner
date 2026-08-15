import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { INTERESTS, PACE, Trip, toPublicTrip } from "../models/Trip.js";
import { generateTripPlan } from "../services/generatePlan.js";

const router = Router();

function requireTraveler(req, res, next) {
  if (req.user.role !== "traveler") {
    return res.status(403).json({ ok: false, error: "Travelers only." });
  }
  next();
}

function parseTripBody(body) {
  const title = String(body?.title || "").trim();
  const destination = String(body?.destination || "").trim();
  const startDate = body?.startDate ? new Date(body.startDate) : null;
  const endDate = body?.endDate ? new Date(body.endDate) : null;
  const travelersCount = Number(body?.travelersCount);
  const budgetCap = Number(body?.budgetCap);
  const currency = String(body?.currency || "INR").trim().toUpperCase() || "INR";
  const pace = PACE.includes(body?.pace) ? body.pace : "balanced";
  const interests = Array.isArray(body?.interests)
    ? body.interests.filter((item) => INTERESTS.includes(item))
    : [];
  const preferredPlaces = String(body?.preferredPlaces || body?.mustSee || "").trim();
  const mustSee = preferredPlaces;
  const avoid = String(body?.avoid || "").trim();
  const diet = ["veg", "nonveg"].includes(body?.diet) ? body.diet : "veg";
  const otherPreferences = String(body?.otherPreferences || "").trim();
  const notes = String(body?.notes || "").trim();

  if (title.length < 2) return { error: "Give the trip a title." };
  if (destination.length < 2) return { error: "Enter a destination." };
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return { error: "Enter a valid start date." };
  }
  if (!endDate || Number.isNaN(endDate.getTime())) {
    return { error: "Enter a valid end date." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after the start date." };
  }
  if (!Number.isFinite(travelersCount) || travelersCount < 1) {
    return { error: "Travelers must be at least 1." };
  }
  if (!Number.isFinite(budgetCap) || budgetCap < 0) {
    return { error: "Enter a budget amount." };
  }

  return {
    data: {
      title,
      destination,
      startDate,
      endDate,
      travelersCount,
      budgetCap,
      currency,
      pace,
      interests,
      preferredPlaces,
      mustSee,
      avoid,
      diet,
      otherPreferences,
      notes,
    },
  };
}

router.use(requireAuth, requireTraveler);

router.get("/", async (req, res) => {
  const trips = await Trip.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ ok: true, trips: trips.map(toPublicTrip) });
});

router.post("/", async (req, res) => {
  const parsed = parseTripBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ ok: false, error: parsed.error });
  }

  const trip = await Trip.create({
    ...parsed.data,
    ownerId: req.user._id,
    status: "draft",
  });
  res.status(201).json({ ok: true, trip: toPublicTrip(trip) });
});

router.get("/:id", async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!trip) {
    return res.status(404).json({ ok: false, error: "Trip not found." });
  }
  res.json({ ok: true, trip: toPublicTrip(trip) });
});

router.post("/:id/generate", async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!trip) {
      return res.status(404).json({ ok: false, error: "Trip not found." });
    }

    const { coords, forecast, plan, source, llmError } = await generateTripPlan(trip);
    trip.coords = coords;
    trip.forecast = forecast;
    trip.plan = plan;
    trip.generationSource = source;
    trip.generationError = llmError || "";
    trip.generatedAt = new Date();
    trip.status = "generated";
    await trip.save();

    res.json({ ok: true, trip: toPublicTrip(trip) });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: err.message || "Could not generate itinerary.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const trip = await Trip.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user._id,
  });
  if (!trip) {
    return res.status(404).json({ ok: false, error: "Trip not found." });
  }
  res.json({ ok: true });
});

export default router;
