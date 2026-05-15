export async function verifyTurnstile(token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("[turnstile] Missing TURNSTILE_SECRET_KEY. Skipping verification (Insecure).");
    return true; // Bỏ qua nếu chưa cấu hình (để dev không bị lỗi)
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body: formData,
      method: "POST",
    });

    const outcome = await result.json();
    return outcome.success;
  } catch (err) {
    console.error("[turnstile_verify_error]", err);
    return false;
  }
}
