import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default {
  async fetch(request, env) {
    // Pastikan ini hanya merespons permintaan POST
    if (request.method !== "POST") {
      return new Response("Metode tidak diizinkan", { status: 405 });
    }

    // Ambil nama file dari request body
    const { fileName, contentType } = await request.json();

    // Inisialisasi S3 client untuk R2
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID, // Simpan kredensial di Environment Variables Worker
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Buat perintah untuk pre-signed URL
    const command = new PutObjectCommand({
      Bucket: env.MY_BUCKET.bucketName, // env.MY_BUCKET didapat dari R2 Binding
      Key: fileName, // Nama file yang akan diunggah
      ContentType: contentType,
    });

    // Buat URL yang aman dan berlaku selama 10 menit
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

    // Kirim URL kembali ke frontend
    return new Response(JSON.stringify({ uploadUrl: signedUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
