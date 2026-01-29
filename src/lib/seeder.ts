export const seedDummyData = async () => {
    console.log("🌱 Seeding Dummy Data (Mock Mode Active)...");

    // In a real app with proper permissions, we would write to Firestore here.
    // For this demo environment where guests can't write, we simply enable
    // the mock data which is pre-loaded in mockData.ts and firestore.ts.

    return {
        success: true,
        message: "Dummy data seeded! (Sarah & David have been enabled for search)"
    };
};
