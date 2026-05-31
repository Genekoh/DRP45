import { findNearbyPlaceByName, textSearchPlace } from "../lib/geocoding";
import { Space, upsertSpace, updateCrowdness } from "../lib/supabase";

/**
 * Migration script: Add Google Place IDs to existing spaces
 * Run this once to populate your spaces table with Place IDs
 */

const SPACES_TO_MIGRATE = [
  {
    id: "1",
    name: "Starbucks",
    address: "South Kensington, SW7 4PL",
    openingHrs: "6:30 - 21:00",
    safetyLevel: 3,
    features: ["Free WiFi", "Charging ports", "Food available"],
    tags: ["charging", "free", "food available"],
    distance: 0.3,
    latitude: 51.4941,
    longitude: -0.1738,
  },
  {
    id: "2",
    name: "Kensington Central Library",
    address: "Phillimore Walk, W8 7RX",
    openingHrs: "9:00 - 20:00",
    safetyLevel: 5,
    features: ["Quiet zone", "Free", "Laptop friendly"],
    tags: ["quiet", "free", "laptop"],
    distance: 0.8,
    latitude: 51.5012,
    longitude: -0.1932,
  },
  {
    id: "3",
    name: "Paris Baguette",
    address: "Kensington High St, W8 6SU",
    openingHrs: "7:30 - 21:00",
    safetyLevel: 3,
    features: ["Food available", "AC", "Laptop friendly"],
    tags: ["food available", "AC", "laptop"],
    distance: 1.0,
    latitude: 51.5008,
    longitude: -0.1918,
  },
];

export async function migrateSpacesToSupabase() {
  console.log("🔄 Starting space migration to Supabase...");

  for (const space of SPACES_TO_MIGRATE) {
    try {
      console.log(`\n📍 Processing: ${space.name}`);

      // Try to find place by nearby search (more accurate for specific venues)
      let placeResult = await findNearbyPlaceByName(
        space.latitude,
        space.longitude,
        space.name,
        200, // Search within 200m
      );

      // Fallback to text search if nearby search didn't work
      if (!placeResult) {
        console.log(`  ⏳ Trying text search for "${space.name}"`);
        placeResult = await textSearchPlace(`${space.name} ${space.address}`);
      }

      if (!placeResult) {
        console.warn(`  ❌ Could not find Place ID for ${space.name}`);
        continue;
      }

      console.log(`  ✅ Found Place ID: ${placeResult.placeId}`);

      // Prepare space object for Supabase
      const spaceForDB: Space = {
        id: space.id,
        name: space.name,
        address: space.address,
        latitude: space.latitude,
        longitude: space.longitude,
        opening_hrs: space.openingHrs,
        safety_level: space.safetyLevel,
        features: space.features,
        tags: space.tags,
        google_place_id: placeResult.placeId,
      };

      // Upsert to Supabase
      await upsertSpace(spaceForDB);
      await updateCrowdness(space.id, "none");
      console.log(`  💾 Saved to Supabase`);
    } catch (error) {
      console.error(`  ❌ Error processing ${space.name}:`, error);
    }
  }

  console.log("\n✨ Migration complete!");
}

// Call this in your app initialization or a dev menu
if (process.env.NODE_ENV === "development") {
  // Uncomment to run migration:
  // migrateSpacesToSupabase().catch(console.error);
}
migrateSpacesToSupabase().catch(console.error);
