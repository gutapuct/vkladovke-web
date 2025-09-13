import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDjRqjqWbtx_QIPsobH4J72jg98xNTt-BM",
    authDomain: "vkladovke-8254f.firebaseapp.com",
    projectId: "vkladovke-8254f",
    storageBucket: "vkladovke-8254f.firebasestorage.app",
    messagingSenderId: "441252569285",
    appId: "1:441252569285:web:585c9366e7506cf78890ac",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

export const getErrorMessage = (error) => {
    const errorMessages = {
        "auth/user-not-found": "Пользователь с таким email не найден",
        "auth/invalid-email": "Неверный формат email",
        "auth/missing-email": "Введите email",
        "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
        "auth/invalid-credential": "Неверный логин или пароль",
        "auth/email-already-in-use": "Пользователь с указанным email адресом уже существует",
        "auth/weak-password": "Слишком короткий пароль. Введите 6 символов или больше",
    };

    if (!errorMessages[error.code]) {
        console.log("error: ", error);
        console.log("error code: ", error.code);
        console.log("error message: ", error.message);
        return "Произошла ошибка. Попробуйте еще раз";
    }

    return errorMessages[error.code];
};
