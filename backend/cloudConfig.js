require('dotenv').config();
// Import the functions you need from the Firebase SDKs you need
const { initializeApp }=require("firebase/app");

const { getStorage, ref, uploadBytesResumable,getDownloadURL} = require("firebase/storage");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Storage
const storage = getStorage(app);

async function Upload(filebuffer,pathname){
  return new Promise((resolve,reject)=>{
    const storageRef = ref(storage,`${pathname}`);

    const metadata = {
      contentType: "application/json",
    };

    // Upload the file and metadata
    const uploadTask=uploadBytesResumable(storageRef, filebuffer, metadata);

    uploadTask.on(
      "state_changed", 
      null, // We don't need to handle the "progress" event for now
      (error) => {
        // Handle Upload error
        console.error("Error during Upload:", error);
        reject(error); // Reject if an error occurs
      },
      async () => {
        // This function runs when the Upload completes
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref); // Get the download URL after completion
          resolve(url); // Resolve the promise with the download URL
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(error); // Reject if URL fetch fails
        }
      }
    );
  });
}

module.exports={Upload};