// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL0M2rlUR3j8rYe2WEb03C7JQsEROy9oY",
  authDomain: "projet-60ca1.firebaseapp.com",
  projectId: "projet-60ca1",
  storageBucket: "projet-60ca1.firebasestorage.app",
  messagingSenderId: "891117021779",
  appId: "1:891117021779:web:f528b21e1a7c09255774a6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)

export async function uploadFile(file:File, setProgress?:(progress: number)=>void){
    return new Promise((resolve, reject)=>{
        try {
            const storageRef= ref(storage, file.name)
            const uploadTask= uploadBytesResumable(storageRef, file)

            uploadTask.on('state_changed',snapshot =>{
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (setProgress) setProgress(progress)
                switch (snapshot.state) {
                    case 'paused': console.log('Upload is paused'); break;
                    case 'running': console.log('Upload is running'); break;
                }



            }, error =>{
                reject(error)
            }, ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl=>{
                    resolve(downloadUrl)

                })
            })
        } catch (error) {
            console.error(error)
            reject(error)
        }
    })
}