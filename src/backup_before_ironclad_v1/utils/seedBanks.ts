import { FirestoreRepository } from '../services/firestoreRepository';

export async function seedBanks() {
    const clientCode = 'AMT';
    console.log(`Seeding Bank/Card data for client ${clientCode}...`);

    // Seed Bank Account
    try {
        await FirestoreRepository.addBankAccount(clientCode, {
            bankName: '三菱UFJ銀行',
            branchName: '渋谷支店',
            accountNumber: '1234567',
            status: 'connected'
        });
        console.log('Bank Seeded.');
    } catch (e) {
        console.error('Failed to seed bank', e);
    }

    // Seed Credit Card
    try {
        await FirestoreRepository.addCreditCard(clientCode, {
            companyName: 'American Express',
            brand: 'Amex',
            last4Digits: '9001',
            status: 'connected'
        });
        console.log('Card Seeded.');
    } catch (e) {
        console.error('Failed to seed card', e);
    }

    alert('Bank/Card Seeding Complete!');
}
