/* =========================================
   TIME CAPSULE
   Main Application
========================================= */


// ==========================================
// STATE
// ==========================================

let capsules = loadCapsules();

let selectedDeleteId = null;
let currentCapsuleId = null;


// ==========================================
// DOM
// ==========================================

const homePage = document.getElementById("homePage");
const createPage = document.getElementById("createPage");
const capsulePage = document.getElementById("capsulePage");

const capsuleGrid = document.getElementById("capsuleGrid");
const emptyState = document.getElementById("emptyState");
const capsuleCount = document.getElementById("capsuleCount");

const capsuleForm = document.getElementById("capsuleForm");

const titleInput = document.getElementById("title");
const messageInput = document.getElementById("message");
const unlockDateInput = document.getElementById("unlockDate");

const charCount = document.getElementById("charCount");

const sealModal = document.getElementById("sealModal");
const deleteModal = document.getElementById("deleteModal");

const sealingState = document.getElementById("sealingState");
const sealedState = document.getElementById("sealedState");

const progressBar = document.getElementById("progressBar");

const capsuleContent = document.getElementById("capsuleContent");


// ==========================================
// STORAGE
// ==========================================

function loadCapsules() {

    try {

        const saved = localStorage.getItem("timeCapsules");

        return saved ? JSON.parse(saved) : [];

    } catch (error) {

        console.error("Could not load capsules:", error);

        return [];

    }

}


function saveCapsules() {

    localStorage.setItem(
        "timeCapsules",
        JSON.stringify(capsules)
    );

}


// ==========================================
// NAVIGATION
// ==========================================

function showPage(page) {

    homePage.classList.add("hidden");
    createPage.classList.add("hidden");
    capsulePage.classList.add("hidden");

    page.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function showHome() {

    showPage(homePage);

    currentCapsuleId = null;

    renderCapsules();

}


function showCreate() {

    showPage(createPage);

    capsuleForm.reset();

    charCount.textContent = "0";

    setMinimumDate();

}


// ==========================================
// CREATE BUTTONS
// ==========================================

document.getElementById("navCreate")
    .addEventListener("click", showCreate);

document.getElementById("heroCreate")
    .addEventListener("click", showCreate);

document.getElementById("emptyCreate")
    .addEventListener("click", showCreate);

document.getElementById("backHome")
    .addEventListener("click", showHome);

document.getElementById("capsuleBack")
    .addEventListener("click", showHome);


// ==========================================
// MINIMUM DATE
// ==========================================

function setMinimumDate() {

    const now = new Date();

    now.setMinutes(
        now.getMinutes() + 1
    );

    const local = formatDateForInput(now);

    unlockDateInput.min = local;

}


function formatDateForInput(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    const hours = String(
        date.getHours()
    ).padStart(2, "0");

    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;

}


// ==========================================
// CHARACTER COUNTER
// ==========================================

messageInput.addEventListener("input", () => {

    charCount.textContent =
        messageInput.value.length;

});


// ==========================================
// CREATE CAPSULE
// ==========================================

capsuleForm.addEventListener("submit", event => {

    event.preventDefault();

    const title = titleInput.value.trim();

    const message = messageInput.value.trim();

    const unlockDate = new Date(
        unlockDateInput.value
    );


    // Validation

    if (!title || !message) {

        alert("Please fill in all fields.");

        return;

    }


    if (Number.isNaN(unlockDate.getTime())) {

        alert("Please choose a valid unlock date.");

        return;

    }


    if (unlockDate <= new Date()) {

        alert("The unlock date must be in the future.");

        return;

    }


    // Create object

    const capsule = {

        id:
            Date.now().toString(),

        title,

        message,

        createdAt:
            new Date().toISOString(),

        unlockAt:
            unlockDate.toISOString()

    };


    // Save

    capsules.unshift(capsule);

    saveCapsules();


    // Show sealing animation

    startSealingAnimation(capsule);

});


// ==========================================
// SEALING ANIMATION
// ==========================================

function startSealingAnimation(capsule) {

    sealModal.classList.remove("hidden");

    sealingState.classList.remove("hidden");

    sealedState.classList.add("hidden");

    progressBar.style.width = "0%";


    let progress = 0;


    const interval = setInterval(() => {

        progress += 2;

        progressBar.style.width =
            `${progress}%`;


        if (progress >= 100) {

            clearInterval(interval);

            sealingState.classList.add("hidden");

            sealedState.classList.remove("hidden");

            document.getElementById("finishSeal").onclick =
                () => {

                    sealModal.classList.add("hidden");

                    openCapsule(capsule.id);

                };

        }

    }, 30);

}


// ==========================================
// RENDER CAPSULES
// ==========================================

function renderCapsules() {

    capsuleGrid.innerHTML = "";

    capsuleCount.textContent =
        `${capsules.length} ${
            capsules.length === 1
                ? "capsule"
                : "capsules"
        }`;


    if (capsules.length === 0) {

        emptyState.classList.remove("hidden");

        return;

    }


    emptyState.classList.add("hidden");


    capsules.forEach(capsule => {

        const card =
            document.createElement("div");

        card.className = "capsule-card";


        const unlocked =
            new Date(capsule.unlockAt) <= new Date();


        card.innerHTML = `

            <div class="card-top">

                <div class="lock-icon">
                    ${unlocked ? "📬" : "🔒"}
                </div>

                <div class="status ${unlocked ? "open" : ""}">
                    ${unlocked ? "OPENED" : "SEALED"}
                </div>

            </div>

            <h3>
                ${escapeHTML(capsule.title)}
            </h3>

            <p class="capsule-date">
                ${unlocked
                    ? "Unlocked "
                    : "Opens "
                }
                ${formatDate(capsule.unlockAt)}
            </p>

            <button
                class="card-delete"
                data-delete="${capsule.id}"
                title="Delete capsule"
            >
                🗑
            </button>

        `;


        card.addEventListener("click", event => {

            if (
                event.target.closest(".card-delete")
            ) {

                return;

            }

            openCapsule(capsule.id);

        });


        card.querySelector(".card-delete")
            .addEventListener("click", event => {

                event.stopPropagation();

                requestDelete(capsule.id);

            });


        capsuleGrid.appendChild(card);

    });

}


// ==========================================
// OPEN CAPSULE
// ==========================================

function openCapsule(id) {

    const capsule =
        capsules.find(
            item => item.id === id
        );


    if (!capsule) {

        return;

    }


    currentCapsuleId = id;

    showPage(capsulePage);

    renderCapsule(capsule);

}


// ==========================================
// RENDER SINGLE CAPSULE
// ==========================================

function renderCapsule(capsule) {

    const unlockTime =
        new Date(capsule.unlockAt);

    const now = new Date();


    if (now >= unlockTime) {

        renderUnlockedCapsule(capsule);

        return;

    }


    renderLockedCapsule(capsule);

}


// ==========================================
// LOCKED CAPSULE
// ==========================================

function renderLockedCapsule(capsule) {

    const unlockTime =
        new Date(capsule.unlockAt);


    capsuleContent.innerHTML = `

        <div class="locked-capsule">

            <div class="locked-icon">
                🔒
            </div>

            <div class="unlock-label">
                SEALED CAPSULE
            </div>

            <h1>
                ${escapeHTML(capsule.title)}
            </h1>

            <p>
                This capsule is waiting for its future.
            </p>

            <div class="unlock-label">
                OPENS ON
            </div>

            <p>
                ${formatDate(capsule.unlockAt)}
            </p>

            <div class="countdown">

                <div class="time-unit">
                    <strong id="days">--</strong>
                    <span>DAYS</span>
                </div>

                <div class="time-unit">
                    <strong id="hours">--</strong>
                    <span>HOURS</span>
                </div>

                <div class="time-unit">
                    <strong id="minutes">--</strong>
                    <span>MINUTES</span>
                </div>

                <div class="time-unit">
                    <strong id="seconds">--</strong>
                    <span>SECONDS</span>
                </div>

            </div>

        </div>

    `;


    updateCountdown(unlockTime);

}


// ==========================================
// COUNTDOWN
// ==========================================

function updateCountdown(target) {

    const update = () => {

        // If user left the page,
        // stop worrying about this capsule.

        if (
            capsulePage.classList.contains("hidden")
        ) {

            return;

        }


        const now = new Date();

        const difference =
            target.getTime() - now.getTime();


        if (difference <= 0) {

            const capsule =
                capsules.find(
                    item =>
                        item.id === currentCapsuleId
                );


            if (capsule) {

                renderUnlockedCapsule(capsule);

            }

            return;

        }


        const seconds =
            Math.floor(difference / 1000) % 60;

        const minutes =
            Math.floor(difference / 60000) % 60;

        const hours =
            Math.floor(difference / 3600000) % 24;

        const days =
            Math.floor(difference / 86400000);


        const daysElement =
            document.getElementById("days");

        const hoursElement =
            document.getElementById("hours");

        const minutesElement =
            document.getElementById("minutes");

        const secondsElement =
            document.getElementById("seconds");


        if (daysElement) {

            daysElement.textContent =
                String(days).padStart(2, "0");

            hoursElement.textContent =
                String(hours).padStart(2, "0");

            minutesElement.textContent =
                String(minutes).padStart(2, "0");

            secondsElement.textContent =
                String(seconds).padStart(2, "0");

        }

    };


    update();

}


// ==========================================
// UNLOCKED CAPSULE
// ==========================================

function renderUnlockedCapsule(capsule) {

    capsuleContent.innerHTML = `

        <div class="open-capsule">

            <div class="open-header">

                <div class="open-icon">
                    📬
                </div>

                <div class="opened-label">
                    CAPSULE OPENED
                </div>

                <h1>
                    ${escapeHTML(capsule.title)}
                </h1>

                <p>
                    The future has arrived.
                </p>

            </div>


            <div class="message-paper">
                ${escapeHTML(capsule.message)}
            </div>


            <div class="open-date">

                Created:
                ${formatDate(capsule.createdAt)}

                <br><br>

                Opened:
                ${formatDate(new Date().toISOString())}

            </div>

        </div>

    `;

}


// ==========================================
// DELETE
// ==========================================

function requestDelete(id) {

    selectedDeleteId = id;

    deleteModal.classList.remove("hidden");

}


document.getElementById("cancelDelete")
    .addEventListener("click", () => {

        deleteModal.classList.add("hidden");

        selectedDeleteId = null;

    });


document.getElementById("confirmDelete")
    .addEventListener("click", () => {

        if (!selectedDeleteId) {

            return;

        }


        capsules =
            capsules.filter(
                capsule =>
                    capsule.id !== selectedDeleteId
            );


        saveCapsules();


        deleteModal.classList.add("hidden");

        selectedDeleteId = null;

        renderCapsules();

    });


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleString(
        undefined,
        {
            day: "numeric",
            month: "long",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}


// ==========================================
// INITIALIZE
// ==========================================

setMinimumDate();

renderCapsules();


// ==========================================
// REFRESH ARCHIVE
// ==========================================

setInterval(() => {

    if (
        !homePage.classList.contains("hidden")
    ) {

        renderCapsules();

    }

}, 1000);
