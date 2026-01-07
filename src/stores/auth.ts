import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const isLoggedIn = ref(false);
    const userEmail = ref<string | null>(null);

    // Initialize from localStorage
    const storedAuth = localStorage.getItem('isLoggedIn');
    if (storedAuth === 'true') {
        isLoggedIn.value = true;
        userEmail.value = localStorage.getItem('userEmail');
    }

    const login = (email: string, password: string): boolean => {
        // Simple hardcoded check for emergency security
        if (email === 'admin@sugu-suru.com' && password === 'pass1234') {
            isLoggedIn.value = true;
            userEmail.value = email;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            return true;
        }
        return false;
    };

    const logout = () => {
        isLoggedIn.value = false;
        userEmail.value = null;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        router.push('/login');
    };

    return {
        isLoggedIn,
        userEmail,
        login,
        logout
    };
});
