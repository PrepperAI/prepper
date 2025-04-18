import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Initialize Admin SDK
initializeApp();
const db = getFirestore();

// ⏰ Run on the 1st of every month at 2:00 AM UTC
export const resetInterviewAttempts = onSchedule(
    {
      schedule: "0 2 1 * *", // Cron format: min hr day month weekday
      timeZone: "Etc/UTC", // Ensures UTC time zone for consistent timing
    },
    async () => {
      console.log("🔄 Starting monthly reset of remainingAttempts...");

      try {
        const snapshot = await db.collection("users").get();
        const now = new Date().toISOString();
        let resetCount = 0;

        for (const doc of snapshot.docs) {
          const user = doc.data();
          const userRef = doc.ref;

          if (!user.isPremium) {
            await userRef.update({
              remainingAttempts: {
                behavioral: 5,
                technical: 3,
                systemDesign: 2,
              },
              last_reset_at: now,
            });

            console.log(`✅ Reset for user: ${user.email || doc.id}`);
            resetCount++;
          }
        }

        console.log(`🎉 Reset completed for ${resetCount} user(s).`);
      } catch (error) {
        console.error("❌ Error during reset:", error);
      }
    },
);
