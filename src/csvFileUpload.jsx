import Papa from 'papaparse';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD7lX_TKGZ5Zw_ZfN9NBwrrf04ysu5sa9U",
    authDomain: "projected-revenue-calculator.firebaseapp.com",
    databaseURL: "https://projected-revenue-calculator-default-rtdb.firebaseio.com",
    projectId: "projected-revenue-calculator",
    storageBucket: "projected-revenue-calculator.appspot.com",
    messagingSenderId: "124990878788",
    appId: "1:124990878788:web:b7ea8987b6c9853deaf811",
    measurementId: "G-38L1KN7DCK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class Data {
  constructor(date, properties) {
    this.date = date;
    Object.assign(this, properties);
  }
}

export const parseAndUploadCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: async (results) => {
        console.log("Parsed CSV data:", results.data);
        
        const newData = [];
        let stopUpload = false;

        // Generate the collection name based on the current date
        const uploadDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const collectionName = `${uploadDate}`;

        for (let row of results.data) {
          // Check if all entries in the row are empty
          if (Object.values(row).every(value => value === "")) {
            console.log("Encountered a blank line. Stopping upload.");
            stopUpload = true;
            break;
          }

          const date = row[Object.keys(row)[0]]; // Assuming the first column is the date
          delete row[Object.keys(row)[0]];
          newData.push(new Data(date, row));
        }


        if (newData.length === 0) {
          reject(new Error("No valid data found in CSV"));
          return;
        }
  
        try {
          for (let item of newData) {
            await addDoc(collection(db, "2024-02-18"), {
              date: item.date,
              ...item
            });
          }
          console.log(`Data uploaded to Firestore successfully. ${newData.length} entries processed.`);
          resolve(newData);
        } catch (error) {
          console.error("Error uploading to Firestore: ", error);
          reject(error);
        }
      },
      header: true,
      skipEmptyLines: false, // Changed to false to handle empty lines ourselves
    });
  });
};

export const fetchFirestoreData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "customers"));
    return querySnapshot.docs.map(doc => new Data(doc.data().date, doc.data()));
  } catch (error) {
    console.error("Error fetching data from Firestore: ", error);
    throw error;
  }
};