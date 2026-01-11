
import { getStorage } from 'firebase-admin/storage';

export class StorageService {
    private static BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || 'ai-accounting-app.appspot.com'; // Fallback for dev

    /**
     * Uploads a file buffer to GCS and returns the gs:// URI.
     * This URI is the canonical ID for the image in our system.
     */
    static async uploadImage(buffer: Buffer, path: string, mimeType: string): Promise<string> {
        const bucket = getStorage().bucket(this.BUCKET_NAME);
        const file = bucket.file(path);

        await file.save(buffer, {
            contentType: mimeType,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Construct gs:// URI
        // Format: gs://<bucket_name>/<file_path>
        return `gs://${this.BUCKET_NAME}/${path}`;
    }

    /**
     * Generates a signed URL for frontend display (Valid for 1 hour)
     */
    static async getSignedUrl(gcsUri: string): Promise<string> {
        // Parse gs:// uri
        // gs://bucket/path/to/file.jpg
        const match = gcsUri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (!match) {
            throw new Error(`Invalid GCS URI format: ${gcsUri}`);
        }

        const [, bucketName, filePath] = match;
        if (!bucketName || !filePath) throw new Error(`Invalid GCS URI (missing bucket/path): ${gcsUri}`);
        const bucket = getStorage().bucket(bucketName);
        const file = bucket.file(filePath);

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });

        return url;
    }
}
