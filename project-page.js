const projectData = {
  "wired-wings": {
    title: "Wired Wings", date: "May 2026", tools: "Houdini · Karma XPU", role: "Procedural Modeling & Animation",
    intro: "A procedural reconstruction of a kinetic installation, translating a complex mechanical armature into a controllable system of geometry, constraints, and analytical motion.",
    hero: "../file/wired-wings/ProceduralMotion.mp4", poster: "../file/wired-wings/ProceduralMotion.jpg", video: true,
    sections: [
      ["01 · Challenge", "Mechanical motion, rebuilt as a system", ["The sculpture combines paper wings, steel-wire arms, circular joints, and counterweights. The goal was to preserve the character of the original installation while making every repeated unit procedural and animation-ready."]],
      ["02 · Controller", "Cam–follower mechanism", ["A continuously rotating cam drives an oscillating follower arm. The cam center is evaluated each frame, while atan2 and acos solve the tangent angle required to orient the follower against the circle.", "This converts continuous rotation into the rhythmic swing that powers the wing system."]],
      ["03 · Linkage", "Analytical triangle solution", ["Wing attachment points and ring joints form a fixed-length triangle linkage. Each frame, the law of cosines resolves the world-space rotation of the connected arms as the driven point moves."]],
      ["04 · Result", "A reusable kinetic assembly", ["Intersection Analysis extracts stable contact points regardless of rotation. The completed setup generates synchronized flapping motion with approximately 322,000 polygons and a render time of about 1.8 minutes per frame."]]
    ],
    gallery: [["image","../file/breakdown-assets/wired-wings/reference.webp","Reference and procedural reconstruction"],["image","../file/breakdown-assets/wired-wings/controller.webp","Cam-follower controller setup"],["image","../file/breakdown-assets/wired-wings/linkage.webp","Analytical linkage construction"],["image","../file/breakdown-assets/wired-wings/system.webp","Endpoint and suspension system"],["image","../file/wired-wings/ProceduralMotion.jpg","Final procedural assembly"]]
  },
  "procedural-building": {
    title: "Procedural Building", date: "April 2026", tools: "Houdini · Karma CPU", role: "Procedural Modeling",
    intro: "A customizable apartment-building generator inspired by The Bowery in Savannah, with parameters for massing, floors, facade modules, roof details, and materials.",
    hero: "../file/procedural-building/cut.mp4", poster: "../file/procedural-building/render_1.jpg", video: true,
    sections: [
      ["01 · Controls", "Artist-friendly building parameters", ["Width, height, depth, floor height, column spacing, window width, door width, and balcony height expose the major design decisions without requiring node-level edits."]],
      ["02 · Generation", "One network, multiple floor types", ["A foreach loop stacks floors along the vertical axis. Iteration-aware expressions distinguish the ground, middle, and top floors inside one compact procedural network."]],
      ["03 · Placement", "Rule-based facade assembly", ["Line, Delete, and Copy to Points workflows place windows, doors, and columns. Element counts respond automatically when the building dimensions change."]],
      ["04 · Materials", "Attribute-driven assignment", ["Name attributes are embedded as components are created, converted into primitive groups after merging, and used for automatic material assignment. The final building contains roughly 47,000 primitives."]]
    ],
    gallery: [["image","../file/breakdown-assets/procedural-building/parameters.webp","Exposed building parameters"],["image","../file/breakdown-assets/procedural-building/floor-types.webp","Procedural floor-type assembly"],["image","../file/breakdown-assets/procedural-building/combined-body.webp","Combined building body"],["image","../file/breakdown-assets/procedural-building/network.webp","Houdini network organization"],["image","../file/procedural-building/render_5.jpg","Final render"]]
  },
  "ember-field": {
    title: "Ember Field", date: "March 2026", tools: "Python · Maya", role: "Tool Development",
    intro: "An artist-facing Maya tool that samples mesh vertices and procedurally generates modular campfires, sparks, and secondary elements with controlled variation.",
    hero: "../file/ember-field/r_1.jpg",
    sections: [
      ["01 · System", "Vertex-based scattering", ["The tool samples all or a user-defined subset of selected mesh vertices. Separate point sets control campfires and denser secondary spark distributions."]],
      ["02 · Asset Build", "Modular procedural campfires", ["Each asset combines randomized firewood, layered flame geometry, emission shaders, sparks, stems, and stars. Quantity, scale, color, and twist are varied within controlled ranges."]],
      ["03 · Orientation", "Consistent spatial direction", ["A custom aim_to_origin function creates a temporary locator and aim constraint, applies the resulting rotation, then cleans the helper nodes. Generated elements consistently radiate toward the scene center."]],
      ["04 · Interface", "A safer Maya GUI workflow", ["The Camp Fire Scatter interface exposes density and selection behavior. Callback and return-value errors were resolved by accepting Maya's UI arguments and ensuring get_points always returns a consistent tuple."]]
    ],
    gallery: [["image","../file/breakdown-assets/ember-field/reference.webp","Visual reference and target"],["image","../file/breakdown-assets/ember-field/aim-code.webp","Custom orientation function"],["image","../file/breakdown-assets/ember-field/scatter-result.webp","Procedural scattering result"],["image","../file/breakdown-assets/ember-field/gui.webp","Camp Fire Scatter interface"],["image","../file/breakdown-assets/ember-field/debugging.webp","GUI callback debugging"],["image","../file/ember-field/r_4.jpg","Final field"]]
  },
  "kelp-forest": {
    title: "Kelp Forest", date: "April 2026", tools: "Houdini · Karma", role: "Procedural Environment & FX",
    intro: "A dense underwater ecosystem combining procedural kelp, simulated fish schools, terrain, water volume, and atmospheric lighting.",
    hero: "../file/kelp-forest/kelp-web.mp4", poster: "../file/kelp-forest/kelp.jpg", video: true,
    sections: [
      ["01 · Kelp", "Organic form through reusable controls", ["Two ramps control leaf width, taper, waviness, and irregularity. The procedural leaf feeds an L-system that generates multiple kelp structures for scattering."]],
      ["02 · Distribution", "Variation at environment scale", ["Points scattered across the height field receive randomized variant attributes before Copy to Points distributes five kelp variations throughout the scene."]],
      ["03 · Fish", "POP-driven schooling motion", ["Particles emitted from a circular source are shaped by drag, axis force, and attribute noise. Trails become curves, and sweep operations construct procedural fish bodies and tails aligned to the simulation."]],
      ["04 · Atmosphere", "Depth through volume and light", ["A HeightField forms the terrain, an extruded mountain grid forms the water volume, and VDB fog creates falloff. The final scene contains about 39.1 million polygons and 1.2 million curves."]]
    ],
    gallery: [["image","../file/breakdown-assets/kelp-forest/reference-render.webp","Reference and final render"],["image","../file/breakdown-assets/kelp-forest/leaf-network.webp","Procedural kelp leaf network"],["image","../file/breakdown-assets/kelp-forest/fish-system.webp","POP fish-school system"],["image","../file/breakdown-assets/kelp-forest/environment-network.webp","Environment and volume network"],["image","../file/kelp-forest/kelp.jpg","Final Karma render"]]
  },
  "steam-clock-integration": {
    title: "Steam Clock Integration", date: "March 2026", tools: "Maya · Houdini · Nuke", role: "VFX Integration",
    intro: "An end-to-end live-action VFX shot integrating a CG steam clock through camera tracking, asset development, volumetric effects, layered rendering, and compositing.",
    hero: "../file/steam-clock-integration/clock.mp4", poster: "../file/steam-clock-integration/clock.png", video: true,
    sections: [
      ["01 · Tracking", "Establishing a reliable camera", ["The plate was camera-tracked in Nuke and transferred into the 3D pipeline. Focal length and perspective were iteratively corrected to anchor the clock to the photographed environment."]],
      ["02 · FX", "Localized smoke and atmospheric fog", ["A Houdini Pyro simulation produced the clock's smoke plume and was exported as VDB for Maya. A separate density-volume setup created broad procedural fog for depth."]],
      ["03 · Rendering", "Layered control for compositing", ["Arnold Render Setup separated the clock, smoke, fog, shadows, and reflections so each contribution could be refined independently."]],
      ["04 · Composite", "Matching light, material, and perspective", ["Nuke iterations addressed emission transparency, focal mismatch, shader inconsistency, and material color until the CG element shared the plate's lighting and spatial logic."]]
    ],
    gallery: [["image","../file/breakdown-assets/steam-clock-integration/tracking.webp","Nuke camera tracking"],["image","../file/breakdown-assets/steam-clock-integration/pyro.webp","Localized Houdini Pyro setup"],["image","../file/breakdown-assets/steam-clock-integration/atmosphere.webp","Procedural atmospheric fog"],["image","../file/breakdown-assets/steam-clock-integration/render-layers.webp","Arnold layered rendering"],["image","../file/breakdown-assets/steam-clock-integration/final.webp","Final composited output"]]
  },
  "newtons-cradle": {
    title: "Newton’s Cradle", date: "February 2026", tools: "Python · Maya", role: "Procedural Animation",
    intro: "A fully scripted Maya scene combining modular character construction, automatic alignment, procedural shading, and seamless expression-driven motion.",
    hero: "../file/newtons-cradle/NewtonsCradle-web.mp4", poster: "../file/newtons-cradle/NewtonsCradle.jpg", video: true,
    sections: [
      ["01 · Architecture", "A scene generated from modular functions", ["Separate Python functions build bodies, heads, hair, legs, frames, grass, lights, shaders, cameras, and render settings. A single main function assembles the final scene."]],
      ["02 · Alignment", "Bounding-box-driven placement", ["World-space bounding boxes measure character and support geometry. Their extents determine proportional scale and centered placement without manual offsets."]],
      ["03 · Motion", "A mathematically seamless loop", ["Sine expressions use a configurable total frame count. Completing one full sine cycle across the range guarantees that the end state returns to the start state."]],
      ["04 · Reuse", "Parameterized character behavior", ["Reverse and single parameters control direction and whether a character includes the swing structure. Procedural Arnold shaders combine Standard Surface, noise, and ramp nodes without image textures."]]
    ],
    gallery: [["image","../file/breakdown-assets/newtons-cradle/character.webp","Procedural character construction"],["image","../file/breakdown-assets/newtons-cradle/shaders.webp","Generated shader library"],["image","../file/breakdown-assets/newtons-cradle/code.webp","Python system structure"],["image","../file/breakdown-assets/newtons-cradle/scene.webp","Complete generated scene"],["image","../file/newtons-cradle/NewtonsCradle.jpg","Procedurally generated scene"]]
  },
  "woven-motion": {
    title: "Woven Motion", date: "February 2026", tools: "Python · Maya", role: "Data-Driven Animation",
    intro: "A pipeline that parses external pixel-art data and reconstructs it as a scalable, animated three-dimensional quilt.",
    hero: "../file/woven-motion/AnimatedQuilt.mp4", poster: "../file/woven-motion/AnimatedQuilt.gif", video: true,
    sections: [
      ["01 · Input", "Parsing external pixel data", ["Each .c file is parsed for frame count, width, height, and hexadecimal pixel values. Data is grouped by tile and organized into frame-based dictionaries."]],
      ["02 · Palette", "Shared materials across animation", ["Hex colors are normalized to RGB and deduplicated into one shared palette per tile, allowing shaders to be reused across all frames."]],
      ["03 · Reconstruction", "From pixels to animated geometry", ["The script builds geometry for each frame and uses visibility animation to reconstruct the source pixel art. Rows and columns expose the overall quilt layout."]],
      ["04 · Debugging", "Reliable frame generation", ["An early return inside the construction loop stopped generation after one row. Moving the return outside the loop restored the full tile and clarified the pipeline's control flow."]]
    ],
    gallery: [["image","../file/breakdown-assets/woven-motion/frame-01.webp","Source animation frame 01"],["image","../file/breakdown-assets/woven-motion/frame-02.webp","Source animation frame 02"],["image","../file/breakdown-assets/woven-motion/layout.webp","Procedural tile layout"],["image","../file/breakdown-assets/woven-motion/debugging.webp","Animation build debugging"],["image","../file/breakdown-assets/woven-motion/updated-system.webp","Updated script and hierarchy"],["image","../file/woven-motion/AnimatedQuilt.gif","Animated quilt output"]]
  },
  "yellowstone": {
    title: "Yellowstone", date: "May 2026", tools: "Unreal Engine 5", role: "Real-Time Environment",
    intro: "A cinematic real-time landscape study inspired by Yellowstone National Park, focused on terrain, natural composition, atmosphere, and lighting.",
    hero: "../file/yellow-stone/Zhang_LandscapeAnimation.mp4", poster: "../file/yellow-stone/ss.jpg", video: true,
    sections: [
      ["01 · Environment", "Building a readable wilderness composition", ["Mountain silhouettes, water, vegetation, and foreground reeds are layered to create depth and lead the eye through the landscape."]],
      ["02 · Lighting", "Real-time atmosphere", ["Directional light, sky contribution, fog, and reflection balance establish a calm cinematic time of day while preserving terrain readability."]],
      ["03 · Output", "A camera-led environment study", ["The final animation uses a controlled camera path to present the environment as a coherent real-time sequence rather than a static scene."]]
    ],
    gallery: [["image","../file/yellow-stone/ss.jpg","Unreal Engine environment"]]
  },
  "crimson-still-life": {
    title: "Crimson Still Life", date: "March 2026", tools: "Houdini · Nuke · Maya", role: "Look Development",
    intro: "A stylized still-life study exploring procedural shading, specular response, cinematic lighting, and color finishing.",
    hero: "../file/crimson/cc.jpg",
    sections: [
      ["01 · Materials", "Procedural surface development", ["Materials were developed with VEX to control specular behavior, surface variation, and the way forms respond to light."]],
      ["02 · Lighting", "Shape through contrast", ["Directional lighting and a restricted crimson palette create separation, depth, and a focused cinematic atmosphere."]],
      ["03 · Finishing", "Color cohesion in Nuke", ["The final image was graded in Nuke to balance contrast, refine color relationships, and unify the composition."]]
    ], gallery: [["image","../file/crimson/cc.jpg","Final still life"]]
  },
  "cactus-still-life": {
    title: "Cactus Still Life", date: "2026", tools: "Houdini", role: "Procedural Modeling & Shading",
    intro: "A stylized cactus study combining procedural form, controlled repetition, material response, and presentation lighting.",
    hero: "../file/cactus/myCactus_11.png",
    sections: [
      ["01 · Form", "A modular organic subject", ["Repeated leaf forms are arranged into a readable succulent silhouette while variation in scale and rotation avoids mechanical uniformity."]],
      ["02 · Surface", "Balancing stylization and material response", ["The plant and ceramic pot use distinct roughness, color, and highlight behavior to separate soft organic forms from the harder container."]],
      ["03 · Presentation", "A compact look-development study", ["Neutral lighting and a simple environment keep the focus on silhouette, material breakup, and procedural repetition."]]
    ], gallery: [["image","../file/cactus/myCactus_11.png","Final cactus render"]]
  },
  "empty-frames": {
    title: "Empty Frames", date: "November 2025", tools: "Maya · Nuke", role: "Lighting & Compositing",
    intro: "An architectural mood study using framing, darkness, selective illumination, and compositing to build a quiet cinematic space.",
    hero: "../file/empty-frame/render_brackdown/frame.mp4", poster: "../file/empty-frame/render_brackdown/frame.jpg", video: true,
    sections: [
      ["01 · Composition", "Architecture as a visual frame", ["The theater geometry guides attention toward the screen while repeated seats and wall details establish scale and rhythm."]],
      ["02 · Lighting", "Controlled visibility", ["Low-key illumination reveals only the structural information required to read the environment, preserving a sense of emptiness and anticipation."]],
      ["03 · Composite", "Final tonal balance", ["The render was refined in compositing to manage shadow density, highlight separation, and the relationship between screen and auditorium."]]
    ], gallery: [["image","../file/empty-frame/render_brackdown/frame.jpg","Final theater frame"]]
  },
  "when-the-rain-speaks": {
    title: "When the Rain Speaks", date: "April 2025", tools: "Film · Editing · VFX", role: "Pre-production, Cinematography & Post",
    intro: "A short documentary exploring Jason Nahanee’s memories and emotional relationship with rain as a member of the Squamish community.",
    hero: "../file/when-the-rain-speaks/22828ed37bc309d681e969576a145ed5.png",
    external: "https://www.youtube.com/watch?v=JIIpxTXTt58",
    sections: [
      ["01 · Pre-production", "Structuring an intimate conversation", ["My responsibilities included storyboarding, shot design, interview planning, and defining a visual approach that could support the subject's memories without overwhelming them."]],
      ["02 · Production", "Cinematography and scene coordination", ["I contributed to scene setting, camera planning, and on-set coordination to maintain visual continuity and an attentive documentary tone."]],
      ["03 · Post-production", "Editing, montage, and graphics", ["The final narrative was shaped through editing and montage, with visual effects and motion graphics integrated where they supported context and emotional pacing."]]
    ], gallery: [["image","../file/when-the-rain-speaks/22828ed37bc309d681e969576a145ed5.png","Documentary film"]]
  }
};

const order = Object.keys(projectData);
const slug = document.body.dataset.project;
const project = projectData[slug];
const root = document.querySelector("#project-root");

const sectionMedia = {
  "wired-wings": [
    [["../file/wired-wings/ProceduralMotion.jpg", "Final procedural kinetic assembly"]],
    [["../file/breakdown-assets/wired-wings/controller.webp", "Cam-follower controller setup"]],
    [["../file/breakdown-assets/wired-wings/linkage.webp", "Analytical linkage construction"]],
    [["../file/breakdown-assets/wired-wings/system.webp", "Endpoint and suspension system"]]
  ],
  "procedural-building": [
    [["../file/breakdown-assets/procedural-building/parameters.webp", "Exposed building parameters"]],
    [["../file/breakdown-assets/procedural-building/floor-types.webp", "Procedural floor-type assembly"]],
    [],
    [["../file/breakdown-assets/procedural-building/network.webp", "Houdini network organization"]]
  ],
  "ember-field": [
    [["../file/breakdown-assets/ember-field/scatter-result.webp", "Procedural scattering result"]],
    [],
    [["../file/breakdown-assets/ember-field/aim-code.webp", "Custom orientation function"]],
    [["../file/breakdown-assets/ember-field/gui.webp", "Camp Fire Scatter interface"], ["../file/breakdown-assets/ember-field/debugging.webp", "GUI callback debugging"]]
  ],
  "kelp-forest": [
    [["../file/breakdown-assets/kelp-forest/leaf-network.webp", "Procedural kelp leaf network"]],
    [],
    [["../file/breakdown-assets/kelp-forest/fish-system.webp", "POP fish-school system"]],
    [["../file/breakdown-assets/kelp-forest/environment-network.webp", "Environment and volume network"]]
  ],
  "steam-clock-integration": [
    [["../file/breakdown-assets/steam-clock-integration/tracking.webp", "Nuke camera tracking"]],
    [["../file/breakdown-assets/steam-clock-integration/pyro.webp", "Localized Houdini Pyro setup"], ["../file/breakdown-assets/steam-clock-integration/atmosphere.webp", "Procedural atmospheric fog"]],
    [["../file/breakdown-assets/steam-clock-integration/render-layers.webp", "Arnold layered rendering"]],
    []
  ],
  "newtons-cradle": [
    [["../file/breakdown-assets/newtons-cradle/character.webp", "Procedural character construction"], ["../file/breakdown-assets/newtons-cradle/code.webp", "Python system structure"]],
    [],
    [],
    [["../file/breakdown-assets/newtons-cradle/shaders.webp", "Generated shader library"]]
  ],
  "woven-motion": [
    [["../file/breakdown-assets/woven-motion/frame-01.webp", "Source animation frame"]],
    [],
    [["../file/breakdown-assets/woven-motion/layout.webp", "Procedural tile layout"]],
    [["../file/breakdown-assets/woven-motion/debugging.webp", "Animation build debugging"]]
  ]
};

if (!project) {
  root.innerHTML = `<section class="case-header"><h1>Project not found.</h1><p><a href="../work.html">Return to Work</a></p></section>`;
} else {
  document.title = `${project.title} — Lu Zhang`;
  const hero = project.video
    ? `<video controls autoplay muted loop playsinline poster="${project.poster || ""}"><source src="${project.hero}" type="video/mp4"></video>`
    : `<img src="${project.hero}" alt="${project.title}">`;
  const mediaForSections = sectionMedia[slug] || [];
  const sections = project.sections.map(([label, title, paragraphs], sectionIndex) => {
    const inlineItems = mediaForSections[sectionIndex] || [];
    const inlineMarkup = inlineItems.length ? `<div class="case-inline-media ${inlineItems.length > 1 ? "two-up" : ""}">${inlineItems.map(([src, caption]) => `<figure><img src="${src}" alt="${caption}"><figcaption>${caption}</figcaption></figure>`).join("")}</div>` : "";
    return `<section class="case-section"><div class="case-section-label">${label}</div><div class="case-section-copy"><h2>${title}</h2>${paragraphs.map(p => `<p>${p}</p>`).join("")}${inlineMarkup}</div></section>`;
  }).join("");
  const nextSlug = order[(order.indexOf(slug) + 1) % order.length];
  const next = projectData[nextSlug];
  root.innerHTML = `
    <section class="case-header">
      <p class="eyebrow">Case Study · ${project.date}</p><h1>${project.title}</h1>
      <div class="case-lede"><p>${project.intro}</p><div class="case-facts"><p><span>Role</span><span>${project.role}</span></p><p><span>Tools</span><span>${project.tools}</span></p><p><span>Date</span><span>${project.date}</span></p>${project.external ? `<p><span>Film</span><a href="${project.external}" target="_blank" rel="noopener noreferrer">Watch ↗</a></p>` : ""}</div></div>
    </section>
    <div class="case-hero-media">${hero}</div>
    <div class="case-body">${sections}</div>
    <a class="case-next" href="${nextSlug}.html"><div><span>Next Project</span><strong>${next.title}</strong></div><span class="arrow">↗</span></a>`;
}

const resumeMenu = document.querySelector(".resume-menu");
document.addEventListener("pointerdown", event => { if (resumeMenu.open && !resumeMenu.contains(event.target)) resumeMenu.open = false; });
document.addEventListener("keydown", event => { if (event.key === "Escape") resumeMenu.open = false; });

const projectFooterIsZh = document.documentElement.dataset.lang === "zh";
document.body.insertAdjacentHTML("beforeend", `
  <a class="back-to-work" href="../work.html">
    <span>${projectFooterIsZh ? "返回全部作品" : "Back to all work"}</span><span aria-hidden="true">←</span>
  </a>
  <footer class="contact-footer" id="contact">
    <p class="eyebrow">${projectFooterIsZh ? "联系方式" : "Contact"}</p>
    <div class="contact-grid">
      <div class="contact-item"><span>${projectFooterIsZh ? "姓名" : "Name"}</span><p>${projectFooterIsZh ? "张璐" : "Lu Zhang"}</p></div>
      <div class="contact-item"><span>${projectFooterIsZh ? "邮箱" : "Email"}</span><a href="mailto:17302195162@163.com">17302195162@163.com</a></div>
      <div class="contact-item"><span>${projectFooterIsZh ? "电话" : "Phone"}</span><a href="${projectFooterIsZh ? "tel:+8617302195162" : "tel:+19126569462"}">${projectFooterIsZh ? "（+86）17302195162" : "+1 912 656 9462"}</a></div>
    </div>
    <div class="footer-bottom"><p>${projectFooterIsZh ? "技术美术" : "Technical Artist"}</p><p>© 2026 Lu Zhang</p></div>
  </footer>`);


const themeToggle = document.querySelector(".theme-toggle");
let themeIcons = `
  <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>
  <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.6 8.6 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z"></path></svg>`;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

if (themeToggle) {
  themeToggle.innerHTML = themeIcons;
  const savedTheme = localStorage.getItem("portfolio-theme");
  applyTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", nextTheme);
    applyTheme(nextTheme);
  });
}
