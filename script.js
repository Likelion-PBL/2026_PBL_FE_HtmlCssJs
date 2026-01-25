document.addEventListener("DOMContentLoaded", () => {
  const grid =
    document.getElementById("profileCardGrid") ||
    document.querySelector(".profile-card-grid");

  const detailList =
    document.getElementById("profileDetailList") ||
    document.querySelector(".profile-detail-list");

  const addBtn = document.getElementById("addLionBtn");
  const removeBtn = document.getElementById("removeLionBtn");
  const countEl = document.getElementById("lionCount");

  const appendOneBtn = document.getElementById("appendOneBtn");
  const appendFiveBtn = document.getElementById("appendFiveBtn");
  const refreshAllBtn = document.getElementById("refreshAllBtn");
  const fetchStatus = document.getElementById("fetchStatus");
  const retryFetchBtn = document.getElementById("retryFetchBtn");

  const partFilter = document.getElementById("partFilter");
  const sortSelect = document.getElementById("sortSelect");
  const nameSearch = document.getElementById("nameSearch");

  const formSection = document.getElementById("lionFormSection");
  const form = document.getElementById("lionForm");
  const cancelBtn = document.getElementById("cancelLionFormBtn");
  const fillRandomBtn = document.getElementById("fillRandomBtn");

  const hasDetail = Boolean(detailList);

  const lions = [];
  let nextId = 1;

  const viewState = {
    part: "ALL",
    sort: "latest",
    query: "",
  };

  let isLoading = false;
  let lastFetchAction = null;

  function textOf(el) {
    return (el?.textContent || "").trim();
  }

  function isDefaultView() {
    return (
      viewState.part === "ALL" &&
      viewState.sort === "latest" &&
      String(viewState.query || "").trim() === ""
    );
  }

  function updateCount() {
    countEl.textContent = `총 ${lions.length}명`;
  }

  function setLoading(loading, message) {
    isLoading = loading;

    const btns = [
      addBtn,
      removeBtn,
      appendOneBtn,
      appendFiveBtn,
      refreshAllBtn,
      retryFetchBtn,
      fillRandomBtn,
      cancelBtn,
    ].filter(Boolean);

    btns.forEach((btn) => {
      if (btn && btn.tagName === "BUTTON") btn.disabled = loading;
    });

    if (fetchStatus) {
      fetchStatus.textContent = message || (loading ? "불러오는 중..." : "준비 완료");
    }
  }

  function setError(message) {
    if (fetchStatus) fetchStatus.textContent = message || "오류가 발생했습니다.";
    if (retryFetchBtn) retryFetchBtn.hidden = false;
  }

  function clearError() {
    if (retryFetchBtn) retryFetchBtn.hidden = true;
  }

  function parseSkills(input) {
    return String(input || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function fetchRandomUsers(count) {
    const url = `https://randomuser.me/api/?results=${count}&nat=us,gb,ca,au,nz`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results || [];
  }

  function pickPart(seedStr) {
    const parts = ["Frontend", "Backend", "Design"];
    const seed = String(seedStr || "");
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    return parts[sum % parts.length];
  }

  function skillsByPart(part) {
    if (part === "Backend") return ["Node.js", "Spring", "Database"];
    if (part === "Design") return ["Figma", "Typography", "Design System"];
    return ["JavaScript", "React", "HTML/CSS"];
  }

  function randomUserToLion(user) {
    const id = nextId++;

    const first = user?.name?.first || "Baby";
    const last = user?.name?.last || "Lion";
    const name = `${first} ${last}`;

    const uuid = user?.login?.uuid || String(id);
    const part = pickPart(uuid);

    const skills = skillsByPart(part);

    const city = user?.location?.city || "어딘가";
    const country = user?.location?.country || "지구";
    const oneLineIntro = `${part} · ${country} ${city}에서 합류했어요!`;

    const description = [
      `4주차 미션에서 fetch로 데이터를 불러와 상태(lions)를 업데이트하는 연습을 하고 있습니다.`,
      `비동기(async/await)로 받아온 데이터를 map으로 변환해 UI에 반영하는 흐름을 이해하려고 합니다.`,
      `목표는 "데이터가 바뀌면 UI를 다시 그리는 구조"를 자연스럽게 체득하는 것입니다.`,
    ].join(" ");

    const email = user?.email || "";
    const phone = user?.phone || "";
    const username = user?.login?.username || `lion${id}`;
    const website = `https://example.com/${username}`;

    const imgSrc = user?.picture?.large || `https://picsum.photos/seed/${id}/200/200`;

    const oneWord = "데이터가 바뀌면 UI도 바뀐다!";

    return {
      id,
      name,
      part,
      skills,
      oneLineIntro,
      description,
      oneWord,
      imgSrc,
      isMe: false,
      contacts: { email, phone, website },
    };
  }

  function parseContactsFromDetail(detail) {
    const contacts = { email: "", phone: "", website: "" };
    if (!detail) return contacts;

    const items = Array.from(detail.querySelectorAll(".contact-list li"));
    for (const li of items) {
      const t = textOf(li);
      if (t.toLowerCase().startsWith("email:")) {
        contacts.email = t.split(":").slice(1).join(":").trim();
      } else if (t.toLowerCase().startsWith("phone:")) {
        contacts.phone = t.split(":").slice(1).join(":").trim();
      }
    }

    const a = detail.querySelector(".contact-list a");
    if (a) contacts.website = a.getAttribute("href") || textOf(a);

    return contacts;
  }

  function parseOneWordFromDetail(detail) {
    if (!detail) return "데이터가 바뀌면 UI도 바뀐다!";
    const sections = Array.from(detail.querySelectorAll(".detail-section"));
    const oneWordSection = sections.find(
      (sec) => textOf(sec.querySelector("h3")) === "한 마디"
    );
    return textOf(oneWordSection?.querySelector("p")) || "데이터가 바뀌면 UI도 바뀐다!";
  }

  function parseDescriptionFromDetail(detail) {
    if (!detail) return "";
    const sections = Array.from(detail.querySelectorAll(".detail-section"));
    const introSection = sections.find(
      (sec) => textOf(sec.querySelector("h3")) === "자기소개"
    );
    return textOf(introSection?.querySelector("p")) || "";
  }

  function parseSkillsFromDetail(detail) {
    if (!detail) return [];
    const lis = Array.from(detail.querySelectorAll(".skill-list li"));
    const skills = lis.map((li) => textOf(li)).filter(Boolean);
    return skills;
  }

  function hydrateFromDOM() {
    const cards = Array.from(grid.querySelectorAll(".profile-card"));
    const details = hasDetail
      ? Array.from(detailList.querySelectorAll(".profile-detail"))
      : [];

    const pairLen = hasDetail ? Math.min(cards.length, details.length) : cards.length;

    for (let i = 0; i < pairLen; i++) {
      const card = cards[i];
      const detail = hasDetail ? details[i] : null;

      const id = nextId++;
      card.dataset.lionId = String(id);
      if (detail) detail.dataset.lionId = String(id);

      const name =
        textOf(card.querySelector(".name")) ||
        textOf(detail?.querySelector(".detail-name")) ||
        `아기사자${id}`;

      const part =
        textOf(card.querySelector(".part")) ||
        textOf(detail?.querySelector(".detail-part")) ||
        "Frontend";

      const oneLineIntro = textOf(card.querySelector(".introduction")) || "";

      const imgSrc =
        card.querySelector("img")?.getAttribute("src") ||
        `https://picsum.photos/seed/${id}/200/200`;

      const skillsFromDetail = parseSkillsFromDetail(detail);
      const badgeSkill = textOf(card.querySelector(".profile-badge"));

      const skills =
        skillsFromDetail.length > 0
          ? skillsFromDetail
          : badgeSkill
          ? [badgeSkill]
          : ["JavaScript"];

      const badgeEl = card.querySelector(".profile-badge");
      if (badgeEl) badgeEl.textContent = skills[0] || "JavaScript";

      const description = parseDescriptionFromDetail(detail) || oneLineIntro;

      const oneWord = parseOneWordFromDetail(detail);

      const contacts = parseContactsFromDetail(detail);

      lions.push({
        id,
        name,
        part,
        oneLineIntro,
        description,
        oneWord,
        skills,
        imgSrc,
        isMe: card.classList.contains("is-me"),
        contacts,
      });
    }

    updateCount();
  }

  function getVisibleLions() {
    const query = String(viewState.query || "").trim().toLowerCase();

    let list = lions.slice();

    if (viewState.part !== "ALL") {
      list = list.filter((l) => l.part === viewState.part);
    }

    if (query) {
      list = list.filter((l) => String(l.name || "").toLowerCase().includes(query));
    }

    if (viewState.sort === "name") {
      list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }

  function createSummaryCard(lion) {
    const article = document.createElement("article");
    article.className = `profile-card${lion.isMe ? " is-me" : ""}`;
    article.dataset.lionId = String(lion.id);

    const figure = document.createElement("figure");
    figure.className = "profile-image";

    const badge = document.createElement("span");
    badge.className = "profile-badge";
    badge.textContent = (lion.skills && lion.skills[0]) || "JavaScript";

    const img = document.createElement("img");
    img.src = lion.imgSrc;
    img.alt = `${lion.name} 프로필 이미지`;

    figure.appendChild(badge);
    figure.appendChild(img);

    const content = document.createElement("section");
    content.className = "profile-content";

    const h2 = document.createElement("h2");
    h2.className = "name";
    h2.textContent = lion.name;

    const pPart = document.createElement("p");
    pPart.className = "part";
    pPart.textContent = lion.part;

    const pIntro = document.createElement("p");
    pIntro.className = "introduction";
    pIntro.textContent = lion.oneLineIntro;

    content.appendChild(h2);
    content.appendChild(pPart);
    content.appendChild(pIntro);

    article.appendChild(figure);
    article.appendChild(content);

    return article;
  }

  function createDetailCard(lion) {
    const section = document.createElement("section");
    section.className = "profile-detail";
    section.dataset.lionId = String(lion.id);

    const skillsHTML = (lion.skills || []).map((s) => `<li>${s}</li>`).join("");

    const website = lion.contacts?.website || "";
    const websiteLabel = website;

    section.innerHTML = `
      <header class="detail-header">
        <h1 class="detail-name">${lion.name}</h1>
        <span class="detail-part">${lion.part}</span>
        <p class="detail-organization">LION TRACK</p>
      </header>

      <section class="detail-section">
        <h3>자기소개</h3>
        <p>${lion.description || "새로 추가된 아기 사자입니다."}</p>
      </section>

      <section class="detail-section">
        <h3>연락처</h3>
        <ul class="contact-list">
          <li>Email: ${lion.contacts?.email || ""}</li>
          <li>Phone: ${lion.contacts?.phone || ""}</li>
          <li>
            <a href="${website}" target="_blank" rel="noopener noreferrer">
              ${websiteLabel}
            </a>
          </li>
        </ul>
      </section>

      <section class="detail-section">
        <h3>관심 기술</h3>
        <ul class="skill-list">
          ${skillsHTML}
        </ul>
      </section>

      <section class="detail-section">
        <h3>한 마디</h3>
        <p>${lion.oneWord || ""}</p>
      </section>
    `;

    return section;
  }

  function render(list) {
    // grid
    grid.innerHTML = "";
    if (hasDetail) detailList.innerHTML = "";

    if (!list || list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "표시할 아기 사자가 없습니다. (필터/검색 조건을 확인해 주세요)";
      grid.appendChild(empty);

      if (hasDetail) {
        const emptyDetail = document.createElement("div");
        emptyDetail.className = "empty-state";
        emptyDetail.textContent = "상세 정보가 없습니다.";
        detailList.appendChild(emptyDetail);
      }
      return;
    }

    for (const lion of list) {
      grid.appendChild(createSummaryCard(lion));
      if (hasDetail) detailList.appendChild(createDetailCard(lion));
    }
  }

  function applyAndRender() {
    updateCount();
    render(getVisibleLions());
  }

  function openForm() {
    if (!formSection) return;
    formSection.hidden = false;
    const nameInput = form?.querySelector("#lionName");
    nameInput?.focus();
  }

  function closeForm() {
    if (!formSection) return;
    formSection.hidden = true;
    form?.reset();
    addBtn?.focus();
  }

  function toggleForm() {
    if (!formSection) return;
    if (formSection.hidden) openForm();
    else closeForm();
  }

  function addLionFromForm(e) {
    e.preventDefault();
    if (!form) return;

    const fd = new FormData(form);

    const name = String(fd.get("name") || "").trim();
    const part = String(fd.get("part") || "Frontend").trim();

    const skillsInput = String(fd.get("skills") || "").trim();
    const skills = parseSkills(skillsInput);

    const oneLineIntro = String(fd.get("oneLineIntro") || "").trim();
    const description = String(fd.get("description") || "").trim();

    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const websiteRaw = String(fd.get("website") || "").trim();

    const oneWord = String(fd.get("oneWord") || "").trim();

    if (!name || !part || skills.length === 0 || !oneLineIntro || !description) return;
    if (!email || !phone || !websiteRaw) return;
    if (!oneWord) return;

    const id = nextId++;
    const imgSrc = `https://picsum.photos/seed/${id}/200/200`;

    const lion = {
      id,
      name,
      part,
      skills,
      oneLineIntro,
      description,
      oneWord,
      imgSrc,
      isMe: false,
      contacts: {
        email,
        phone,
        website: websiteRaw,
      },
    };

    lions.push(lion);

    if (isDefaultView()) {
      grid.appendChild(createSummaryCard(lion));
      if (hasDetail) detailList.appendChild(createDetailCard(lion));
      updateCount();
    } else {
      applyAndRender();
    }

    closeForm();
  }

  function removeLion() {
    if (lions.length === 0) return;

    const removed = lions.pop();
    updateCount();

    if (isDefaultView()) {
      const card = grid.querySelector(`.profile-card[data-lion-id="${removed.id}"]`);
      card?.remove();

      if (hasDetail) {
        const detail = detailList.querySelector(
          `.profile-detail[data-lion-id="${removed.id}"]`
        );
        detail?.remove();
      }
    } else {
      applyAndRender();
    }
  }

  async function fillFormWithRandomUser() {
    if (!form) return;

    const users = await fetchRandomUsers(1);
    const user = users[0];
    if (!user) throw new Error("랜덤 유저를 불러오지 못했습니다.");

    const tempLion = randomUserToLion(user);

    form.querySelector("#lionName").value = tempLion.name;
    form.querySelector("#lionPart").value = tempLion.part;
    form.querySelector("#lionSkills").value = (tempLion.skills || []).join(", ");
    form.querySelector("#lionOneLineIntro").value = tempLion.oneLineIntro;
    form.querySelector("#lionDescription").value = tempLion.description;
    form.querySelector("#lionEmail").value = tempLion.contacts.email;
    form.querySelector("#lionPhone").value = tempLion.contacts.phone;
    form.querySelector("#lionWebsite").value = tempLion.contacts.website;
    form.querySelector("#lionOneWord").value = tempLion.oneWord;
  }

  async function runFetchAction(actionFn) {
    lastFetchAction = actionFn;
    clearError();
    setLoading(true, "불러오는 중...");

    try {
      await actionFn();
      setLoading(false, "완료!");
      clearError();
      setTimeout(() => {
        if (!isLoading) setLoading(false, "준비 완료");
      }, 900);
    } catch (err) {
      setLoading(false, "실패");
      setError(`불러오기 실패: ${err?.message || "알 수 없는 오류"}`);
      console.error(err);
    }
  }

  async function appendRandom(count) {
    const users = await fetchRandomUsers(count);
    const newLions = users.map((u) => randomUserToLion(u));

    lions.push(...newLions);

    if (isDefaultView()) {
      for (const lion of newLions) {
        grid.appendChild(createSummaryCard(lion));
        if (hasDetail) detailList.appendChild(createDetailCard(lion));
      }
      updateCount();
    } else {
      applyAndRender();
    }
  }

  async function refreshAll() {
    const totalCount = lions.length;

    const me = lions.find((l) => l.isMe === true) || null;
    const fetchCount = me ? Math.max(0, totalCount - 1) : totalCount;

    const users = await fetchRandomUsers(fetchCount);
    const newOnes = users.map((u) => randomUserToLion(u));

    const nextList = me ? [me, ...newOnes] : newOnes;

    lions.splice(0, lions.length, ...nextList);

    applyAndRender();
  }

  addBtn?.addEventListener("click", toggleForm);
  removeBtn?.addEventListener("click", removeLion);

  form?.addEventListener("submit", addLionFromForm);
  cancelBtn?.addEventListener("click", closeForm);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && formSection && !formSection.hidden) {
      closeForm();
    }
  });

  appendOneBtn?.addEventListener("click", () =>
    runFetchAction(() => appendRandom(1))
  );
  appendFiveBtn?.addEventListener("click", () =>
    runFetchAction(() => appendRandom(5))
  );
  refreshAllBtn?.addEventListener("click", () =>
    runFetchAction(() => refreshAll())
  );

  retryFetchBtn?.addEventListener("click", () => {
    if (typeof lastFetchAction === "function") {
      runFetchAction(lastFetchAction);
    }
  });

  partFilter?.addEventListener("change", (e) => {
    viewState.part = e.target.value || "ALL";
    applyAndRender();
  });

  sortSelect?.addEventListener("change", (e) => {
    viewState.sort = e.target.value || "latest";
    applyAndRender();
  });

  nameSearch?.addEventListener("input", (e) => {
    viewState.query = e.target.value || "";
    applyAndRender();
  });

  fillRandomBtn?.addEventListener("click", () => {
    runFetchAction(async () => {
      if (formSection && formSection.hidden) openForm();
      await fillFormWithRandomUser();
    });
  });

  hydrateFromDOM();
  applyAndRender();
});
