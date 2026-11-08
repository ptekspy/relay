"use server";

export async function submitFeedback(formData: FormData) {
  const message = formData.get("message");
  return { success: true, message: `Received: ${String(message)}` };
}
