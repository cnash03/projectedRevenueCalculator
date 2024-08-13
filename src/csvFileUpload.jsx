import Papa from 'papaparse';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
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
        } catch (error) {
          console.error("Error uploading to Firestore: ", error);
          console.error("Error details:", error.message, error.code);
          reject(error);
        }

        try{          
          const collectionRef = collection(db, "entries");
          const docRef = doc(collectionRef, collectionName); // Replace collectionName with the desired document name
          await setDoc(docRef, {
            collectionName
          });
          console.log('Document created successfully');
        }catch(error){
          console.error('Error creating document:', error);
        }
      },
      header: true,
      skipEmptyLines: false, // Changed to false to handle empty lines ourselves
    });
  });
};
export const fetchFirestoreData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "entries")); // Directly target the "Dates" collection
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id, // Extract the document ID
    }));
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching data from Firestore: ", error);
    throw error;
  }

};

export const fetchDateData = async (date) =>{
  const dataCollectionRef = collection(db, date);

  try {
    const querySnapshot = await getDocs(dataCollectionRef);
    const data = querySnapshot.docs.map(doc => 
      ({
        SubsName: doc.data()['Subs. Name'], // Assuming "Subs.Name" is stored with double underscores
        Revenue: doc.data().Revenue,
      }));
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
};