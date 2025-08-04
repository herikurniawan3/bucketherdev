import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default {
  async fetch(request, env) {
    // Pastikan ini adalah permintaan POST ke endpoint yang benar
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/upload") {
      return new Response("Not found", { status: 404 });
    }

    // Ambil nama file dan tipe konten dari permintaan
    const { fileName, contentType } = await request.json();
    if (!fileName || !contentType) {
      return new Response("Missing fileName or contentType", { status: 400 });
    }

    // Inisialisasi S3 Client untuk R2
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.97b44c6a133de44177c16a7c0f2b940d}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.a2919e86d1fe274e1eb16a7a16586ce0,
        secretAccessKey: env.0c32fe15810fee2973c36ff8076b5102e16101e3b16c882240e5a4e741bd2dd1,
      },
    });

    // Kunci unik untuk objek di bucket R2
    const key = `uploads/${Date.now()}-${fileName}`;

    // Buat perintah untuk meletakkan objek
    const command = new PutObjectCommand({
      Bucket: env.herideveloper,
      Key: key,
      ContentType: contentType,
    });

    // Buat pre-signed URL yang valid selama 5 menit
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Kembalikan URL tersebut ke frontend
    return new Response(JSON.stringify({ presignedUrl }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Sesuaikan untuk produksi
      },
    });
  },
};
