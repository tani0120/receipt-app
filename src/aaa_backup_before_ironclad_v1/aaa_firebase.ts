import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCCBUrcSHCe8xHoQ72-mZrKirUNNtIJk-w",
    authDomain: "sugu-suru.firebaseapp.com",
    projectId: "sugu-suru",
    storageBucket: "sugu-suru.firebasestorage.app",
    messagingSenderId: "985123156988",
    appId: "1:985123156988:web:773345e9af06678e16f879"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
