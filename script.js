// ============ 内容渲染（由 content.json 驱动，后台可改） ============
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(u) {
  u = String(u || '').trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function renderContent(c) {
  const name = (c.name || '').trim();
  if (name) {
    const mark = name.slice(0, 1);
    setText('brandMark', mark);
    setText('heroAvatar', mark);
    setText('profileAvatar', mark);
    setText('footerMark', mark);
    setText('brandName', name);
    setText('heroName', name);
    setText('profileName', name);
    setText('footerBrandName', name);
  }

  setText('heroBadge', c.badge);
  setText('profileBadge', c.badge);
  setText('heroDesc', c.heroDesc);
  setText('footerText', c.footerText);
  setText('footerCopy', c.footerCopy);

  // GitHub 链接
  const gh = safeUrl(c.github);
  if (gh) {
    const link = document.getElementById('footerGithub');
    if (link) {
      link.href = gh;
      const ghId = gh.replace(/\/+$/, '').split('/').pop();
      setText('footerGithubText', 'GitHub @' + ghId);
    }
  }

  // 关于我（可选补充段落）
  const about = String(c.aboutDesc || '').trim();
  const extra = document.getElementById('aboutExtra');
  if (extra && about) {
    extra.hidden = false;
    extra.innerHTML =
      '<div class="about-desc-card">' +
      about.split(/\n+/).map((p) => '<p>' + esc(p) + '</p>').join('') +
      '</div>';
  }

  // 技能卡片（无内容则保留「内容整理中」空状态）
  const skills = (c.skills || []).filter((s) => s && s.name);
  const skillsBox = document.getElementById('skillsList');
  if (skillsBox && skills.length) {
    skillsBox.outerHTML =
      '<div class="cards-grid">' +
      skills
        .map(
          (s) =>
            '<div class="skill-card reveal">' +
            '<div class="skill-name">' + esc(s.name) + '</div>' +
            (s.desc ? '<p class="skill-desc">' + esc(s.desc) + '</p>' : '') +
            '</div>'
        )
        .join('') +
      '</div>';
  }

  // 项目卡片（无内容则保留「内容整理中」空状态）
  const projects = (c.projects || []).filter((p) => p && p.name);
  const projBox = document.getElementById('projectsList');
  if (projBox && projects.length) {
    projBox.outerHTML =
      '<div class="cards-grid">' +
      projects
        .map((p) => {
          const tags = (p.tags || []).filter(Boolean);
          const link = safeUrl(p.link);
          return (
            '<div class="project-card reveal">' +
            '<div class="proj-head"><div class="proj-name">' + esc(p.name) + '</div>' +
            (tags.length
              ? '<div class="proj-tags">' + tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>'
              : '') +
            '</div>' +
            (p.desc ? '<p class="proj-desc">' + esc(p.desc) + '</p>' : '') +
            (link ? '<a class="proj-link" href="' + esc(link) + '" target="_blank" rel="noopener">查看项目 →</a>' : '') +
            '</div>'
          );
        })
        .join('') +
      '</div>';
  }
}

async function loadContent() {
  try {
    const res = await fetch('./content.json', { cache: 'no-store' });
    if (res.ok) renderContent(await res.json());
  } catch (e) {
    /* 读取失败（如直接双击打开文件）时保留 HTML 静态兜底内容 */
  }
}

// ============ 初始化：先渲染内容，再挂交互 ============
async function init() {
  await loadContent();

  // ---- 移动端菜单 ----
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');

  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ---- 滚动显现（动态插入的卡片也参与） ----
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // ---- 导航高亮 ----
  const sections = ['about', 'skills', 'projects']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const navLinks = new Map();
  siteNav.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (id) navLinks.set(id, link);
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = navLinks.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((sec) => sectionObserver.observe(sec));
}

init();
