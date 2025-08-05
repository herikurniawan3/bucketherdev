// Impor modul yang dibutuhkan dari URL
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner";

export default {
  async fetch(request, env) {
    // Hanya izinkan metode POST ke path /upload
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/upload") {
      return new Response("Not found", { status: 404 });
    }

    // Ambil nama file dan tipe konten dari frontend
    const { fileName, contentType } = await request.json();
    if (!fileName || !contentType) {
      return new Response("Missing fileName or contentType", { status: 400 });
    }

    // Inisialisasi S3 Client untuk R2
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.ACCESS_KEY_ID,
        secretAccessKey: env.SECRET_ACCESS_KEY,
      },
    });

    // Buat nama file yang unik
    const key = `uploads/${Date.now()}-${fileName}`;

    // Siapkan perintah untuk mengunggah
    const command = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Buat URL unggahan yang aman, valid selama 5 menit (300 detik)
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Kirim URL tersebut kembali ke frontend
    return new Response(JSON.stringify({ presignedUrl }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Izinkan akses dari domain mana pun
      },
    });
  },
};
