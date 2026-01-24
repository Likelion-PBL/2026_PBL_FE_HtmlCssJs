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
  
    const formSection = document.getElementById("lionFormSection");
    const form = document.getElementById("lionForm");
    const cancelBtn = document.getElementById("cancelLionFormBtn");
  
    const hasDetail = Boolean(detailList);

    const lions = [];
    let nextId = 1;
  
    function textOf(el) {
      return (el?.textContent || "").trim();
    }
  
    function updateCount() {
      countEl.textContent = `총 ${lions.length}명`;
    }
  
    function parseSkills(input) {
      return String(input || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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
  
        const skillFromDetail = textOf(detail?.querySelector(".skill-list li"));
        const skillFromBadge = textOf(card.querySelector(".profile-badge"));
        const firstSkill = skillFromDetail || skillFromBadge || "JavaScript";
        const skills = [firstSkill];
  
        const badgeEl = card.querySelector(".profile-badge");
        if (badgeEl) badgeEl.textContent = firstSkill;
  
        const description = textOf(detail?.querySelector(".detail-section p")) || oneLineIntro;
  
        let oneWord = "데이터를 바꾸면 화면도 바뀐다!";
        if (detail) {
          const sections = Array.from(detail.querySelectorAll(".detail-section"));
          const oneWordSection = sections.find(
            (sec) => textOf(sec.querySelector("h3")) === "한 마디"
          );
          const oneWordText = textOf(oneWordSection?.querySelector("p"));
          if (oneWordText) oneWord = oneWordText;
        }
  
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
          contacts: {
            email: "",
            phone: "",
            website: "",
          },
        });
      }
  
      updateCount();
    }
  
    function createSummaryCard(lion) {
      const article = document.createElement("article");
      article.className = `profile-card${lion.isMe ? " is-me" : ""}`;
      article.dataset.lionId = String(lion.id);
  
      const figure = document.createElement("figure");
      figure.className = "profile-image";
  
      const badge = document.createElement("span");
      badge.className = "profile-badge";
      badge.textContent = lion.skills[0] || "JavaScript";
  
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
  
      const skillsHTML = (lion.skills || [])
        .map((s) => `<li>${s}</li>`)
        .join("");
  
      const website = lion.contacts?.website;
      const websiteLabel = lion.contacts?.website
        ? lion.contacts.website
        : "";
  
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
          <p>${lion.oneWord}</p>
        </section>
      `;
  
      return section;
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
      addBtn.focus();
    }
  
    function toggleForm() {
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
  
      grid.appendChild(createSummaryCard(lion));
      if (hasDetail) detailList.appendChild(createDetailCard(lion));
  
      updateCount();
      closeForm();
    }
  
    function removeLion() {
      if (lions.length === 0) return;
  
      const removed = lions.pop();
  
      const card = grid.querySelector(
        `.profile-card[data-lion-id="${removed.id}"]`
      );
      card?.remove();
  
      if (hasDetail) {
        const detail = detailList.querySelector(
          `.profile-detail[data-lion-id="${removed.id}"]`
        );
        detail?.remove();
      }
  
      updateCount();
    }
  
    addBtn.addEventListener("click", toggleForm);
    removeBtn.addEventListener("click", removeLion);
  
    form?.addEventListener("submit", addLionFromForm);
    cancelBtn?.addEventListener("click", closeForm);
  
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && formSection && !formSection.hidden) {
        closeForm();
      }
    });
  
    hydrateFromDOM();
  });
  