import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("firebaseUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        localStorage.removeItem("firebaseUser");
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            isPremium: false,
            planType: "free",
            createdAt: new Date().toISOString(),
            remainingAttempts: {
              behavioral: 3,
              technical: 1,
              systemDesign: 1,
            },
            last_reset_at: new Date().toISOString(), // 👈 ADD THIS LINE HERE
          });
          console.log("✅ Firestore user doc created!");
        } else {
          const existingData = userSnap.data();

          // Add remainingAttempts for older free users if missing
          if (
            existingData.planType === "free" &&
            !existingData.remainingAttempts
          ) {
            await updateDoc(userRef, {
              remainingAttempts: {
                behavioral: 3,
                technical: 1,
                systemDesign: 1,
              },
            });
            console.log("🛠️ Added remainingAttempts to existing free user.");
          }
        }

        // Fetch latest and merge with auth data
        const updatedSnap = await getDoc(userRef);
        const firestoreData = updatedSnap.data();
        const mergedUser = {
          ...firebaseUser,
          ...firestoreData,
        };

        setUser(mergedUser);
        localStorage.setItem("firebaseUser", JSON.stringify(mergedUser));
      } catch (err) {
        console.error("❌ Firestore error:", err);
        setUser(firebaseUser); // fallback to auth user only
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
