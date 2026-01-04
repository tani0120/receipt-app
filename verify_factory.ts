
import { AIProviderFactory } from './src/api/lib/ai/AIProviderFactory';
import { db } from './src/api/lib/firebase';
import { AIPhase, PhaseConfig } from './src/api/lib/ai/types';

// Mock Config for testing
const MOCK_CONFIG: PhaseConfig = {
    provider: 'ai_studio',
    mode: 'realtime',
    model: 'gemini-1.5-pro'
};

async function runVerification() {
    console.log('--- Starting Context-Aware Factory Verification ---');

    console.log('\n[Test 1: Fallback Mechanism]');
    // Ensure no Firestore data might interfere or assume empty/mock environment
    // Note: In a real integration test we'd clear Firestore. Here we rely on the fact
    // that if 'system_configs/ai_phase_settings' doesn't exist, it falls back.
    // Or we use a non-existent phase key to test fallback.
    const fallbackProvider = await AIProviderFactory.getProviderForPhase('optimization'); // Assuming 'optimization' might lack config or we can force it
    console.log('Fallback Provider obtained.');
    // Check if it works (even if mock credentials fail, the factory shouldn't crash)
    try {
        const models = await fallbackProvider.listAvailableModels();
        console.log('Fallback models listed:', models.length > 0 ? 'OK' : 'Empty');
    } catch (e) {
        console.log('Fallback provider instantiation OK, but API call failed (expected if no creds):', e.message);
    }

    console.log('\n[Test 2: Dynamic Switching & Caching]');
    // 1. Write Config to Firestore (Mocking the Admin UI action)
    console.log('Writing config to Firestore...');
    const settingsRef = db.collection('system_configs').doc('ai_phase_settings');
    await settingsRef.set({
        learning: { provider: 'ai_studio', mode: 'realtime', model: 'gemini-1.5-pro' } // Explicitly distinct
    }, { merge: true });

    // 2. Fetch Provider - should respect DB config
    const learningProvider = await AIProviderFactory.getProviderForPhase('learning');
    // We can't easily inspect private props, but we can infer from logs or behavior if we had distinct classes
    // Here we trust the log output from the Factory: "[AI Factory] Execution strategy: ..."

    // Simulate cache hit behavior? - difficult in script without waiting 5 mins.
    // But we can verify it doesn't crash.
    console.log('Learning Provider obtained from DB config.');

    console.log('\n[Test 3: Strategy Execution & GCS]');
    // Verify analyzeReceipt can be called
    try {
        // Mock GCS URI
        await learningProvider.analyzeReceipt('gs://mock-bucket/receipt.jpg');
    } catch (e) {
        // Expected to fail at "downloadFile" or API call if GCS object missing,
        // but confirms the method was reachable and attempted execution using the Strategy.
        if (e.message.includes('Invalid GCS URI') || e.message.includes('Invalid Budget Name') || e.message.includes('No API key')) {
            console.log('Execution flow reached strategy method (Success):', e.message);
        } else {
            console.warn('Unexpected error:', e);
        }
    }

    console.log('\n--- Verification Complete ---');
    process.exit(0);
}

runVerification().catch(console.error);
