const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }
  } catch {
    return jsonResponse({ ok: false, error: "Invalid submission." }, 400);
  }

  // Honeypot field — real users never fill this in.
  if (data.website) {
    return jsonResponse({ ok: true }, 200);
  }

  const email = String(data.email || "").trim();
  if (!email || !EMAIL_RE.test(email)) {
    return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const firstName = String(data.firstName || "").trim();

  if (!env.MAILERLITE_API_KEY) {
    console.error("MAILERLITE_API_KEY is not configured");
    return jsonResponse({ ok: false, error: "Signup isn't available right now. Please try again later." }, 500);
  }

  const payload = {
    email,
    ...(firstName ? { fields: { name: firstName } } : {}),
    ...(env.MAILERLITE_GROUP_ID ? { groups: [env.MAILERLITE_GROUP_ID] } : {}),
  };

  let mlResponse;
  try {
    mlResponse = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("MailerLite request failed", err);
    return jsonResponse({ ok: false, error: "Something went wrong. Please try again." }, 502);
  }

  if (!mlResponse.ok) {
    const errBody = await mlResponse.text().catch(() => "");
    console.error("MailerLite error", mlResponse.status, errBody);
    return jsonResponse({ ok: false, error: "Something went wrong. Please try again." }, 502);
  }

  return jsonResponse({ ok: true }, 200);
}
