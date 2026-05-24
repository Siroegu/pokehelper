const typeCheckerTemplates = {
    typeMosaic: (selectedTypes = []) => `
    <div class="tc-mosaic">
        ${PokeAPI.ALL_TYPES.map(type => `
            <div class="tc-type-tile ${selectedTypes.includes(type) ? "tc-type-selected" : ""}"
                data-type="${type}"
                style="background:${PokeAPI.TYPE_COLORS[type]};">
                <img class="tc-type-icon" src="${PokeAPI.TYPE_ICON_CACHE[type] || ""}" alt="${type}" />
            </div>
        `).join("")}
    </div>
    `,

    panel: () => `
        <div class="tc-panel-content">
            <div class="tc-title">🔥 Type Checker</div>
            
            <div class="tc-slot-row">
                <div id="tc-slot-1" class="tc-slot" style="pointer-events: auto; cursor: pointer;">—</div>
                <div id="tc-slot-2" class="tc-slot" style="pointer-events: auto; cursor: pointer;">—</div>
            </div>

            <div id="tc-mosaic-container" class="tc-hidden">
                ${typeCheckerTemplates.typeMosaic()}
            </div>

            <div class="tc-section">
                <div class="tc-label">⚔️⚔️ Very effective (x4)</div>
                <div id="tc-effective-4" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">⚔️ Super effective (x2)</div>
                <div id="tc-effective-2" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">💀 Weak to (x2)</div>
                <div id="tc-weak-2" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">💀💀 Very weak to (x4)</div>
                <div id="tc-weak-4" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">🛡️ Resists (x0.5)</div>
                <div id="tc-resists-half" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">🛡️🛡️ Resists (x0.25)</div>
                <div id="tc-resists-quarter" class="tc-badges"></div>
            </div>

            <div class="tc-section">
                <div class="tc-label">🚫 Immune (x0)</div>
                <div id="tc-immune" class="tc-badges"></div>
            </div>
        </div>
    `
};