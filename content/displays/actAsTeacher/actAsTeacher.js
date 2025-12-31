"use strict";

(function actAsTeacher() {
  // ---- small helpers (matching existing extension patterns) ----
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getCsrfToken() {
    const match = document.cookie.match("(^|;) *_csrf_token=([^;]*)");
    return match ? decodeURIComponent(match[2]) : "";
  }

  function getCourseID() {
    const m = window.location.pathname.match(/\/courses\/(\d+)/);
    return m ? m[1] : null;
  }

  async function fetchJSON(url, retries = 2) {
    let delayTime = 90;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
        });

        if (res.status === 403 && i < retries) {
          console.log(
            `[actAsTeacher] Rate limited on ${url}, waiting ${delayTime}ms before retry ${i + 1}`
          );
          await delay(delayTime);
          delayTime *= 2;
          continue;
        }

        if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
        return await res.json();
      } catch (err) {
        if (i < retries) {
          console.log(`[actAsTeacher] Error on ${url}, retrying: ${err.message}`);
          await delay(delayTime);
          delayTime *= 2;
          continue;
        }
        throw err;
      }
    }
  }

  async function getActiveTeachers(courseID) {
    // Canvas: GET /api/v1/courses/:course_id/enrollments?type[]=TeacherEnrollment&state[]=active&include[]=user
    const teachers = [];
    let page = 1;

    while (true) {
      const url =
        `/api/v1/courses/${courseID}/enrollments` +
        `?type[]=TeacherEnrollment&state[]=active&include[]=user&per_page=100&page=${page}`;

      const batch = await fetchJSON(url);
      if (Array.isArray(batch) && batch.length) teachers.push(...batch);

      if (!Array.isArray(batch) || batch.length < 100) break;

      page += 1;
      await delay(25);
    }

    return teachers
      .map((e) => ({
        user_id: e.user_id,
        name: e.user?.name || e.user?.short_name || `User ${e.user_id}`,
        sortable_name: e.user?.sortable_name || "",
      }))
      .filter((t) => t.user_id)
      .sort((a, b) =>
        (a.sortable_name || a.name).localeCompare(b.sortable_name || b.name)
      );
  }

  // ---- UI (reuse existing bottom navbar container if present) ----
  function ensureBottomNavbar() {
    const existing = document.getElementById("navToModule_ext");
    const sidebar = document.querySelector("#header");
    if (!sidebar) return null;

    const sidebarWidth = window.getComputedStyle(sidebar).getPropertyValue("width");

    const navbar = existing || document.createElement("div");
    if (!existing) {
      navbar.id = "navToModule_ext";
      document.body.appendChild(navbar);
    }

    // Normalize styles (even if created by another script) so it can't overflow
    Object.assign(navbar.style, {
      position: "fixed",
      bottom: "0",
      left: sidebarWidth,
      right: "0",              // key: prevents off-screen width issues
      width: "auto",
      maxWidth: "none",
      zIndex: "10",
      backgroundColor: "white",
      borderTop: "1px solid #ddd",
      padding: "4px 8px",
      color: "black",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",        // allow wrapping instead of overflow
      boxSizing: "border-box",
    });

    // Avoid forcing a tiny bar that can't fit controls
    navbar.style.height = "auto";
    navbar.style.lineHeight = "normal";
    navbar.style.minHeight = "24px";

    return navbar;
  }

  function ensureActAsTeacherControlsHost() {
    const navbar = ensureBottomNavbar();
    if (!navbar) return null;

    let host = document.getElementById("actAsTeacher_ext");
    if (host) return host;

    host = document.createElement("div");
    host.id = "actAsTeacher_ext";

    Object.assign(host.style, {
      marginRight: "auto",     // keep the host on the left
      order: "-1",             // move it to the left within the flex bar
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "6px",
      flexWrap: "wrap",
      minWidth: "0",
      maxWidth: "100%",
    });

    navbar.appendChild(host);
    return host;
  }

  function renderDropdownAndButton(teachers) {
    const host = ensureActAsTeacherControlsHost();
    if (!host) return;

    host.innerHTML = "";

    const label = document.createElement("label");
    label.textContent = "Teacher:";
    label.className = "ic-Label";
    // keep Canvas class, just prevent layout weirdness
    label.style.margin = "0";
    label.style.whiteSpace = "nowrap";
    host.appendChild(label);

    const select = document.createElement("select");
    select.className = "ic-Input";
    // constrain so it stays tidy and can shrink
    select.style.maxWidth = "260px";
    select.style.width = "220px";
    select.style.minWidth = "140px";

    teachers.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = String(t.user_id);
      opt.textContent = t.name;
      select.appendChild(opt);
    });
    host.appendChild(select);

    const link = document.createElement("a");
    link.className = "btn btn-small btn-primary";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Impersonate";
    link.style.whiteSpace = "nowrap";

    function updateLink() {
      link.href = `${window.location.origin}/users/${select.value}/masquerade`;
    }

    select.addEventListener("change", updateLink);
    updateLink();

    host.appendChild(link);
  }

  // ---- main ----
  (async () => {
    try {
      const courseID = getCourseID();
      if (!courseID) return;

      const teachers = await getActiveTeachers(courseID);
      if (!teachers.length) return;

      renderDropdownAndButton(teachers);
    } catch (err) {
      console.error("[actAsTeacher] Failed:", err);
    }
  })();
})();