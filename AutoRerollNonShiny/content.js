// ==UserScript==
// @name         Pokelike Shiny Helper (Stable)
// @namespace    pokelike
// @version      1.4
// @match        https://pokelike.xyz/*
// @grant        none
// ==/UserScript==

(function () {

    console.log("[Helper] loaded");

    // -------------------------
    // STATE
    // -------------------------
    const state = {
        enabled: true,
        rerolls: 0,
        shinyFound: false,
        targetPokemon: "",
        sleepMs: 100,
        muted: false,
        volume: 1,
    };

    // -------------------------
    // UTILS
    // -------------------------
    const log = (...a) => console.log("[Helper]", ...a);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function pressKey(key) {
        ["keydown", "keypress", "keyup"].forEach(type => {
            document.dispatchEvent(new KeyboardEvent(type, {
                key,
                code: `Key${key.toUpperCase()}`,
                keyCode: key.toUpperCase().charCodeAt(0),
                bubbles: true,
                cancelable: true
            }));
        });
    }

    function clickElement(el) {
        if (!el) return false;
        el.scrollIntoView({ block: "center" });
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        ["pointerdown", "mousedown", "mouseup", "click"].forEach(type => {
            el.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            }));
        });
        return true;
    }

    function waitFor(conditionFn, timeout = 3000, interval = 80) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const result = conditionFn();
                if (result) return resolve(result);
                if (Date.now() - start > timeout) return resolve(null);
                setTimeout(check, interval);
            };
            check();
        });
    }

    // -------------------------
    // GAME
    // -------------------------
    const game = {
        isOnCatchScreen() {
            return document.querySelector("#catch-screen")?.classList.contains("active");
        },

        getCards() {
            return Array.from(document.querySelectorAll(".poke-card"));
        },

        isShiny(card) {
            return !!(
                card.querySelector(".shiny-badge") ||
                card.querySelector('img[src*="shiny"]') ||
                (card.innerText || "").toLowerCase().includes("shiny")
            );
        },

        isTargetPokemon(card) {
            if (!state.targetPokemon.trim()) return false;
            return (card.innerText || "").toLowerCase().includes(state.targetPokemon.trim().toLowerCase());
        },

        isMatch(card) {
            const shiny = game.isShiny(card);
            const target = game.isTargetPokemon(card);
            return state.targetPokemon.trim() ? shiny && target : shiny;
        },

        getRerollButtons() {
            return Array.from(document.querySelectorAll(".reroll-btn")).filter(b => !b.disabled);
        },

        getPokeball() {
            return document.querySelector('image[href*="catchPokemon"]')
                || document.querySelector('image[xlink\\:href*="catchPokemon"]');
        },

        playAlert() {
            const audio = new Audio(chrome.runtime.getURL("jaja.ogg"));
            audio.volume = state.muted ? 0 : state.volume;
            audio.play();
        }
    };

    // -------------------------
    // UI
    // -------------------------
    const ui = {
        panel: null,
        els: {},

        build() {
            ui.panel = document.createElement("div");
            ui.panel.style.cssText = `
                position: fixed;
                top: 12px;
                right: 12px;
                z-index: 99999;
                background: #1a1a2e;
                border: 2px solid #e94560;
                border-radius: 10px;
                padding: 12px 16px;
                font-family: monospace;
                font-size: 13px;
                color: #eee;
                min-width: 220px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                user-select: none;
            `;

            ui.panel.innerHTML = `
                <div style="font-weight:bold; font-size:14px; margin-bottom:10px; color:#e94560;">
                    ✨ Shiny Helper
                </div>

                <div style="margin-bottom:8px;">
                    <label style="font-size:11px; color:#aaa;">Target Pokémon</label><br>
                    <input id="sh-target" type="text" placeholder="e.g. Charizard"
                        style="margin-top:4px; width:100%; box-sizing:border-box; padding:5px 8px;
                               border-radius:6px; border:1px solid #444; background:#0f0f1a;
                               color:#fff; font-family:monospace; font-size:13px;" />
                </div>

                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <button id="sh-toggle"
                        style="flex:1; padding:6px; border-radius:6px; border:none; cursor:pointer;
                               background:#e94560; color:#fff; font-weight:bold; font-size:13px;">
                        ⏸ Pause
                    </button>
                    <button id="sh-clear"
                        style="padding:6px 10px; border-radius:6px; border:none; cursor:pointer;
                               background:#333; color:#ccc; font-size:12px;">
                        Clear
                    </button>
                </div>

                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                    <button id="sh-mute"
                        style="padding:3px 7px; border-radius:6px; border:none; cursor:pointer;
                               background:#333; color:#ccc; font-size:12px;">
                        🔊
                    </button>
                    <input id="sh-vol" type="range" min="0" max="1" step="0.05" value="1"
                        style="flex:1; accent-color:#e94560; cursor:pointer;" />
                </div>

                <div id="sh-status" style="font-size:11px; color:#aaa;">
                    Rerolls: <span id="sh-rerolls">0</span> &nbsp;|&nbsp;
                    <span id="sh-state" style="color:#4ecca3;">Running</span>
                </div>
            `;

            document.body.appendChild(ui.panel);

            ui.els = {
                input:   ui.panel.querySelector("#sh-target"),
                toggle:  ui.panel.querySelector("#sh-toggle"),
                clear:   ui.panel.querySelector("#sh-clear"),
                mute:    ui.panel.querySelector("#sh-mute"),
                vol:     ui.panel.querySelector("#sh-vol"),
                rerolls: ui.panel.querySelector("#sh-rerolls"),
                state:   ui.panel.querySelector("#sh-state"),
            };

            ui.bindEvents();
        },

        bindEvents() {
            const { input, toggle, clear, mute, vol } = ui.els;

            // Block keypresses leaking to game
            ["keydown", "keyup", "keypress"].forEach(ev =>
                input.addEventListener(ev, e => e.stopPropagation())
            );

            input.addEventListener("input", () => {
                state.targetPokemon = input.value;
            });

            toggle.addEventListener("click", () => {
                state.enabled = !state.enabled;
                toggle.textContent = state.enabled ? "⏸ Pause" : "▶ Resume";
                ui.setState(state.enabled ? "Running" : "Paused", state.enabled ? "#4ecca3" : "#e94560");
                log(state.enabled ? "ON" : "OFF");
            });

            clear.addEventListener("click", () => {
                input.value = "";
                state.targetPokemon = "";
                state.shinyFound = false;
                ui.setState("Running", "#4ecca3");
            });

            mute.addEventListener("click", () => {
                state.muted = !state.muted;
                mute.textContent = state.muted ? "🔇" : "🔊";
            });

            vol.addEventListener("input", () => {
                state.volume = parseFloat(vol.value);
                state.muted = state.volume === 0;
                mute.textContent = state.muted ? "🔇" : "🔊";
            });
        },

        setState(text, color) {
            ui.els.state.textContent = text;
            ui.els.state.style.color = color;
        },

        updateRerolls() {
            ui.els.rerolls.textContent = state.rerolls;
        },

        setFound(label) {
            ui.setState(`${label} FOUND!`, "gold");
        }
    };

    // -------------------------
    // CORE LOOP
    // -------------------------
    async function loop() {
        while (true) {

            if (!game.isOnCatchScreen()) {
                await sleep(300);
                continue;
            }

            if (!state.enabled || state.shinyFound) {
                await sleep(state.sleepMs);
                continue;
            }

            const cards = await waitFor(() => {
                const c = game.getCards();
                return c.length > 0 ? c : null;
            });

            if (!cards) {
                log("No cards found, retrying...");
                await sleep(state.sleepMs);
                continue;
            }

            // Match check
            for (const card of cards) {
                if (game.isMatch(card)) {
                    state.shinyFound = true;
                    card.style.outline = "4px solid gold";

                    const label = game.isShiny(card) ? "✨ SHINY" : `🎯 TARGET (${state.targetPokemon})`;
                    log(`${label} FOUND`);
                    ui.setFound(label);
                    game.playAlert();
                    return;
                }
            }

            // Reroll
            const rerollBtns = game.getRerollButtons();
            if (rerollBtns.length) {
                rerollBtns.forEach(btn => clickElement(btn));
                state.rerolls++;
                ui.updateRerolls();
                log("Rerolls:", state.rerolls);
                await sleep(state.sleepMs);
            }

            // Reset with R
            log("Pressing R to reset...");
            pressKey("r");
            await sleep(state.sleepMs);

            // Reopen selector
            const ball = game.getPokeball();
            if (ball) {
                log("Opening selector...");
                clickElement(ball);
                await sleep(state.sleepMs);
            } else {
                log("No pokeball/opener found");
                await sleep(state.sleepMs);
            }
        }
    }

    // -------------------------
    // HOTKEYS
    // -------------------------
    window.addEventListener("keydown", (e) => {
        if (e.key === "F8") ui.els.toggle.click();
        if (e.key === "F9") {
            const ball = game.getPokeball();
            if (ball) clickElement(ball);
        }
    });

    // -------------------------
    // INIT
    // -------------------------
    ui.build();
    loop();

})();