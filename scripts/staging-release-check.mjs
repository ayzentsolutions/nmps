import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { v2 as cloudinary } from "cloudinary";

const startedAt = Date.now();
const checks = [];
const artifactsDirectory = "artifacts";
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Missing required staging setting: " + name);
  return value;
};
const baseUrl = new URL(required("STAGING_BASE_URL"));
if (baseUrl.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(baseUrl.hostname)) {
  throw new Error("STAGING_BASE_URL must use HTTPS.");
}
if (process.env.CONFIRM_STAGING_ONLY !== "true") {
  throw new Error("Refusing to write test data. Confirm that STAGING_BASE_URL uses an isolated staging database.");
}
const base = baseUrl.origin;
const absolute = (path) => new URL(path, base).toString();
const envCredential = (prefix) => ({
  email: required(prefix + "_EMAIL"),
  password: required(prefix + "_PASSWORD")
});
const credentials = {
  super_admin: envCredential("STAGING_SUPER_ADMIN"),
  school_admin: envCredential("STAGING_SCHOOL_ADMIN"),
  editor: envCredential("STAGING_EDITOR"),
  publisher: envCredential("STAGING_PUBLISHER"),
  admissions_staff: envCredential("STAGING_ADMISSIONS"),
  enquiry_staff: envCredential("STAGING_ENQUIRY"),
  media_manager: envCredential("STAGING_MEDIA_MANAGER")
};
const resetTestEmail = required("STAGING_RESET_TEST_EMAIL");
const resetTestPassword = required("STAGING_RESET_TEST_PASSWORD");
assert.ok(resetTestPassword.length >= 14, "STAGING_RESET_TEST_PASSWORD must be at least 14 characters.");
const emailRecipient = required("STAGING_EMAIL_TEST_RECIPIENT");
const resendApiKey = required("STAGING_RESEND_API_KEY");
const emailFrom = required("STAGING_EMAIL_FROM");
const cloudName = required("STAGING_CLOUDINARY_CLOUD_NAME");
const cloudApiKey = required("STAGING_CLOUDINARY_API_KEY");
const cloudApiSecret = required("STAGING_CLOUDINARY_API_SECRET");

let browser;
const contexts = new Map();
let editorCreatedPageId = null;
let isolationPageId = null;
let temporaryApplicationId = null;
let temporaryDocumentId = null;
let temporaryMediaId = null;
let resetTemporaryPassword = null;
let resetPasswordChanged = false;
let resetPasswordRestored = false;

function note(name, details = {}) {
  checks.push({ name, status: "passed", details });
  console.log("PASS " + name);
}
async function step(name, work) {
  try {
    const details = await work();
    note(name, details && typeof details === "object" ? details : {});
    return details;
  } catch (error) {
    checks.push({
      name,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown failure"
    });
    console.error("FAIL " + name + ": " + (error instanceof Error ? error.message : "Unknown failure"));
    throw error;
  }
}
async function readJson(response) {
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: response.status(), headers: response.headers(), body };
}
async function expectStatus(response, expected, label) {
  const { status, body } = await readJson(response);
  assert.equal(status, expected, label + " returned " + status + "; expected " + expected + ". Response: " + JSON.stringify(body).slice(0, 400));
  return body;
}
async function authRequest(request, method, path, data, expected) {
  const response = await request.fetch(absolute(path), {
    method,
    ...(data === undefined ? {} : { data }),
    headers: { Accept: "application/json" },
    timeout: 20_000,
    failOnStatusCode: false
  });
  if (expected !== undefined) return expectStatus(response, expected, method + " " + path);
  return response;
}
async function signIn(role, account, expectedRole = role) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  contexts.set(role, context);
  const page = await context.newPage();
  await page.goto(absolute("/admin/login"), { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByLabel("Work email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForFunction(() => window.location.pathname !== "/admin/login", null, { timeout: 20_000 })
    .catch(() => {});
  assert.notEqual(new URL(page.url()).pathname, "/admin/login", "Login did not leave the login page for role " + role + ".");
  assert.notEqual(new URL(page.url()).pathname, "/admin/change-password", "The staging fixture account must not require a forced password change: " + role);
  const sessionResponse = await context.request.get(absolute("/api/auth/session"), { timeout: 15_000 });
  assert.equal(sessionResponse.status(), 200, "Auth.js session endpoint failed for " + role);
  const session = await sessionResponse.json();
  assert.ok(session?.user?.id, "Session is missing an authenticated user for " + role);
  assert.equal(session.user.mustChangePassword, false, "The fixture account has a pending first-login password change: " + role);
  if (expectedRole) assert.equal(session.user.role, expectedRole, "Fixture account has the wrong role: " + role);
  return { context, page, request: context.request, session };
}
async function closeContexts() {
  for (const context of contexts.values()) await context.close().catch(() => {});
  contexts.clear();
}
async function resend(path, options = {}) {
  const response = await fetch("https://api.resend.com" + path, {
    method: options.method || "GET",
    headers: {
      Authorization: "Bearer " + resendApiKey,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(15_000)
  });
  const body = await response.json().catch(() => ({}));
  assert.ok(response.ok, "Resend API " + path + " returned HTTP " + response.status + "; " + JSON.stringify(body).slice(0, 400));
  return body;
}
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
function senderDomain(from) {
  const address = from.match(/<\s*([^>]+)\s*>/)?.[1] || from;
  const at = address.lastIndexOf("@");
  assert.ok(at > 0, "STAGING_EMAIL_FROM must contain a sender email address.");
  return address.slice(at + 1).trim().toLowerCase();
}
async function findRecentEmail(to, subject, afterTimestamp, tries = 18) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const list = await resend("/emails?limit=100");
    const records = Array.isArray(list.data) ? list.data : [];
    const found = records.find((email) =>
      email.subject === subject &&
      Array.isArray(email.to) &&
      email.to.some((address) => String(address).toLowerCase() === to.toLowerCase()) &&
      Date.parse(email.created_at || "") >= afterTimestamp - 5_000
    );
    if (found?.id) {
      const detail = await resend("/emails/" + encodeURIComponent(found.id));
      const message = detail.data || detail;
      const body = [message.text, message.html].filter(Boolean).join("\n");
      if (body) return { summary: found, message, body };
    }
    await pause(2_000);
  }
  throw new Error("Could not retrieve the expected email content from Resend. Check recipient, sender setup and Resend email log.");
}
async function waitForDelivered(emailId, tries = 18) {
  let lastEvent = "unknown";
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const detail = await resend("/emails/" + encodeURIComponent(emailId));
    const email = detail.data || detail;
    lastEvent = email.last_event || email.lastEvent || email.status || lastEvent;
    if (String(lastEvent).toLowerCase() === "delivered") return { lastEvent };
    if (["bounced", "complained", "failed"].includes(String(lastEvent).toLowerCase())) {
      throw new Error("Resend delivery ended in event: " + lastEvent);
    }
    await pause(2_000);
  }
  throw new Error("Resend accepted the message but did not report delivery within the test window (last event: " + lastEvent + ").");
}
async function publishOrUnpublish(request, path, expected = 200) {
  return authRequest(request, "POST", path, undefined, expected);
}
function objectList(body) {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}
async function runPublicChecks() {
  const anonymous = await browser.newContext();
  contexts.set("anonymous", anonymous);
  const request = anonymous.request;
  const health = await expectStatus(await request.get(absolute("/api/health")), 200, "GET /api/health");
  assert.equal(health.status, "ok", "Health endpoint response did not report ok.");
  const readiness = await expectStatus(await request.get(absolute("/api/ready")), 200, "GET /api/ready");
  assert.equal(readiness.status, "ready", "Readiness endpoint did not report ready.");
  assert.equal(readiness.database, "connected", "Readiness endpoint did not confirm MongoDB connection.");
  const siteResponse = await request.get(base);
  assert.equal(siteResponse.status(), 200, "Public homepage did not return HTTP 200.");
  const siteHeaders = siteResponse.headers();
  for (const [header, expected] of [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["permissions-policy", "camera=(), microphone=(), geolocation=()"]
  ]) {
    assert.equal(siteHeaders[header]?.toLowerCase(), expected.toLowerCase(), "Missing or incorrect security response header: " + header);
  }
  assert.ok(siteHeaders["strict-transport-security"], "Missing Strict-Transport-Security header.");
  for (const path of [
    "/api/v1/pages",
    "/api/v1/notices",
    "/api/v1/events",
    "/api/v1/gallery",
    "/api/v1/settings"
  ]) {
    const response = await request.get(absolute(path), { timeout: 15_000 });
    assert.equal(response.status(), 200, "Public endpoint failed: " + path);
    const text = await response.text();
    assert.doesNotMatch(text, /passwordHash|tokenHash|CLOUDINARY_API_SECRET|RESEND_API_KEY/i, "Sensitive field or secret name leaked from " + path);
  }
  await expectStatus(await request.get(absolute("/api/v1/admin/pages")), 401, "Anonymous admin pages request");
  await expectStatus(await request.get(absolute("/api/v1/admin/settings")), 401, "Anonymous admin settings request");
  await expectStatus(await request.get(absolute("/api/v1/admin/admissions/applications")), 401, "Anonymous admission list request");
  note("Public liveness/readiness, headers, content APIs and anonymous access controls", { pathsChecked: 8 });
}
async function runAccessibilityChecks() {
  const page = await contexts.get("anonymous").newPage();
  for (const path of ["/", "/admissions", "/contact", "/privacy-policy", "/terms", "/admin/login"]) {
    const response = await page.goto(absolute(path), { waitUntil: "domcontentloaded", timeout: 30_000 });
    assert.ok(response && response.status() === 200, "Page failed accessibility navigation: " + path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const significant = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    );
    if (significant.length) {
      throw new Error(path + " has " + significant.length + " serious/critical accessibility violation(s): " +
        significant.map((v) => v.id + " (" + v.nodes.length + " nodes)").join(", "));
    }
  }
  note("Automated WCAG 2.1 A/AA scan", { routes: 6, threshold: "zero serious/critical violations" });
}
async function runRolePermissionChecks() {
  const schoolAdmin = await signIn("school_admin", credentials.school_admin);
  const superAdmin = await signIn("super_admin", credentials.super_admin);
  const editor = await signIn("editor", credentials.editor);
  const publisher = await signIn("publisher", credentials.publisher);
  const admissions = await signIn("admissions_staff", credentials.admissions_staff);
  const enquiries = await signIn("enquiry_staff", credentials.enquiry_staff);
  const media = await signIn("media_manager", credentials.media_manager);

  const fullAccessRoutes = [
    "/api/v1/admin/pages",
    "/api/v1/admin/settings",
    "/api/v1/admin/users",
    "/api/v1/admin/admissions/applications",
    "/api/v1/admin/enquiries",
    "/api/v1/admin/media",
    "/api/v1/admin/audit-logs"
  ];
  for (const account of [schoolAdmin, superAdmin]) {
    for (const path of fullAccessRoutes) {
      await expectStatus(await account.request.get(absolute(path)), 200, account.session.user.role + " GET " + path);
    }
  }
  await expectStatus(await editor.request.get(absolute("/api/v1/admin/pages")), 200, "Editor page read");
  await expectStatus(await editor.request.get(absolute("/api/v1/admin/media")), 200, "Editor media access");
  for (const path of ["/api/v1/admin/settings", "/api/v1/admin/users", "/api/v1/admin/admissions/applications", "/api/v1/admin/enquiries", "/api/v1/admin/audit-logs"]) {
    await expectStatus(await editor.request.get(absolute(path)), 403, "Editor must be denied " + path);
  }
  await expectStatus(await publisher.request.get(absolute("/api/v1/admin/pages")), 200, "Publisher page read");
  await expectStatus(await admissions.request.get(absolute("/api/v1/admin/admissions/applications")), 200, "Admissions workspace access");
  await expectStatus(await enquiries.request.get(absolute("/api/v1/admin/enquiries")), 200, "Enquiries workspace access");
  await expectStatus(await media.request.get(absolute("/api/v1/admin/media")), 200, "Media manager access");
  for (const [account, denied] of [
    [publisher, ["/api/v1/admin/settings", "/api/v1/admin/users", "/api/v1/admin/admissions/applications", "/api/v1/admin/enquiries", "/api/v1/admin/media", "/api/v1/admin/audit-logs"]],
    [admissions, ["/api/v1/admin/pages", "/api/v1/admin/settings", "/api/v1/admin/users", "/api/v1/admin/enquiries", "/api/v1/admin/media"]],
    [enquiries, ["/api/v1/admin/pages", "/api/v1/admin/settings", "/api/v1/admin/users", "/api/v1/admin/admissions/applications", "/api/v1/admin/media"]],
    [media, ["/api/v1/admin/pages", "/api/v1/admin/settings", "/api/v1/admin/users", "/api/v1/admin/admissions/applications", "/api/v1/admin/enquiries"]]
  ]) {
    for (const path of denied) {
      await expectStatus(await account.request.get(absolute(path)), 403, account.session.user.role + " must be denied " + path);
    }
  }
  note("Staff login, session role and server-side role permissions", {
    roles: ["super_admin", "school_admin", "editor", "publisher", "admissions_staff", "enquiry_staff", "media_manager"]
  });
  return { schoolAdmin, superAdmin, editor, publisher, admissions, enquiries, media };
}
async function runTenantIsolationCheck(roles) {
  const suffix = Date.now().toString(36) + "-" + randomBytes(3).toString("hex");
  const schoolId = "release-isolation-" + suffix;
  const slug = "release-isolation-" + suffix;
  const created = await authRequest(roles.superAdmin.request, "POST", "/api/v1/admin/pages", {
    schoolId,
    title: "Tenant Isolation Check " + suffix,
    slug,
    draftContent: {
      blocks: [{ id: "tenant-isolation", type: "richText", visible: true, title: "Synthetic tenant boundary test", body: "Synthetic isolation fixture; never publish." }],
      seo: { title: "Tenant isolation check", description: "Automated synthetic test.", ogImage: "" }
    }
  }, 201);
  isolationPageId = created.data?.id || created.data?._id;
  assert.ok(isolationPageId, "Super administrator could not create the isolated fixture page.");

  const adminList = await expectStatus(
    await roles.schoolAdmin.request.get(absolute("/api/v1/admin/pages?q=" + encodeURIComponent(slug))),
    200,
    "School admin must only list pages in its own school"
  );
  assert.ok(!objectList(adminList).some((item) => item.id === isolationPageId || item.slug === slug),
    "A school admin saw a page from another school.");
  await expectStatus(
    await roles.schoolAdmin.request.get(absolute("/api/v1/admin/pages/" + isolationPageId)),
    404,
    "School admin must not read another school's page"
  );
  await expectStatus(
    await roles.editor.request.get(absolute("/api/v1/admin/pages/" + isolationPageId)),
    404,
    "Editor must not read another school's page"
  );
  await expectStatus(
    await roles.superAdmin.request.get(absolute("/api/v1/admin/pages/" + isolationPageId)),
    200,
    "Platform super administrator should be able to inspect the isolated fixture"
  );
  await expectStatus(
    await roles.superAdmin.request.delete(absolute("/api/v1/admin/pages/" + isolationPageId)),
    204,
    "Delete isolated tenant fixture"
  );
  isolationPageId = null;
  note("Cross-school page isolation and super-administrator scope", { isolatedSchoolId: schoolId });
}
async function runPublishingFlow(roles) {
  const suffix = Date.now().toString(36) + "-" + randomBytes(3).toString("hex");
  const slug = "release-check-" + suffix;
  const title = "Staging Release Check " + suffix;
  const created = await authRequest(roles.editor.request, "POST", "/api/v1/admin/pages", {
    title,
    slug,
    draftContent: {
      blocks: [{ id: "release-check", type: "richText", visible: true, title, body: "Synthetic staging verification content. Not for publication." }],
      seo: { title, description: "Automated staging check.", ogImage: "" }
    }
  }, 201);
  const page = created.data;
  assert.ok(page?.id || page?._id, "Page creation response did not include a page ID.");
  editorCreatedPageId = page.id || page._id;
  const notPublic = await roles.publisher.request.get(absolute("/api/v1/pages?slug=" + encodeURIComponent(slug)));
  await expectStatus(notPublic, 404, "Unpublished draft must be hidden from public page API");
  await publishOrUnpublish(roles.editor.request, "/api/v1/admin/pages/" + editorCreatedPageId + "/publish", 403);
  await publishOrUnpublish(roles.publisher.request, "/api/v1/admin/pages/" + editorCreatedPageId + "/publish", 200);
  const publicPage = await roles.publisher.request.get(absolute("/api/v1/pages?slug=" + encodeURIComponent(slug)));
  const publicBody = await expectStatus(publicPage, 200, "Published page must appear in public API");
  assert.equal(publicBody.data?.slug, slug, "Published slug did not match the draft slug.");
  assert.ok(publicBody.data?.content, "Published page content missing.");
  await publishOrUnpublish(roles.publisher.request, "/api/v1/admin/pages/" + editorCreatedPageId + "/unpublish", 200);
  await expectStatus(await roles.publisher.request.get(absolute("/api/v1/pages?slug=" + encodeURIComponent(slug))), 404, "Unpublished page must disappear from public API");
  await expectStatus(await roles.schoolAdmin.request.delete(absolute("/api/v1/admin/pages/" + editorCreatedPageId)), 204, "Temporary staging page cleanup");
  editorCreatedPageId = null;
  note("Draft isolation, denied editor publish, publisher publish/unpublish and cleanup", { slug });
}
async function runMediaFlow(roles) {
  const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Zr8AAAAASUVORK5CYII=", "base64");
  const upload = await roles.media.request.post(absolute("/api/v1/admin/media"), {
    multipart: {
      file: { name: "nmps-release-check.png", mimeType: "image/png", buffer: onePixelPng },
      title: "Automated staging media check",
      altText: "One pixel test image",
      caption: "Synthetic staging asset; removed by the test."
    },
    timeout: 30_000,
    failOnStatusCode: false
  });
  const body = await expectStatus(upload, 201, "Cloudinary-backed public media upload");
  temporaryMediaId = body.data?.id;
  assert.ok(temporaryMediaId, "Media upload response did not contain an asset ID.");
  const listed = await expectStatus(await roles.media.request.get(absolute("/api/v1/admin/media?q=" + encodeURIComponent("Automated staging media check"))), 200, "Uploaded media list check");
  assert.ok(objectList(listed).some((item) => item.id === temporaryMediaId), "Uploaded asset did not appear in media library.");
  await expectStatus(await roles.media.request.delete(absolute("/api/v1/admin/media/" + temporaryMediaId)), 204, "Cloudinary-backed public media cleanup");
  temporaryMediaId = null;
  note("Public media upload/list/delete against configured Cloudinary", {});
}
async function runAdmissionsPrivateDocumentFlow(roles) {
  const stamp = new Date().toISOString();
  const submittedAt = Date.now();
  const syntheticName = "E2E RELEASE CHECK " + stamp;
  const minimalPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n", "ascii");
  const submission = await roles.admissions.request.post(absolute("/api/v1/admissions/applications"), {
    multipart: {
      admissionSession: "STAGING-RELEASE-CHECK",
      studentName: syntheticName,
      dateOfBirth: "",
      gradeApplied: "STAGING TEST ONLY",
      parentName: "Automated Release Check",
      parentEmail: emailRecipient,
      parentPhone: "+919999999999",
      address: "Synthetic test data only",
      documents: { name: "nmps-release-check.pdf", mimeType: "application/pdf", buffer: minimalPdf }
    },
    timeout: 45_000,
    failOnStatusCode: false
  });
  const submitted = await expectStatus(submission, 201, "Public admission submission with private PDF");
  const reference = submitted.data?.referenceNumber;
  assert.ok(reference, "Admission submission did not return its reference number.");
  assert.equal(submitted.data.documentsUploaded, 1, "Private document upload count does not match.");
  const confirmation = await findRecentEmail(emailRecipient, "NMPS admission application received", submittedAt);
  assert.ok(confirmation.body.includes(reference), "Admission confirmation email did not contain the application reference.");
  await waitForDelivered(confirmation.message.id);
  const list = await expectStatus(await roles.admissions.request.get(absolute("/api/v1/admin/admissions/applications?q=" + encodeURIComponent(reference))), 200, "Read back synthetic application");
  const record = objectList(list).find((item) => item.referenceNumber === reference);
  assert.ok(record?.id, "Could not locate the synthetic application in the staff workspace.");
  temporaryApplicationId = record.id;
  const docsBody = await expectStatus(await roles.admissions.request.get(absolute("/api/v1/admin/admissions/applications/" + record.id + "/documents")), 200, "List private documents");
  const document = objectList(docsBody)[0];
  assert.ok(document?.id, "The submitted private document is missing from the staff view.");
  temporaryDocumentId = document.id;

  await expectStatus(await contexts.get("anonymous").request.get(absolute("/api/v1/admin/admissions/applications/" + record.id + "/documents/" + document.id)), 401, "Anonymous private document denial");
  await expectStatus(await roles.editor.request.get(absolute("/api/v1/admin/admissions/applications/" + record.id + "/documents/" + document.id)), 403, "Editor private document denial");
  const redirect = await roles.admissions.request.get(absolute("/api/v1/admin/admissions/applications/" + record.id + "/documents/" + document.id), { maxRedirects: 0, failOnStatusCode: false, timeout: 20_000 });
  assert.equal(redirect.status(), 307, "Authorized private document download did not return a short-lived redirect.");
  const signedUrl = redirect.headers().location;
  assert.ok(signedUrl && signedUrl.startsWith("https://"), "Private document redirect did not contain an HTTPS signed URL.");
  const download = await fetch(signedUrl, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
  assert.equal(download.status, 200, "Short-lived private document URL did not return HTTP 200.");
  const downloadedBytes = Buffer.from(await download.arrayBuffer());
  assert.ok(downloadedBytes.subarray(0, 5).toString("ascii") === "%PDF-", "Downloaded private document did not match the uploaded PDF.");

  await expectStatus(await roles.admissions.request.delete(absolute("/api/v1/admin/admissions/applications/" + record.id + "/documents/" + document.id)), 204, "Private document cleanup");
  temporaryDocumentId = null;
  await expectStatus(await roles.admissions.request.patch(absolute("/api/v1/admin/admissions/applications/" + record.id), {
    data: { status: "withdrawn", note: "Automated staging release check; synthetic data only." },
    failOnStatusCode: false,
    timeout: 20_000
  }), 200, "Mark synthetic application withdrawn");
  note("Admission submission, application confirmation delivery, authenticated private storage, document authorization, signed download and cleanup", { reference, syntheticRecordMarkedWithdrawn: true });
}
async function runEnquiryFlow(roles) {
  const submittedAt = Date.now();
  const referenceText = "E2E release-check " + new Date().toISOString();
  const response = await contexts.get("anonymous").request.post(absolute("/api/v1/enquiries"), {
    data: {
      name: "Automated Release Check",
      email: emailRecipient,
      phone: "",
      subject: "Staging release-check enquiry",
      message: referenceText,
      website: ""
    },
    failOnStatusCode: false,
    timeout: 30_000
  });
  const body = await expectStatus(response, 201, "Public enquiry submission");
  const reference = body.data?.referenceNumber;
  assert.ok(reference, "Public enquiry did not return a reference number.");
  const confirmation = await findRecentEmail(emailRecipient, "NMPS enquiry received: " + reference, submittedAt);
  assert.ok(confirmation.body.includes(reference), "Enquiry confirmation email did not contain the enquiry reference.");
  await waitForDelivered(confirmation.message.id);
  const listed = await expectStatus(await roles.enquiries.request.get(absolute("/api/v1/admin/enquiries?q=" + encodeURIComponent(reference))), 200, "Enquiry staff readback");
  const item = objectList(listed).find((entry) => entry.referenceNumber === reference);
  assert.ok(item?.id, "Enquiry staff could not see the newly submitted enquiry.");
  await expectStatus(await roles.enquiries.request.patch(absolute("/api/v1/admin/enquiries/" + item.id), {
    data: { status: "closed", internalNote: "Automated staging release check; synthetic record only." },
    failOnStatusCode: false,
    timeout: 20_000
  }), 200, "Close synthetic enquiry");
  await expectStatus(await roles.admissions.request.get(absolute("/api/v1/admin/enquiries?q=" + encodeURIComponent(reference))), 403, "Admissions staff must not read enquiries");
  note("Public enquiry submission, confirmation delivery, role-scoped readback and status closure", { reference });
}
async function runPasswordRecoveryFlow() {
  const before = Date.now();
  const anonymous = contexts.get("anonymous").request;
  const response = await anonymous.post(absolute("/api/v1/auth/password-reset/request"), {
    data: { email: resetTestEmail },
    timeout: 30_000,
    failOnStatusCode: false
  });
  const body = await expectStatus(response, 200, "Password recovery request");
  assert.match(body.message || "", /If an active account matches that email address/i, "Password reset response is not non-enumerating.");
  const { message, body: emailBody } = await findRecentEmail(resetTestEmail, "Reset your NMPS staff account password", before);
  const links = [...emailBody.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((match) => match[0].replace(/&amp;/g, "&"));
  const resetLink = links.find((value) => {
    try {
      const parsed = new URL(value);
      return parsed.origin === base && parsed.pathname === "/admin/reset-password" && parsed.searchParams.has("token");
    } catch { return false; }
  });
  assert.ok(resetLink, "The delivered recovery email did not contain a staging reset link.");
  const token = new URL(resetLink).searchParams.get("token");
  assert.ok(token, "Password reset link token was empty.");
  resetTemporaryPassword = "Nmps-Release-" + randomBytes(18).toString("hex") + "!";
  const complete = await anonymous.post(absolute("/api/v1/auth/password-reset/complete"), {
    data: { token, password: resetTemporaryPassword },
    timeout: 30_000,
    failOnStatusCode: false
  });
  const completedBody = await expectStatus(complete, 200, "Complete password reset with delivered token");
  assert.match(completedBody.message || "", /Password updated/i, "Password recovery completion did not succeed.");
  resetPasswordChanged = true;
  await expectStatus(
    await anonymous.post(absolute("/api/v1/auth/password-reset/complete"), {
      data: { token, password: "Another-Release-Password-Not-Used" },
      timeout: 30_000,
      failOnStatusCode: false
    }),
    400,
    "A reset token must not be reusable"
  );

  const resetUser = await signIn("reset_test", { email: resetTestEmail, password: resetTemporaryPassword }, null);
  const restore = await authRequest(resetUser.request, "POST", "/api/v1/auth/change-password", {
    currentPassword: resetTemporaryPassword,
    newPassword: resetTestPassword
  }, 200);
  assert.match(restore.message || "", /Password changed/i, "Could not restore the dedicated reset-test account password.");
  resetPasswordRestored = true;
  await resetUser.context.close();
  contexts.delete("reset_test");
  const restoredLogin = await signIn("reset_test_restored", { email: resetTestEmail, password: resetTestPassword }, null);
  await restoredLogin.context.close();
  contexts.delete("reset_test_restored");
  note("Password recovery email content, link token, one-time completion, sign-in and test-account password restoration", { emailSubject: message.subject });
}
async function runLoadSmoke() {
  const concurrency = Math.min(20, Math.max(1, Number(process.env.STAGING_LOAD_CONCURRENCY || 8)));
  const durationSeconds = Math.min(30, Math.max(5, Number(process.env.STAGING_LOAD_SECONDS || 10)));
  const endAt = Date.now() + durationSeconds * 1000;
  const times = [];
  let responses = 0;
  let failures = 0;
  let serverErrors = 0;
  const worker = async () => {
    while (Date.now() < endAt) {
      const started = performance.now();
      try {
        const response = await fetch(absolute("/api/v1/pages"), { signal: AbortSignal.timeout(10_000) });
        times.push(performance.now() - started);
        responses += 1;
        if (response.status >= 500) serverErrors += 1;
        if (response.status !== 200) failures += 1;
        await response.arrayBuffer();
      } catch {
        failures += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  assert.ok(responses >= concurrency, "Load smoke generated too few successful requests.");
  assert.equal(serverErrors, 0, "Load smoke received one or more HTTP 5xx responses.");
  assert.equal(failures, 0, "Load smoke had failed/non-200 requests.");
  times.sort((a, b) => a - b);
  const p95 = times[Math.min(times.length - 1, Math.ceil(times.length * 0.95) - 1)] || 0;
  assert.ok(p95 < 5_000, "Read-only API p95 latency exceeded 5 seconds (" + Math.round(p95) + " ms).");
  note("Bounded concurrent read-only load smoke (not a capacity certification)", {
    durationSeconds, concurrency, responses, p95Milliseconds: Math.round(p95)
  });
}
async function cleanupTemporaryRecords(roles) {
  if (temporaryDocumentId && temporaryApplicationId && roles?.admissions) {
    await roles.admissions.request.delete(absolute("/api/v1/admin/admissions/applications/" + temporaryApplicationId + "/documents/" + temporaryDocumentId), { timeout: 15_000, failOnStatusCode: false }).catch(() => {});
  }
  if (temporaryApplicationId && roles?.admissions) {
    await roles.admissions.request.patch(absolute("/api/v1/admin/admissions/applications/" + temporaryApplicationId), {
      data: { status: "withdrawn", note: "Automated staging release check cleanup; synthetic data only." },
      timeout: 15_000,
      failOnStatusCode: false
    }).catch(() => {});
  }
  if (isolationPageId && roles?.superAdmin) {
    await roles.superAdmin.request.delete(absolute("/api/v1/admin/pages/" + isolationPageId), { timeout: 15_000, failOnStatusCode: false }).catch(() => {});
  }
  if (temporaryMediaId && roles?.media) {
    await roles.media.request.delete(absolute("/api/v1/admin/media/" + temporaryMediaId), { timeout: 15_000, failOnStatusCode: false }).catch(() => {});
  }
  if (editorCreatedPageId && roles?.publisher && roles?.schoolAdmin) {
    await roles.publisher.request.post(absolute("/api/v1/admin/pages/" + editorCreatedPageId + "/unpublish"), { timeout: 15_000, failOnStatusCode: false }).catch(() => {});
    await roles.schoolAdmin.request.delete(absolute("/api/v1/admin/pages/" + editorCreatedPageId), { timeout: 15_000, failOnStatusCode: false }).catch(() => {});
  }
}
async function restoreResetTestAccountIfNeeded() {
  if (!resetPasswordChanged || resetPasswordRestored || !resetTemporaryPassword) return;
  let tempContext;
  try {
    tempContext = await browser.newContext();
    const page = await tempContext.newPage();
    await page.goto(absolute("/admin/login"), { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.getByLabel("Work email").fill(resetTestEmail);
    await page.getByLabel("Password").fill(resetTemporaryPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForFunction(() => window.location.pathname !== "/admin/login", null, { timeout: 15_000 });
    await tempContext.request.post(absolute("/api/v1/auth/change-password"), {
      data: { currentPassword: resetTemporaryPassword, newPassword: resetTestPassword },
      timeout: 20_000,
      failOnStatusCode: false
    });
  } catch {
    console.error("WARNING: Automated password restoration was unsuccessful. The dedicated staging reset-test account may still use the temporary password generated by this run.");
  } finally {
    if (tempContext) await tempContext.close().catch(() => {});
  }
}
async function main() {
  await step("Cloudinary Admin API connectivity", async () => {
    cloudinary.config({ cloud_name: cloudName, api_key: cloudApiKey, api_secret: cloudApiSecret, secure: true });
    const result = await cloudinary.api.ping();
    assert.equal(result.status, "ok", "Cloudinary ping did not report ok.");
    return { status: result.status };
  });
  await step("Resend sender-domain verification", async () => {
    const domainsResponse = await resend("/domains?limit=100");
    const records = Array.isArray(domainsResponse.data) ? domainsResponse.data : [];
    const expectedDomain = senderDomain(emailFrom);
    const domain = records.find((item) => {
      const name = String(item.name || "").toLowerCase();
      return name === expectedDomain || expectedDomain.endsWith("." + name);
    });
    assert.ok(domain, "No Resend domain matching sender domain " + expectedDomain + " is configured.");
    assert.equal(String(domain.status).toLowerCase(), "verified", "Resend sender domain is not verified.");
    if (domain.capabilities?.sending !== undefined) assert.equal(domain.capabilities.sending, "enabled", "Resend sending capability is not enabled.");
    return { domain: expectedDomain, status: domain.status };
  });
  await step("Resend test email accepted and delivered", async () => {
    const stamp = new Date().toISOString();
    const sent = await resend("/emails", {
      method: "POST",
      idempotencyKey: "nmps-staging-release-" + randomBytes(16).toString("hex"),
      body: {
        from: emailFrom,
        to: [emailRecipient],
        subject: "[NMPS STAGING] Automated release delivery check",
        text: "Automated NMPS staging release check. No personal data is included. Created at " + stamp + "."
      }
    });
    const id = (sent.data || sent).id;
    assert.ok(id, "Resend did not return a message ID.");
    return { emailId: id, ...(await waitForDelivered(id)) };
  });

  browser = await chromium.launch({ headless: true });
  await step("Public website, liveness/readiness and security headers", runPublicChecks);
  await step("Automated accessibility scan", runAccessibilityChecks);

  const roles = await step("Login and role-based permissions", runRolePermissionChecks);
  try {
    await step("Cross-school tenant isolation", () => runTenantIsolationCheck(roles));
    await step("Page draft/publish/unpublish lifecycle", () => runPublishingFlow(roles));
    await step("Cloudinary public media upload and cleanup", () => runMediaFlow(roles));
    await step("Admission + private document workflow", () => runAdmissionsPrivateDocumentFlow(roles));
    await step("Public enquiry and enquiry-role workflow", () => runEnquiryFlow(roles));
    await step("Password recovery end-to-end", runPasswordRecoveryFlow);
    await step("Bounded read-only load smoke", runLoadSmoke);
  } finally {
    await cleanupTemporaryRecords(roles);
    await restoreResetTestAccountIfNeeded();
  }
}
let fatalError = null;
try {
  await main();
} catch (error) {
  fatalError = error instanceof Error ? error.message : "Unknown failure";
  console.error("Staging release check stopped: " + fatalError);
} finally {
  await closeContexts();
  if (browser) await browser.close().catch(() => {});
  await mkdir(artifactsDirectory, { recursive: true }).catch(() => {});
  const report = {
    repository: "ayzentsolutions/nmps",
    target: baseUrl.origin,
    generatedAt: new Date().toISOString(),
    durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    status: fatalError || checks.some((check) => check.status === "failed") ? "failed" : "passed",
    checks,
    fatalError
  };
  await writeFile(artifactsDirectory + "/staging-release-report.json", JSON.stringify(report, null, 2));
  console.log("Release report written to " + artifactsDirectory + "/staging-release-report.json");
}
if (fatalError || checks.some((check) => check.status === "failed")) process.exitCode = 1;
