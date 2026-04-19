// ===== Terminal Typewriter Effect =====
const demos = [
  {
    command: 'devos goal "Build a Twitter clone with auth and deploy it"',
    output: `
<span class="info">🎯 DevOS Goal Mode — Full Autopilot</span>

<span class="info">📋 Phase 1: Planning...</span>
  1. Initialize Next.js project with Tailwind CSS
  2. Create database schema (users, tweets, follows)
  3. Build authentication system (JWT + OAuth)
  4. Create API routes (tweets, users, feed)
  5. Build UI components (feed, profile, compose)
  6. Add real-time updates with WebSocket
  7. Run tests
  8. Deploy to Vercel

<span class="success">✅ [1/8] Project initialized</span>
<span class="success">✅ [2/8] Database schema created</span>
<span class="success">✅ [3/8] Auth system built</span>
<span class="success">✅ [4/8] API routes generated</span>
<span class="success">✅ [5/8] UI components built</span>
<span class="success">✅ [6/8] WebSocket integrated</span>
<span class="success">✅ [7/8] All 24 tests passing</span>
<span class="success">✅ [8/8] Deployed to Vercel</span>

<span class="success">🌐 Live: https://twitter-clone-abc.vercel.app</span>`
  },
  {
    command: 'devos auto',
    output: `
<span class="info">🔄 DevOS Auto Loop</span>

--- Iteration 1/10 ---
<span class="warn">✗ Error: Cannot find module 'express'</span>
<span class="info">🔧 Fix: npm install express</span>
<span class="success">✓ Installed missing dependency</span>

--- Iteration 2/10 ---
<span class="warn">✗ TypeError: Cannot read property 'id' of undefined</span>
<span class="info">🔧 Fix: Added null check in user route handler</span>
<span class="success">✓ Applied fix in routes/user.js</span>

--- Iteration 3/10 ---
<span class="success">✅ Application running without errors!</span>
<span class="success">🌐 http://localhost:3000</span>`
  },
  {
    command: 'devos deploy --target=vercel',
    output: `
<span class="info">🚀 DevOS Deploy</span>

Detected: Next.js (fullstack)
Building project...
<span class="success">✓ Build successful</span>
Deploying to Vercel...
<span class="success">✓ Deployed successfully!</span>

<span class="success">🌐 Live URL: https://my-app.vercel.app</span>
<span class="info">📊 Dashboard: https://vercel.com/dashboard</span>`
  }
];

let currentDemo = 0;
let charIndex = 0;
let isTyping = false;

function typeCommand() {
  const demo = demos[currentDemo];
  const typewriter = document.getElementById('typewriter');
  const output = document.getElementById('output');

  if (!typewriter || !output) return;

  if (charIndex === 0) {
    typewriter.textContent = '';
    output.innerHTML = '';
    isTyping = true;
  }

  if (charIndex < demo.command.length) {
    typewriter.textContent += demo.command[charIndex];
    charIndex++;
    setTimeout(typeCommand, 30 + Math.random() * 40);
  } else {
    // Command fully typed, show output
    setTimeout(() => {
      output.innerHTML = demo.output;
      isTyping = false;

      // Move to next demo
      setTimeout(() => {
        charIndex = 0;
        currentDemo = (currentDemo + 1) % demos.length;
        typeCommand();
      }, 5000);
    }, 500);
  }
}

// ===== Navigation Toggle =====
function toggleNav() {
  const links = document.querySelector('.nav-links');
  links.classList.toggle('open');
}

// ===== Copy Install Command =====
function copyInstall() {
  navigator.clipboard.writeText('npm install -g devos-ai').then(() => {
    const btns = document.querySelectorAll('.copy-btn');
    btns.forEach(btn => {
      const original = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = original, 2000);
    });
  });
}

// ===== Scroll Effects =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  },
  { threshold: 0.1 }
);

document.addEventListener('DOMContentLoaded', () => {
  // Start terminal animation
  setTimeout(typeCommand, 1000);

  // Observe animated elements
  document.querySelectorAll('.feature-card, .agent-card, .model-card, .deploy-step').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (window.scrollY > 20) {
      nav.style.borderBottomColor = 'rgba(30, 30, 46, 0.8)';
    } else {
      nav.style.borderBottomColor = 'transparent';
    }
  });
});
