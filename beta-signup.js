/* VoxelBox Studio beta signup form -> POST /api/beta-signup (same origin, CSP-safe external script). */
(function () {
  "use strict";
  var form = document.querySelector("[data-beta-form]");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var button = form.querySelector('button[type="submit"]');

  function errorText(code) {
    if (code === 429) return "Too many attempts right now. Try again in a little while.";
    if (code === 422) return "Check your email address and tick the box to continue.";
    if (code === 503) return "Signups are busy at the moment. Please try again later.";
    return "Couldn't sign you up just now. Email admin@voxelbox.org and we'll add you.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var payload = {
      name: String(f.get("name") || "").trim(),
      email: String(f.get("email") || "").trim(),
      interest: String(f.get("interest") || ""),
      notes: String(f.get("notes") || "").trim(),
      company: String(f.get("company") || "").trim(),
      consent: form.elements.consent.checked === true
    };
    status.className = "form-status pending";
    status.textContent = "Signing you up...";
    button.disabled = true;
    fetch("/api/beta-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || !body.ok) { var err = new Error("signup failed"); err.status = response.status; throw err; }
        status.className = "form-status ok";
        status.textContent = form.getAttribute("data-ok") || "You're on the list.";
        form.reset();
      });
    }).catch(function (error) {
      status.className = "form-status err";
      status.textContent = errorText(error && error.status ? error.status : 0);
    }).then(function () {
      button.disabled = false;
    });
  });
})();
