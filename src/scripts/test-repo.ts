import 'dotenv/config'
import { jobRepository } from '../repositories/jobRepository';

async function main() {
    console.log('Testing jobRepository...');
    try {
        const job = await jobRepository.getJob('job_001');
        console.log('Job Result:', job);
    } catch (e: unknown) {
        console.error('JobRepo Failure:', e);
        const err = e instanceof Error ? e : new Error(String(e));
        if ('code' in (e as Record<string, unknown>)) console.error('Code:', (e as Record<string, unknown>).code);
        console.error('Message:', err.message);
    }
}

main();
