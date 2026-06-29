// --- SUPABASE CLIENT SETUP ---
// Using a renamed variable "supabaseClient" to avoid SyntaxError name collision with the Supabase CDN global variable
let supabaseClient = null;
const SUPABASE_URL = "https://cyhhjlgsnfrwhghncytw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IuvavIfkXDRnmcJF-u-smA_fwXYYM60";

try {
  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase initialization failed, falling back to LocalStorage demo mode.", e);
}

// --- DOM ELEMENTS ---
const customCursor = document.getElementById('custom-cursor');
const customCursorFollower = document.getElementById('custom-cursor-follower');

const viewLanding = document.getElementById('view-landing');
const viewForm = document.getElementById('view-form');
const viewSuccess = document.getElementById('view-success');
const viewCountdown = document.getElementById('view-countdown');

const btnClockIt = document.getElementById('btn-clock-it');
const waitlistForm = document.getElementById('waitlist-form');
const btnSubmitForm = document.getElementById('btn-submit-form');
const linkBackLanding = document.getElementById('link-back-landing');
const logoNav = document.getElementById('logo-nav');

const successUserNumber = document.getElementById('success-user-number');
const btnShareFriends = document.getElementById('btn-share-friends');
const btnGoCountdown = document.getElementById('btn-go-countdown');
const btnResetDemo = document.getElementById('btn-reset-demo');

// Timer Elements
const timeDays = document.getElementById('time-days');
const timeHours = document.getElementById('time-hours');
const timeMins = document.getElementById('time-mins');
const timeSecs = document.getElementById('time-secs');
const statGirls = document.getElementById('stat-girls');
const headerStatusBadge = document.getElementById('header-status-badge');

// --- APP STATE ---
const IS_WAITLIST_CLOSED = true;
let isRegistered = localStorage.getItem('revclo_registered') === 'true';
let waitlistNum = parseInt(localStorage.getItem('revclo_number') || '0');
let activeView = 'landing';

// --- CUSTOM INTERACTIVE CURSOR (Failsafe wrapped) ---
document.addEventListener('mousemove', (e) => {
  if (typeof gsap !== 'undefined') {
    gsap.to(customCursor, {
      x: e.clientX,
      y: e.clientY,
      duration: 0
    });
    
    gsap.to(customCursorFollower, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.15,
      ease: "power2.out"
    });
  } else {
    // Plain JS fallback in case GSAP fails to load
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
    customCursorFollower.style.left = e.clientX + 'px';
    customCursorFollower.style.top = e.clientY + 'px';
  }
});

const interactiveElements = document.querySelectorAll('a, button, input, label, .benefit-card, .polaroid');
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => {
    document.body.classList.add('hovering');
  });
  el.addEventListener('mouseleave', () => {
    document.body.classList.remove('hovering');
  });
});

// --- PARALLAX POLAROIDS EFFECT (Failsafe wrapped) ---
const polaroids = document.querySelectorAll('.polaroid');
document.addEventListener('mousemove', (e) => {
  if (activeView !== 'landing') return;
  
  const mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  const mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  
  polaroids.forEach((polaroid, index) => {
    const factorX = (index + 1) * 15;
    const factorY = (index + 1) * 10;
    
    if (typeof gsap !== 'undefined') {
      gsap.to(polaroid, {
        x: mouseX * factorX,
        y: mouseY * factorY,
        rotation: parseFloat(polaroid.style.getPropertyValue('--rotation')) + mouseX * 5,
        duration: 0.6,
        ease: "power1.out"
      });
    } else {
      const rot = polaroid.style.getPropertyValue('--rotation') || '0deg';
      polaroid.style.transform = `translate(${mouseX * factorX}px, ${mouseY * factorY}px) rotate(${rot})`;
    }
  });
});

// --- DYNAMIC RELEASE TIMINGS CONFIGURATION ---
// Get the next upcoming Thursday at 8:45 PM relative to today
function getNextReleaseDate() {
  const now = new Date();
  const result = new Date();
  
  // Set to Thursday
  const dayOfWeek = 4; // Thursday
  const currentDay = now.getDay();
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  
  // If it is Thursday today, check if it is past 8:45 PM
  if (daysToAdd === 0) {
    const targetToday = new Date();
    targetToday.setHours(20, 45, 0, 0); // 8:45 PM
    if (now.getTime() > targetToday.getTime()) {
      daysToAdd = 7; // Target next week's Thursday
    }
  }
  
  result.setDate(now.getDate() + daysToAdd);
  result.setHours(20, 45, 0, 0); // 8:45 PM
  return result;
}

const TARGET_DATE = getNextReleaseDate();

// Initialize dynamic target date display
const targetDisplay = document.getElementById('countdown-target-display');
if (targetDisplay) {
  const options = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  targetDisplay.innerText = TARGET_DATE.toLocaleDateString('en-US', options);
}

// --- ROUTER VIEW CHANGER (Failsafe wrapped) ---
function switchView(viewName) {
  activeView = viewName;
  document.body.classList.remove('hovering');
  
  const views = {
    landing: viewLanding,
    form: viewForm,
    success: viewSuccess,
    countdown: viewCountdown
  };
  
  // Find current active section
  let currentActive = null;
  Object.keys(views).forEach(key => {
    if (views[key].classList.contains('active')) {
      currentActive = views[key];
    }
  });

  const nextActive = views[viewName];
  if (!nextActive) return;

  if (currentActive === nextActive) {
    // First load or already active
    nextActive.classList.add('active');
    nextActive.style.opacity = '1';
    nextActive.style.transform = 'translateY(0)';
    return;
  }

  // Hide the current active section
  if (currentActive) {
    if (typeof gsap !== 'undefined') {
      gsap.to(currentActive, {
        opacity: 0,
        y: -15,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          currentActive.classList.remove('active');
          showNextView();
        }
      });
    } else {
      // CSS Fallback
      currentActive.classList.remove('active');
      showNextView();
    }
  } else {
    showNextView();
  }

  function showNextView() {
    nextActive.classList.add('active');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(nextActive, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    } else {
      // CSS Fallback (Keyframes take care of styling via .active class automatically)
      nextActive.style.opacity = '1';
      nextActive.style.transform = 'translateY(0)';
    }
  }
}

// --- ACCESS CONTROL AND TIMER LOOP ---
function updateTimerAndAccess() {
  const now = new Date();
  const diffMs = TARGET_DATE.getTime() - now.getTime();
  
  if (diffMs > 0) {
    // Before 8:45 PM: Standard Countdown Active
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    timeDays.innerText = String(days).padStart(2, '0');
    timeHours.innerText = String(hours).padStart(2, '0');
    timeMins.innerText = String(minutes).padStart(2, '0');
    timeSecs.innerText = String(seconds).padStart(2, '0');
    
    if (IS_WAITLIST_CLOSED && !isRegistered) {
      headerStatusBadge.innerText = "Waitlist Closed <3";
      headerStatusBadge.style.borderColor = "var(--color-cherry)";
      headerStatusBadge.style.color = "var(--color-pink)";
    } else {
      headerStatusBadge.innerText = "15m Early Access Active";
      headerStatusBadge.style.borderColor = "var(--color-cherry)";
      headerStatusBadge.style.color = "var(--color-pink)";
    }
  } 
  else if (diffMs <= 0 && diffMs > -900000) {
    // Early Access Window (8:45 PM to 9:00 PM)
    const endEarlyAccessMs = TARGET_DATE.getTime() + 900000;
    const remainingEarlyMs = endEarlyAccessMs - now.getTime();
    
    const minutes = Math.floor((remainingEarlyMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingEarlyMs % (1000 * 60)) / 1000);
    
    timeDays.innerText = "00";
    timeHours.innerText = "00";
    timeMins.innerText = String(minutes).padStart(2, '0');
    timeSecs.innerText = String(seconds).padStart(2, '0');
    
    if (isRegistered) {
      // Allow access! Waitlist girls shop early!
      headerStatusBadge.innerText = "Early Access Unlocked 🔓";
      headerStatusBadge.style.borderColor = "#4CAF50";
      headerStatusBadge.style.color = "#E8F5E9";
      
      document.querySelector('.countdown-title').innerHTML = "🔓 EARLY ACCESS IS <span style='color: #4CAF50'>LIVE</span> FOR YOU!";
    } else {
      // Blocked, showing timer
      headerStatusBadge.innerText = "Waitlist Exclusive Shop Active";
      headerStatusBadge.style.borderColor = "#FF9800";
      headerStatusBadge.style.color = "#FFF3E0";
      
      document.querySelector('.countdown-title').innerHTML = "DROP IS LIVE FOR WAITLIST MEMBERS ONLY";
    }
  } 
  else {
    // General Access Active (After 9:00 PM)
    timeDays.innerText = "00";
    timeHours.innerText = "00";
    timeMins.innerText = "00";
    timeSecs.innerText = "00";
    
    headerStatusBadge.innerText = "General Release Live 🚀";
    headerStatusBadge.style.borderColor = "#2196F3";
    headerStatusBadge.style.color = "#E3F2FD";
    
    document.querySelector('.countdown-title').innerHTML = "DROP IS <span style='color: var(--color-pink)'>LIVE FOR EVERYONE</span>!";
  }
}

// Start live interval
setInterval(updateTimerAndAccess, 1000);
updateTimerAndAccess();

// --- DYNAMIC ROTATING FUNNY QUOTES (Failsafe wrapped) ---
const rotatingQuotes = [
  "Someone is about to steal your future favorite hoodie 🕶️",
  "Your hostel roommate might get there first 😭",
  "One piece = one owner only. Standing on business 💖",
  "Limited pieces. No restocks. Be fast or cry later 🛍️",
  "Checking the waitlist position like we check grade sheets 🫡"
];
let currentQuoteIdx = 0;
const rotatingQuoteText = document.getElementById('rotating-quote-text');

setInterval(() => {
  if (typeof gsap !== 'undefined') {
    gsap.to(rotatingQuoteText, {
      opacity: 0,
      y: -10,
      duration: 0.4,
      onComplete: () => {
        currentQuoteIdx = (currentQuoteIdx + 1) % rotatingQuotes.length;
        rotatingQuoteText.innerText = rotatingQuotes[currentQuoteIdx];
        gsap.fromTo(rotatingQuoteText, 
          { opacity: 0, y: 10 },
          { opacity: 0.9, y: 0, duration: 0.4 }
        );
      }
    });
  } else {
    currentQuoteIdx = (currentQuoteIdx + 1) % rotatingQuotes.length;
    rotatingQuoteText.innerText = rotatingQuotes[currentQuoteIdx];
  }
}, 5000);

// --- DYNAMIC REGISTERED STATS ---
async function updateWaitlistStats() {
  let count = 0; // Default count set to 0 to represent authentic real data
  if (supabaseClient) {
    try {
      const { count: dbCount, error } = await supabaseClient
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
        
      if (!error && dbCount !== null) {
        count = dbCount;
      }
    } catch (e) {
      console.warn("Could not query Supabase waitlist stats count, falling back to LocalStorage.");
      count = parseInt(localStorage.getItem('revclo_local_registrants_count') || '0');
    }
  } else {
    count = parseInt(localStorage.getItem('revclo_local_registrants_count') || '0');
  }
  statGirls.innerText = `${count} 💖`;
}
updateWaitlistStats();

// --- BUTTON NAVIGATION TRIGGERS ---
btnClockIt.addEventListener('click', () => switchView('form'));
linkBackLanding.addEventListener('click', (e) => {
  e.preventDefault();
  switchView('landing');
});
logoNav.addEventListener('click', (e) => {
  e.preventDefault();
  if (isRegistered) {
    switchView('countdown');
  } else {
    switchView('landing');
  }
});
btnGoCountdown.addEventListener('click', () => switchView('countdown'));

// Share positioning with friends
btnShareFriends.addEventListener('click', () => {
  const shareText = `I just clocked into the REVCLO waitlist at IGDTUW! I'm User #${waitlistNum}. Lock your early-access spot now at waitlist.revclo.in! <3`;
  navigator.clipboard.writeText(shareText).then(() => {
    const originalText = btnShareFriends.innerHTML;
    btnShareFriends.innerHTML = "Link Copied! ✅";
    setTimeout(() => {
      btnShareFriends.innerHTML = originalText;
    }, 2000);
  });
});

// --- SUBMIT REGISTRATION FORM ---
waitlistForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const year = document.querySelector('input[name="user-year"]:checked').value;
  const instagram = document.getElementById('user-instagram').value.trim();
  const interest = document.querySelector('input[name="user-interest"]:checked').value;
  
  if (!name || !email || !instagram) {
    alert("Please fill in all fields! <3");
    return;
  }
  
  if (!email.toLowerCase().endsWith('igdtuw.ac.in')) {
    const confirmNonCampus = confirm("Wait, this isn't an @igdtuw.ac.in email address! Are you sure you are an IGDTUW student? <3");
    if (!confirmNonCampus) return;
  }
  
  btnSubmitForm.innerText = "CLOCKING IN... ⏰";
  btnSubmitForm.disabled = true;
  
  let newPosition = 1; // Base position start
  
  if (supabaseClient) {
    try {
      // Get the absolute count of entries in the database to determine actual waitlist position
      const { count, error: countErr } = await supabaseClient
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
        
      if (!countErr && count !== null) {
        newPosition = count + 1;
      }
      
      const { error: insertErr } = await supabaseClient
        .from('waitlist')
        .insert([
          { 
            name, 
            email, 
            year, 
            instagram, 
            interest, 
            waitlist_number: newPosition 
          }
        ]);
        
      if (insertErr) {
        console.error("Supabase insert error:", insertErr);
        throw new Error("Failed to insert row in Supabase");
      }
      
    } catch (err) {
      console.warn("Supabase integration failed, falling back to LocalStorage demo mode.", err);
      const localRegistrantsCount = parseInt(localStorage.getItem('revclo_local_registrants_count') || '0');
      newPosition = localRegistrantsCount + 1;
      localStorage.setItem('revclo_local_registrants_count', String(localRegistrantsCount));
    }
  } else {
    const localRegistrantsCount = parseInt(localStorage.getItem('revclo_local_registrants_count') || '0');
    newPosition = localRegistrantsCount + 1;
    localStorage.setItem('revclo_local_registrants_count', String(localRegistrantsCount));
  }
  
  localStorage.setItem('revclo_registered', 'true');
  localStorage.setItem('revclo_number', String(newPosition));
  
  isRegistered = true;
  waitlistNum = newPosition;
  
  successUserNumber.innerText = `User #${newPosition}`;
  updateWaitlistStats();
  
  setTimeout(() => {
    switchView('success');
    btnSubmitForm.innerText = "Clock it ⏰";
    btnSubmitForm.disabled = false;
    waitlistForm.reset();
  }, 1000);
});

// --- RESET DEMO UTILITY ---
btnResetDemo.addEventListener('click', (e) => {
  e.preventDefault();
  const resetConfirm = confirm("Do you want to reset your local registration status for demo testing? <3");
  if (resetConfirm) {
    localStorage.removeItem('revclo_registered');
    localStorage.removeItem('revclo_number');
    isRegistered = false;
    waitlistNum = 0;
    
    switchView('landing');
    updateWaitlistStats();
    alert("Local demo state reset successfully! You can register again. <3");
  }
});

// --- INITIALIZE ROUTER STATE ---
if (IS_WAITLIST_CLOSED) {
  const closedNotice = document.getElementById('waitlist-closed-notice');
  const clockBtn = document.getElementById('btn-clock-it');
  if (closedNotice) closedNotice.style.display = 'block';
  if (clockBtn) clockBtn.style.display = 'none';
}

if (isRegistered) {
  successUserNumber.innerText = `User #${waitlistNum}`;
  switchView('countdown');
} else {
  switchView('landing');
}
