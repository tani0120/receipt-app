
import { ref } from 'vue';

const currentUser = ref({
    name: '山田 太郎',
    email: 'taro.yamada@example.com'
});

const isEmergencyStopped = ref(false);

const toggleEmergencyStop = () => {
    isEmergencyStopped.value = !isEmergencyStopped.value;
};

export function useGlobalState() {
    return {
        currentUser,
        isEmergencyStopped,
        toggleEmergencyStop
    };
}
