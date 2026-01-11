import 'dotenv/config'
import { jobRepository } from '../repositories/jobRepository';

async function main() {
    console.log('Testing jobRepository...');
    try {
        const job = await jobRepository.getJob('job_001');
        console.log('Job Result:', job);
    } catch (e: any) {
        console.error('JobRepo Failure:', e);
        if (e.code) console.error('Code:', e.code);
        if (e.message) console.error('Message:', e.message);
    }
}

main();
