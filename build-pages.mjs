import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const today = "2026-08-10";
const baseUrl = "https://cadmusprojects.com";

const pages = [
  {
    path: "rocklin-project-management/index.html",
    title: "Rocklin Project Management Consultant | Cadmus Project Management",
    description:
      "Cadmus Project Management supports Rocklin and Placer County agencies, primes, and public-sector teams with disciplined project management, PMO support, and DVBE partnership.",
    eyebrow: "Rocklin, California",
    h1: "Project management support for Rocklin public-sector work.",
    lead:
      "Cadmus gives Rocklin-area agencies and prime contractors a local delivery partner for schedules, risks, decisions, reporting, and the daily follow-through that keeps programs moving.",
    sections: [
      ["Local Support", "Rocklin teams often need senior project-management capacity without building a full internal PMO. Cadmus steps in with practical operating rhythms, executive-ready reporting, and clear ownership for open work."],
      ["Who We Help", "City, county, education, transportation, technology, facilities, and prime-contractor teams that need disciplined coordination across vendors, departments, and stakeholders."],
      ["Search Fit", "Built for searches like Rocklin project management consultant, Placer County PMO support, California DVBE project manager, and public-sector project management near Rocklin."],
    ],
    cards: [
      ["Schedule Control", "Milestones, dependencies, critical dates, and recovery planning."],
      ["Stakeholder Cadence", "Meetings, decisions, actions, and escalation paths that stay useful."],
      ["DVBE Partner", "Certified California DVBE support with meaningful project work."],
    ],
  },
  {
    path: "sacramento-project-management/index.html",
    title: "Sacramento Public-Sector Project Management | Cadmus",
    description:
      "Sacramento-area project management and PMO support for California agencies, public-sector programs, and prime contractors needing DVBE delivery support.",
    eyebrow: "Sacramento Region",
    h1: "Public-sector project management for Sacramento-area delivery.",
    lead:
      "Cadmus supports Sacramento agencies and primes with the operating discipline needed for complex public programs: project controls, stakeholder visibility, governance, and action accountability.",
    sections: [
      ["Regional Focus", "Sacramento public-sector work moves through procurement, governance, reporting, and multi-stakeholder delivery realities. Cadmus is built for that environment."],
      ["Prime Contractor Support", "For primes, Cadmus brings real DVBE participation, proposal credibility, and delivery capacity that can stand in front of agency teams."],
      ["Agency Support", "For agencies, Cadmus helps clarify scope, establish cadence, manage risk, and keep leadership ahead of delivery issues."],
    ],
    cards: [
      ["PMO Support", "Portfolio visibility, dashboards, risk registers, and governance cadence."],
      ["Project Recovery", "Triage for stalled work, unclear ownership, and missed milestones."],
      ["Executive Reporting", "Clear status and decisions without status theater."],
    ],
  },
  {
    path: "california-public-sector-project-management/index.html",
    title: "California Public-Sector Project Management | Cadmus",
    description:
      "Cadmus provides California public-sector project management, PMO support, governance, schedule control, and delivery leadership for agencies and prime contractors.",
    eyebrow: "California Public Sector",
    h1: "Project control for California public-sector programs.",
    lead:
      "Cadmus helps public-sector teams translate strategy into operating cadence: schedules, governance, risk management, stakeholder alignment, and disciplined follow-through.",
    sections: [
      ["Public-Sector Fluency", "California programs need more than generic project management. They need procurement awareness, documentation discipline, and clean coordination across public and private teams."],
      ["Delivery Layer", "Cadmus works in the practical middle: the meetings, decisions, dependencies, risks, issues, and executive updates that determine whether delivery stays believable."],
      ["When To Bring Us In", "Use Cadmus when the team needs senior PM capacity, a calmer PMO rhythm, schedule recovery, DVBE participation, or public-sector delivery leadership."],
    ],
    cards: [
      ["Governance", "Decision records, escalation paths, steering committee materials."],
      ["Risk Discipline", "Risks, issues, dependencies, and mitigation follow-through."],
      ["Delivery Rhythm", "Useful cadence that improves action, not meeting volume."],
    ],
  },
  {
    path: "dvbe-project-management-california/index.html",
    title: "California DVBE Project Management Partner | Cadmus",
    description:
      "Cadmus is a California-certified DVBE, SDVOSB, and SB Micro project management partner supporting agencies and prime contractors with meaningful PMO and delivery work.",
    eyebrow: "DVBE + SDVOSB + SB Micro",
    h1: "A DVBE project management partner that does the work.",
    lead:
      "Cadmus is built for primes and agencies that need certified DVBE participation tied to useful project delivery, PMO support, reporting, governance, and stakeholder coordination.",
    sections: [
      ["Meaningful Participation", "Cadmus is positioned for useful, documentable project work: PMO support, schedule management, reporting, meeting cadence, decision tracking, and delivery coordination."],
      ["Prime Teaming", "Primes can bring Cadmus in for proposal strength and practical delivery support after award, with clear roles and accountable outputs."],
      ["Credentials", "Cadmus Project Management LLC is a California certified DVBE, SDVOSB, SB Micro business, CMAS contract holder, PMP-led firm, and general liability insured partner based in Rocklin, California."],
    ],
    cards: [
      ["DVBE 2032694", "California Disabled Veteran Business Enterprise certification."],
      ["SB Micro", "California Small Business (Micro) certification for public-sector procurement."],
      ["CMAS", "California Multiple Award Schedule contract 4-25-10-1019."],
      ["PMP Led", "Credentialed project-management discipline for public programs."],
    ],
  },
  {
    path: "services/public-sector-project-management/index.html",
    title: "Public-Sector Project Management Services | Cadmus",
    description:
      "Public-sector project management services for agencies and prime contractors: planning, coordination, governance, reporting, and execution support.",
    eyebrow: "Service",
    h1: "Public-sector project management that keeps work moving.",
    lead:
      "Cadmus supports programs where deadlines, stakeholders, vendors, procurement realities, and leadership visibility all matter at once.",
    sections: [
      ["Core Work", "Integrated project plans, milestone tracking, meeting cadence, stakeholder coordination, action logs, decision records, and executive reporting."],
      ["Best Fit", "Programs that need more delivery discipline, cross-functional coordination, and calm project leadership without unnecessary process drag."],
      ["Outcome", "Clearer ownership, better visibility, fewer surprises, and a project rhythm teams can actually sustain."],
    ],
    cards: [["Planning", "Scope, milestones, dependencies, and delivery roadmap."], ["Coordination", "Teams, vendors, stakeholders, and decision paths."], ["Reporting", "Status that leadership can use quickly."]],
  },
  {
    path: "services/pmo-support/index.html",
    title: "PMO Support Services for Public Programs | Cadmus",
    description:
      "PMO support for California public-sector programs, including portfolio reporting, risk tracking, governance cadence, and executive visibility.",
    eyebrow: "Service",
    h1: "PMO support without process theater.",
    lead:
      "Cadmus helps teams create the minimum useful operating system for project visibility, accountability, governance, and delivery confidence.",
    sections: [
      ["What We Build", "Dashboards, status cycles, risk and issue registers, dependency tracking, governance materials, action logs, and portfolio-level visibility."],
      ["How It Works", "The PMO should reduce confusion, not create administrative drag. Cadmus keeps the operating model clear, useful, and decision-oriented."],
      ["Who It Serves", "Agency leaders, program managers, prime contractors, and delivery teams that need a shared view of progress and blockers."],
    ],
    cards: [["Portfolio View", "See priorities, risks, and commitments across workstreams."], ["Governance", "Right-sized forums and decision records."], ["Cadence", "Repeatable rhythms that help teams execute."]],
  },
  {
    path: "services/dvbe-partner-support/index.html",
    title: "DVBE Partner Support for Prime Contractors | Cadmus",
    description:
      "Cadmus provides California DVBE partner support for prime contractors through real project management, PMO, reporting, governance, and delivery work.",
    eyebrow: "Service",
    h1: "DVBE partner support with real delivery value.",
    lead:
      "Cadmus helps prime contractors strengthen proposals and delivery teams with certified DVBE participation tied to practical project-management outcomes.",
    sections: [
      ["Prime Value", "A stronger partner when the scope needs project management, PMO support, stakeholder coordination, reporting, and schedule discipline."],
      ["Delivery Role", "Cadmus can own useful workstreams such as status cadence, governance support, schedule tracking, action management, and executive materials."],
      ["Compliance Mindset", "The focus is meaningful work, clear ownership, and participation that can be described plainly in proposal and delivery contexts."],
    ],
    cards: [["Proposal Support", "Credible DVBE project-management capability."], ["Execution Support", "Hands-on PMO and delivery coordination."], ["Clean Ownership", "Roles and outputs that are easy to document."]],
  },
  {
    path: "services/project-controls-schedule-risk/index.html",
    title: "Project Controls, Schedule, and Risk Support | Cadmus",
    description:
      "Project controls, schedule management, risk tracking, issue resolution, and delivery governance support for public-sector programs.",
    eyebrow: "Service",
    h1: "Control the schedule before the schedule controls you.",
    lead:
      "Cadmus helps teams surface risk early, clarify ownership, recover drifting work, and keep leadership ahead of delivery trouble.",
    sections: [
      ["Project Controls", "Milestone tracking, dependency management, status cadence, risk registers, issue logs, and change visibility."],
      ["Schedule Recovery", "When work is slipping, Cadmus helps separate noise from blockers and rebuild a practical path forward."],
      ["Leadership Visibility", "Clear escalation materials, decision points, and status summaries that help leaders act before issues compound."],
    ],
    cards: [["Milestones", "Track commitments and critical dates."], ["Risks", "Identify, own, mitigate, and follow through."], ["Recovery", "Stabilize stalled or messy delivery."]],
  },
  {
    path: "about/index.html",
    title: "About Cadmus Project Management | Rocklin, CA",
    description:
      "Cadmus Project Management LLC is a Rocklin, California public-sector project management firm led by Garrett Wilkerson, a PMP and Army veteran. Cadmus is certified DVBE, SDVOSB, and SB Micro.",
    eyebrow: "About Cadmus",
    h1: "Veteran-led project discipline for public-sector delivery.",
    lead:
      "Cadmus Project Management LLC is based in Rocklin, California and supports agencies and prime contractors with PMO support, project controls, governance, and delivery leadership.",
    sections: [
      ["Founder", "Garrett Wilkerson brings Army veteran discipline, PMP standards, and more than nine years of California public-sector program experience to the work."],
      ["Business Identity", "Cadmus is a California certified DVBE, SDVOSB, SB Micro business, CMAS contract holder, and general liability insured partner focused on project management and PMO support."],
      ["Operating Belief", "The work gets better when teams have clarity, cadence, calm escalation, and someone making sure the next action actually happens."],
    ],
    cards: [["Rocklin, CA", "Serving California agencies and prime contractors."], ["DVBE + SDVOSB + SB Micro", "Certified small-business public-sector delivery partner."], ["PMP", "Credentialed project-management leadership."]],
  },
  {
    path: "contact/index.html",
    title: "Contact Cadmus Project Management | Rocklin, CA",
    description:
      "Contact Cadmus Project Management for California public-sector project management, PMO support, DVBE partner support, and capability statement requests.",
    eyebrow: "Contact",
    h1: "Start the project-management conversation.",
    lead:
      "Reach Cadmus for public-sector project support, PMO capacity, DVBE teaming, capability statements, or schedule and delivery recovery conversations.",
    sections: [
      ["Email", "Garrett@cadmusprojects.com"],
      ["Phone", "719-425-6025"],
      ["Location", "Rocklin, California. Supporting agencies and prime contractors across the Sacramento region and California."],
    ],
    cards: [["Capability Statement", "Request the current Cadmus capability statement."], ["Prime Teaming", "Discuss DVBE partner support for proposals or delivery."], ["Agency Support", "Discuss PMO, schedule, risk, and governance needs."]],
  },
];

const css = `
    :root {
      --ink: #07090c;
      --carbon: #111418;
      --graphite: #1c2127;
      --paper: #f5f1e8;
      --muted: #b9b0a4;
      --line: rgba(245, 241, 232, 0.16);
      --brass: #d6a847;
      --brass-soft: #f2d98a;
      --mint: #8fe3c1;
      --steel: #8ea1ad;
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    html { background: var(--ink); scroll-behavior: smooth; }
    body { margin: 0; color: var(--paper); background: var(--ink); font-family: Inter, Arial, sans-serif; letter-spacing: 0; }
    a { color: inherit; text-decoration: none; }
    .wrap { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
    .nav { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid rgba(245,241,232,.11); background: rgba(7,9,12,.84); backdrop-filter: blur(18px); }
    .nav-inner { min-height: 74px; display: flex; align-items: center; justify-content: space-between; gap: 22px; }
    .brand { display: inline-flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .brand-mark { width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid rgba(214,168,71,.6); border-radius: 50%; color: var(--brass-soft); font-family: "Libre Baskerville", Georgia, serif; background: rgba(214,168,71,.08); }
    .nav-links { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 18px; color: rgba(245,241,232,.78); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .nav-links a:hover { color: var(--brass-soft); }
    .button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(245,241,232,.26); border-radius: var(--radius); padding: 0 17px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .button.primary { border-color: var(--brass-soft); color: #15120b; background: linear-gradient(135deg, var(--brass-soft), var(--brass)); }
    .hero { padding: 112px 0 70px; background: linear-gradient(90deg, rgba(7,9,12,.96), rgba(7,9,12,.78)), url("/assets/cadmus-hero.png") center / cover no-repeat; border-bottom: 1px solid var(--line); }
    .kicker { display: inline-flex; align-items: center; gap: 10px; color: var(--mint); font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .kicker::before { content: ""; width: 36px; height: 2px; background: var(--mint); }
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { max-width: 940px; margin-top: 18px; font-size: clamp(44px, 7vw, 92px); line-height: .92; font-weight: 900; text-transform: uppercase; }
    .lead { max-width: 760px; color: rgba(245,241,232,.82); font-size: clamp(18px, 2vw, 23px); line-height: 1.45; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    .section { padding: 76px 0; }
    .section.paper { color: #16130d; background: var(--paper); }
    .section.metal { background: linear-gradient(180deg, var(--carbon), var(--graphite)); }
    .section-head { max-width: 780px; margin-bottom: 30px; }
    .section-head h2 { font-size: clamp(32px, 5vw, 62px); line-height: 1; text-transform: uppercase; }
    .section-head p, .body-copy { color: rgba(245,241,232,.72); font-size: 17px; line-height: 1.75; }
    .paper .section-head p, .paper .body-copy { color: rgba(22,19,13,.72); }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .card { min-height: 190px; border: 1px solid var(--line); border-radius: var(--radius); padding: 22px; background: rgba(255,255,255,.035); }
    .paper .card { border-color: rgba(22,19,13,.16); background: rgba(22,19,13,.04); }
    .card h3 { margin-bottom: 12px; color: var(--brass-soft); font-size: 18px; text-transform: uppercase; }
    .paper .card h3 { color: #7b5512; }
    .card p { margin: 0; color: rgba(245,241,232,.72); line-height: 1.65; }
    .paper .card p { color: rgba(22,19,13,.74); }
    .detail { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .detail article { border-top: 1px solid currentColor; padding-top: 18px; }
    .detail h2 { margin-bottom: 12px; font-size: 24px; text-transform: uppercase; }
    .detail p { margin: 0; font-size: 17px; line-height: 1.75; color: rgba(22,19,13,.74); }
    .cta { padding: 70px 0; background: var(--ink); }
    .cta-inner { display: flex; justify-content: space-between; gap: 28px; align-items: center; border-top: 1px solid var(--line); padding-top: 34px; }
    .contact-list { display: grid; gap: 10px; color: rgba(245,241,232,.82); font-weight: 800; }
    footer { padding: 26px 0; border-top: 1px solid var(--line); color: rgba(245,241,232,.58); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .footer-inner { display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
    @media (max-width: 820px) {
      .nav-inner, .cta-inner { align-items: flex-start; flex-direction: column; }
      .nav-links { justify-content: flex-start; }
      .hero { padding-top: 74px; }
      .grid, .detail { grid-template-columns: 1fr; }
    }
`;

function nav() {
  return `
    <nav class="nav" aria-label="Primary navigation">
      <div class="wrap nav-inner">
        <a class="brand" href="/" aria-label="Cadmus Project Management home">
          <span class="brand-mark">C</span>
          <span>Cadmus Project Management</span>
        </a>
        <div class="nav-links">
          <a href="/services/public-sector-project-management/">Services</a>
          <a href="/rocklin-project-management/">Rocklin</a>
          <a href="/sacramento-project-management/">Sacramento</a>
          <a href="/dvbe-project-management-california/">DVBE</a>
          <a href="/resources/epc-project-controls/">Toolkit</a>
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
        </div>
      </div>
    </nav>`;
}

function schema(page) {
  const url = `${baseUrl}/${page.path.replace(/index\.html$/, "")}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#business`,
        name: "Cadmus Project Management LLC",
        url: baseUrl,
        image: `${baseUrl}/assets/cadmus-hero.png`,
        telephone: "+1-719-425-6025",
        email: "Garrett@cadmusprojects.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Rocklin",
          addressRegion: "CA",
          addressCountry: "US",
        },
        areaServed: ["Rocklin CA", "Sacramento CA", "Placer County CA", "California"],
        description:
          "California public-sector project management, PMO support, project controls, and DVBE partner support.",
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: page.h1,
        serviceType: page.eyebrow,
        provider: { "@id": `${baseUrl}/#business` },
        areaServed: ["Rocklin CA", "Sacramento CA", "California"],
        url,
        description: page.description,
      },
    ],
  });
}

function renderPage(page) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <link rel="canonical" href="${baseUrl}/${page.path.replace(/index\.html$/, "")}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:image" content="${baseUrl}/assets/cadmus-hero.png">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Libre+Baskerville:wght@700&display=swap" rel="stylesheet">
  <script type="application/ld+json">${schema(page)}</script>
  <style>${css}</style>
</head>
<body>
  ${nav()}
  <main>
    <section class="hero">
      <div class="wrap">
        <div class="kicker">${page.eyebrow}</div>
        <h1>${page.h1}</h1>
        <p class="lead">${page.lead}</p>
        <div class="hero-actions">
          <a class="button primary" href="mailto:Garrett@cadmusprojects.com?subject=Cadmus%20Project%20Support">Start a Conversation</a>
          <a class="button" href="/contact/">Contact Cadmus</a>
        </div>
      </div>
    </section>
    <section class="section paper">
      <div class="wrap">
        <div class="section-head">
          <h2>Built for local visibility and real buyers.</h2>
          <p>${page.description}</p>
        </div>
        <div class="detail">
          ${page.sections.map(([heading, text]) => `<article><h2>${heading}</h2><p>${text}</p></article>`).join("\n          ")}
        </div>
        ${
          page.path === "services/project-controls-schedule-risk/index.html"
            ? `<div class="hero-actions">
          <a class="button primary" href="/resources/epc-project-controls/">View Project Controls Toolkit</a>
        </div>`
            : ""
        }
      </div>
    </section>
    <section class="section metal">
      <div class="wrap">
        <div class="section-head">
          <h2>Where Cadmus helps.</h2>
          <p>Focused project management, PMO, governance, schedule, and delivery support for California public-sector environments.</p>
        </div>
        <div class="grid">
          ${page.cards.map(([heading, text]) => `<article class="card"><h3>${heading}</h3><p>${text}</p></article>`).join("\n          ")}
        </div>
      </div>
    </section>
    <section class="cta">
      <div class="wrap cta-inner">
        <div>
          <div class="kicker">Cadmus Project Management</div>
          <h2>Ready when the work is real.</h2>
        </div>
        <div class="contact-list">
          <a href="mailto:Garrett@cadmusprojects.com">Garrett@cadmusprojects.com</a>
          <a href="tel:17194256025">719-425-6025</a>
          <span>Rocklin, California</span>
        </div>
      </div>
    </section>
  </main>
  <footer>
    <div class="wrap footer-inner">
      <span>Cadmus Project Management LLC</span>
      <span>DVBE 2032694 | SB Micro | CMAS 4-25-10-1019 | PMP | SDVOSB | General Liability Insured</span>
    </div>
  </footer>
</body>
</html>
`;
}

for (const page of pages) {
  const outputPath = join(root, page.path);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderPage(page), "utf8");
}

const urls = [
  "",
  ...pages.map((page) => page.path.replace(/index\.html$/, "")),
  "resources/epc-project-controls/",
];

writeFileSync(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${baseUrl}/${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${url === "" ? "1.0" : "0.8"}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>\n`,
  "utf8",
);

let index = readFileSync(join(root, "index.html"), "utf8");
const homeSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#business`,
      name: "Cadmus Project Management LLC",
      url: baseUrl,
      image: `${baseUrl}/assets/cadmus-hero.png`,
      telephone: "+1-719-425-6025",
      email: "Garrett@cadmusprojects.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Rocklin",
        addressRegion: "CA",
        addressCountry: "US",
      },
      areaServed: ["Rocklin CA", "Sacramento CA", "Placer County CA", "California"],
      description:
        "California public-sector project management, PMO support, project controls, and DVBE partner support.",
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "Cadmus Project Management",
      url: baseUrl,
      publisher: { "@id": `${baseUrl}/#business` },
    },
  ],
});
index = index
  .replace(
    /<meta property="og:type" content="website">[\s\S]*?<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/,
    `<meta property="og:type" content="website">\n  <link rel="canonical" href="${baseUrl}/">\n  <script type="application/ld+json">${homeSchema}</script>\n  <link rel="preconnect" href="https://fonts.googleapis.com">`,
  )
  .replace(
    /<div class="nav-links">[\s\S]*?<\/div>\s*<a class="nav-cta"/,
    `<div class="nav-links">\n          <a href="#work">Work</a>\n          <a href="/services/public-sector-project-management/">Services</a>\n          <a href="/rocklin-project-management/">Rocklin</a>\n          <a href="/sacramento-project-management/">Sacramento</a>\n          <a href="/dvbe-project-management-california/">DVBE</a>\n          <a href="/resources/epc-project-controls/">Toolkit</a>\n          <a href="/about/">About</a>\n        </div>\n        <a class="nav-cta"`,
  )
  .replace("Letâ€™s make the next program room calmer.", "Let's make the next program room calmer.");

writeFileSync(join(root, "index.html"), index, "utf8");

console.log(`Generated ${pages.length} pages and sitemap.xml`);
