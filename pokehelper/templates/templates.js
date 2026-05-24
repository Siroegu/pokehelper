const templates = {
    panel: () => `
        <div class="sh-title" style=" user-select: none; padding: 8px 12px; -12px; background: #2a2a3e; border-radius: 8px 8px 0 0;">
            ✨ Shiny Helper
        </div
        <div style="padding: 0 4px;">
            <div class="sh-row">
                <button id="sh-toggle" class="sh-btn sh-btn-primary">⏸</button>    
                <button id="sh-mute" class="sh-btn sh-btn-secondary">🔊</button>
            </div>

            
            <div class="sh-section">
            <div class="sh-row sh-relative">
            <input id="sh-shiny-toggle" type="checkbox" checked />
            <span id="sh-shiny-star">⭐</span>
            <input id="sh-target" type="text" class="sh-input sh-flex-1" placeholder="e.g. Squirtle" />
            <button id="sh-add" class="sh-btn sh-btn-primary">+</button>
            <button id="sh-type-picker" class="sh-btn sh-btn-secondary" title="Choose type">
                <span class="sh-type-picker-icon" aria-hidden="true">
                    <span style="background:#F08030"></span>
                    <span style="background:#6890F0"></span>
                    <span style="background:#78C850"></span>
                    <span style="background:#A040A0"></span>
                </span>
            </button>
            <button id="sh-clear" class="sh-btn sh-btn-secondary">🗑</button>
            </div>
            </div>            
            <div id="sh-tag-list" class="sh-tag-list"></div>
            
            <div class="sh-row">        
            </div>
            
            <div id="sh-status">
            Rerolls: <span id="sh-rerolls">0</span>
            &nbsp;|&nbsp;
            <span id="sh-state">Running</span>
            </div>
            <div id="sh-type-filter-panel" class="sh-type-filter-panel hidden"></div>
        </div>
    `,

    tag: (name) => `
        <span>${name}</span>
        <span class="sh-tag-remove">×</span>
    `,

    preview: () => `
        <img id="sh-preview-sprite" src="" />
        <div>
            <div id="sh-preview-name"></div>
            <div id="sh-preview-evos"></div>
        </div>
    `,
};
