import {
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlay,
  Globe2,
  Layers3,
  LayoutTemplate,
  MousePointer2,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
} from "lucide-react";

const features = [
  {
    icon: LayoutTemplate,
    title: "A store that feels like you",
    copy: "Start with a beautiful theme, then shape every section around your brand.",
  },
  {
    icon: MousePointer2,
    title: "Design visually",
    copy: "Move sections, edit content, tune colours and typography, and preview every change live.",
  },
  {
    icon: Package,
    title: "Products made simple",
    copy: "Manage products, variants, collections, images, pricing and stock in one calm workspace.",
  },
  {
    icon: ShoppingBag,
    title: "A smoother way to sell",
    copy: "Give shoppers a polished product, cart and checkout experience on every device.",
  },
  {
    icon: Globe2,
    title: "Your own web address",
    copy: "Launch on your Market Nest address or connect a domain you already own.",
  },
  {
    icon: ShieldCheck,
    title: "Your business stays yours",
    copy: "Private merchant workspaces keep each store's products, customers and orders separate.",
  },
];

const templates = [
  { name: "The Edit", type: "Fashion & apparel", className: "template-fashion", label: "NEW SEASON", title: "Made to
move with you", action: "Discover the collection" },
  { name: "Sunday Market", type: "Home & lifestyle", className: "template-home", label: "SLOW LIVING", title: "A softer way
to live", action: "Explore the edit" },
  { name: "Good Form", type: "Beauty & wellness", className: "template-beauty", label: "YOUR DAILY RITUAL", title: "Feel good
in your skin", action: "Shop essentials" },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="section-label"><span className="label-dot" />{children}</span>;
}

export default function Home() {
  return (
    <main>
      <div className="announcement">
        <Sparkles size={14} />
        <span>Your next chapter starts here.</span>
        <a href="#templates">Explore the store builder <ArrowRight size={13} /></a>
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="Market Nest home">
          <BrandMark />
          <span>market<span className="brand-light">nest</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#templates">Themes</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <a className="login-link" href="/login">Log in</a>
          <a className="button button-dark button-small" href="/signup">Start your store <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <SectionLabel>THE ONLINE STORE BUILDER</SectionLabel>
          <h1>Your business.<br /><span>Your kind of</span><br /><em>beautiful.</em></h1>
          <p className="hero-description">
            Everything you need to create an online store that looks incredible and works beautifully. Design it your way. Make it yours. Start selling.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="/signup">Create your store <ArrowRight size={17} /></a>
            <a className="watch-link" href="#how-it-works"><span><CirclePlay size={19} /></span> See how it works</a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><i>M</i><i>A</i><i>T</i><i>+</i></div>
            <span><strong>Made for ambitious businesses</strong><br />From first idea to your next big thing.</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="float-card float-top"><span className="float-icon"><Palette size={16} /></span><span><b>Your style, your rules</b><small>Every detail is editable</small></span><Check size={16} className="float-check" /></div>
          <div className="browser-window">
            <div className="browser-top"><div className="browser-dots"><i /><i /><i /></div><span>atelier.marketnest.store</span><div className="browser-menu">•••</div></div>
            <div className="store-preview">
              <div className="preview-nav"><b>ATELIER.</b><span>NEW IN&nbsp;&nbsp;&nbsp; CLOTHING&nbsp;&nbsp;&nbsp; ABOUT</span><ShoppingBag size={16} /></div>
              <div className="preview-hero">
                <div className="preview-hero-copy"><small>THE EVERYDAY COLLECTION</small><strong>Find your<br />own rhythm.</strong><span>Thoughtful pieces for wherever life takes you.</span><b>SHOP THE COLLECTION ↗</b></div>
                <div className="preview-photo"><div className="photo-sun" /><div className="photo-figure" /><div className="photo-caption">01 / 04</div></div>
              </div>
              <div className="preview-bottom"><span>DESIGNED TO BE LIVED IN</span><span>MADE WITH INTENTION</span><span>EST. 2026</span></div>
            </div>
          </div>
          <div className="float-card float-bottom"><span className="sparkle-bubble"><WandSparkles size={17} /></span><span><b>Live visual editor</b><small>See changes as you make them</small></span></div>
          <div className="tiny-sticker"><Sparkles size={17} /><span>Made<br />by you</span></div>
        </div>
      </section>

      <div className="trust-strip">
        <span>YOUR BRAND, FRONT AND CENTRE</span><i /><span>BUILT FOR THE WAY YOU SELL</span><i /><span>NO CODE NEEDED</span><i /><span>READY WHEN YOU ARE</span>
      </div>

      <section className="section features-section" id="features">
        <div className="section-heading">
          <SectionLabel>MORE THAN A WEBSITE</SectionLabel>
          <h2>All the tools. <em>One lovely place.</em></h2>
          <p>From the first product photo to the order confirmation, run your online business without the busywork.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, copy }, index) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={21} strokeWidth={1.7} /></div>
              <span className="feature-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <ArrowRight size={17} className="feature-arrow" />
            </article>
          ))}
        </div>
      </section>

      <section className="section templates-section" id="templates">
        <div className="templates-heading">
          <div><SectionLabel>A HEAD START ON BEAUTIFUL</SectionLabel><h2>Find your <em>look.</em></h2></div>
          <a className="text-link" href="/themes">Explore all themes <ArrowRight size={16} /></a>
        </div>
        <div className="template-grid">
          {templates.map((template) => (
            <article className="template-card" key={template.name}>
              <div className={`template-art ${template.className}`}>
                <div className="template-mini-nav"><b>{template.name.toUpperCase()}.</b><span>SHOP&nbsp;&nbsp; ABOUT&nbsp;&nbsp; BAG (0)</span></div>
                <div className="template-art-copy"><small>{template.label}</small><strong>{template.title.split("\n").map((line) => <span key={line}>{line}</span>)}</strong><a>{template.action} ↗</a></div>
                <div className="template-art-shape" />
                <span className="template-art-index">01 — 04</span>
              </div>
              <div className="template-meta"><div><h3>{template.name}</h3><p>{template.type}</p></div><span className="template-arrow"><ArrowRight size={17} /></span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="editor-section" id="how-it-works">
        <div className="editor-copy">
          <SectionLabel>YOUR CREATIVE SPACE</SectionLabel>
          <h2>Dream it.<br /><em>Drag it.</em><br />Make it yours.</h2>
          <p>Meet the visual store editor. Choose a section, make it yours, and watch your storefront come together in real time. No code, no complicated setup — just your ideas taking shape.</p>
          <ul className="check-list">
            <li><Check size={16} /> Drag-and-drop page sections</li>
            <li><Check size={16} /> Live desktop and mobile preview</li>
            <li><Check size={16} /> Custom colours, fonts and layouts</li>
            <li><Check size={16} /> Save drafts and publish when ready</li>
          </ul>
          <a className="button button-light" href="/signup">Build your storefront <ArrowRight size={16} /></a>
        </div>
        <div className="editor-mock">
          <div className="editor-toolbar"><div className="editor-brand"><BrandMark /> <b>Store editor</b></div><span className="draft-pill">● Draft saved</span><div className="device-toggle"><span>Desktop</span><span>Mobile</span></div><button>Publish store ↗</button></div>
          <div className="editor-workspace">
            <aside className="editor-sidebar"><b>PAGE CONTENTS</b><div className="editor-side-active"><Layers3 size={15} /> Header <span>⋮</span></div><div><Layers3 size={15} /> Hero banner <span>⋮</span></div><div><Layers3 size={15} /> Featured collection <span>⋮</span></div><div><Layers3 size={15} /> Image with text <span>⋮</span></div><button>＋ Add section</button><hr /><b>THEME SETTINGS</b><div><Palette size={15} /> Colours</div><div><WandSparkles size={15} /> Typography</div></aside>
            <div className="editor-canvas"><div className="canvas-page"><div className="canvas-store-nav">ATELIER. <span>NEW IN&nbsp;&nbsp; CLOTHING&nbsp;&nbsp; ABOUT</span><ShoppingBag size={14} /></div><div className="canvas-banner"><div><small>THE EVERYDAY COLLECTION</small><strong>Find your<br />own rhythm.</strong><p>Thoughtful pieces for wherever life takes you.</p><b>SHOP NOW ↗</b></div><div className="canvas-image"><div /></div></div><div className="canvas-selected">SELECTED SECTION <span>✣</span></div><div className="canvas-products"><i /><i /><i /></div></div></div>
          </div>
        </div>
      </section>

      <section className="section steps-section">
        <div className="section-heading"><SectionLabel>IT'S EASIER THAN YOU THINK</SectionLabel><h2>From idea to <em>open for business.</em></h2></div>
        <div className="steps-grid">
          <article><span>01</span><div className="step-icon"><Store size={22} /></div><h3>Make it yours</h3><p>Create your account, name your store and choose a starting theme.</p></article>
          <article><span>02</span><div className="step-icon"><Palette size={22} /></div><h3>Make it beautiful</h3><p>Add your products, customise your pages and make every detail feel right.</p></article>
          <article><span>03</span><div className="step-icon"><Globe2 size={22} /></div><h3>Make it live</h3><p>Connect your domain, set up checkout and share your store with the world.</p></article>
        </div>
      </section>

      <section className="pricing-banner" id="pricing">
        <div><SectionLabel>SIMPLE, GROW-WITH-YOU PLANS</SectionLabel><h2>Your next big thing<br />deserves a <em>great start.</em></h2><p>Start with what you need. Upgrade as your business grows. No long-term commitment required.</p></div>
        <div className="pricing-side"><div className="price-note"><span>Plans designed for every stage</span><strong>From ₦5,000 <small>/ month</small></strong><small>Monthly and annual options</small></div><a className="button button-dark" href="/pricing">Explore plans <ArrowRight size={16} /></a><span className="pricing-footnote"><Check size={14} /> No setup fee · Cancel anytime</span></div>
      </section>

      <footer className="site-footer">
        <a className="brand" href="#"><BrandMark /><span>market<span className="brand-light">nest</span></span></a>
        <span>Make a little space for big ideas.</span>
        <div><a href="#features">Features</a><a href="#templates">Themes</a><a href="/pricing">Pricing</a><a href="/login">Log in</a></div>
        <small>© 2026 Market Nest. Made for what’s next.</small>
      </footer>
    </main>
  );
}
