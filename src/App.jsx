import { useState, useEffect , useRef} from 'react';
import PooRoverLogo from './assets/PooRoverLogo.png';
import { parseAndUploadCSV, fetchFirestoreData } from './csvFileUpload';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';
import { firebaseConfig } from '../configFirebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);


class Data {
  constructor(date) {
    this.date = date;
  }
}

const initialData = [
  new Data("Live"),
];


function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [data, setData] = useState(initialData);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropdownRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv") {
        try {
          const newData = await parseAndUploadCSV(file);
          setData(prevData => [...prevData, ...newData]);
          setUploadedFile(file);
        } catch (error) {
          console.error("Error processing file:", error);
          alert("An error occurred while processing the file.");
        }
      } else {
        alert("Please upload a valid CSV file.");
      }
      e.dataTransfer.clearData();
    }
  };

// Helper function to reformat date
function reformatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const firestoreData = await fetchFirestoreData();
        const firestoreEntries = firestoreData.map(item => 
          new Data(reformatDate(item.id))
        );
        setData([...initialData, ...firestoreEntries]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    setSelectedFiles([]);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setIsUploading(true);
      try {
        const { data: newData, collectionName } = await parseAndUploadCSV(file);
        setUploadedFile(file);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("An error occurred while processing the file. " + error.message);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  function loadDashboard(dataItem) {
    if (selectedFiles.length === 0 || selectedFiles.includes(dataItem.date)) {
      return (
        <div key={dataItem.date} className="page-dashboard-outer-container">
          <h5 className='page-dashboard-outer-container-title'>
            <span>{dataItem.date}</span> 
            <span className='offset-color-text'> Upload</span>
          </h5>
        </div>
      );
    }
    return null;
  }

  const handleFileSelect = (date) => {
    setSelectedFiles(prev => {
      const newSelection = prev.includes(date)
        ? prev.filter(item => item !== date)
        : [...prev, date];
      
      // If no files are selected, show all dashboards
      if (newSelection.length === 0) {
        return [];
      }
      
      return newSelection;
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <div className='page-wrapper'>
        <div style={{ display: 'flex'}}>
          <img style={{height: 75, width: 48}} src={PooRoverLogo} alt="Poorover Logo"/>
          <h1 className='page-wrapper-name'>
            <span>Projected</span>
            <span className="offset-color-text">Revenue</span>
          </h1>
        </div>
      </div>
      <div className='page-content'>
        <div className='left-main-content'>
            {data.map(dataItem => loadDashboard(dataItem))}
        </div>
        <div className='right-main-content'>
        <div 
          className={`page-file-uploads-container ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <h1 className='page-file-upload-text'> Drop CSV file here to upload </h1>
          <h1 className='page-file-upload-text-bold'> or </h1>
          <label htmlFor="file-upload" className='page-file-upload-button'>
            Select a file
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept=".csv" 
            style={{display: 'none'}} 
            onChange={handleFileUpload}
          />
          {isUploading ? (
            <div className='page-file-upload-text-smaller'>
              File is uploading...
            </div>
          ) : uploadedFile ? (
            <p className='page-file-upload-text-smaller'>Uploaded: {uploadedFile.name}</p>
          ) : null}
        </div>
          <div className='page-file-compare-container'>
            <h1 className='page-file-upload-text'> Select uploads to</h1>
            <h1 className='page-file-upload-text-bold'> compare </h1>
            <div className="dropdown-wrapper" ref={dropdownRef}>
              <div className={`form_dropdown-toggle ${isDropdownOpen ? 'open' : ''}`} onClick={toggleDropdown}>
                <div className="dropdown-placeholder">
                  {selectedFiles.length > 0 ? selectedFiles.join(', ') : 'Select'}
                </div>
                <div className="dropdown-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 14 9" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img">
                    <path d="M7.15248 8.38905C7.20071 8.37427 7.25126 8.36416 7.29793 8.34472C7.4247 8.29183 7.44648 8.2615 7.5507 8.17594L13.7759 1.94997C13.8405 1.87141 13.9058 1.7913 13.9447 1.69797C14.0816 1.3682 13.9563 0.952098 13.6585 0.752991C13.4034 0.582662 13.0487 0.582662 12.7936 0.752991C12.7508 0.780991 12.715 0.817545 12.6754 0.849433L7.00004 6.52476L1.3255 0.849433L1.20728 0.752991C1.16217 0.728881 1.11939 0.700881 1.07273 0.681437C0.743734 0.544551 0.329965 0.665882 0.127747 0.967653C-0.0425824 1.22276 -0.0425824 1.57742 0.127747 1.83252C0.156524 1.87452 0.192301 1.91108 0.224967 1.94997L6.45017 8.17594C6.48983 8.20783 6.52561 8.24439 6.56839 8.27238C6.65316 8.32916 6.74805 8.36883 6.84838 8.38905C6.94793 8.40849 7.0506 8.39838 7.15248 8.38905Z" fill="currentColor"></path>
                  </svg>                
                </div>
              </div>
              {isDropdownOpen && (
                <div className="dropdown-list">
                  {data.map(item => (
                    <div 
                      key={item.date} 
                      className={`dropdown-item ${selectedFiles.includes(item.date) ? 'selected' : ''}`}
                      onClick={() => handleFileSelect(item.date)}
                    >
                      {item.date}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="page-hero-blue_wave-wrapper">
        <img src="https://assets-global.website-files.com/64682c1905f513eb22e9496e/646eda032fb4adbd057c8ffc_blue%20wave%202.svg" loading="lazy" alt="" className="page-hero-blue_wave"/>
      </div>
    </>
  )
}

export default App

