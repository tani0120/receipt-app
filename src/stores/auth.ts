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

    const login = (_email: string, _password: string): boolean => {
        // DEPRECATED: Hardcoded credentials removed for security
        // This function is deprecated. Use Firebase Authentication instead.
        // See: src/utils/auth.ts - signInWithEmail()
        console.warn('[auth.ts] Deprecated login function called. Use Firebase Authentication.');
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
