import Papa from 'papaparse';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../configFirebase'; // Adjust the path as needed

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
            console.log("Uploading"+item);
            await addDoc(collection(db, collectionName), {
              date: item.date,
              ...item
            });
          }
          console.log(`Data uploaded to Firestore successfully. ${newData.length} entries processed.`);
          resolve(newData);
        } catch (error) {
          console.error("Error uploading to Firestore: ", error);
          console.error("Error details:", error.message, error.code);
          reject(error);
        }
      },
      header: true,
      skipEmptyLines: false, // Changed to false to handle empty lines ourselves
    });
  });
};

// export const fetchFirestoreData = async () => {
//   try {
//     const querySnapshot = await getDocs(collection(db, "customers"));
//     return querySnapshot.docs.map(doc => new Data(doc.data().date, doc.data()));
//   } catch (error) {
//     console.error("Error fetching data from Firestore: ", error);
//     throw error;
//   }
// };