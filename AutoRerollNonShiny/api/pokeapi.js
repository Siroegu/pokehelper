// =============================================
// PokeAPI Client
// Lightweight wrapper for browser extensions
// =============================================

const PokeAPI = (() => {
    const BASE_URL = "https://pokeapi.co/api/v2";
    const cache = {};

    const TYPE_COLORS = {
    normal: "#A8A878", fire: "#F08030", water: "#6890F0",
    electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
    fighting: "#C03028", poison: "#A040A0", ground: "#E0C068",
    flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
    rock: "#B8A038", ghost: "#705898", dragon: "#7038F8",
    dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC"
};


    const ALL_TYPES = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
        "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
    ];


   const TYPE_ICON_CACHE = {};


    async function request(endpoint) {
        if (cache[endpoint]) return cache[endpoint]; // <- cache hit
        const res = await fetch(`${BASE_URL}${endpoint}`);
        if (!res.ok) throw new Error(`PokeAPI Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        cache[endpoint] = data; // <- store it
        return data;
    }

    // -------------------------
    // Pokemon
    // -------------------------
    async function getPokemon(nameOrId) {
        return request(`/pokemon/${nameOrId.toString().toLowerCase()}`);
    }

    async function getPokemonSpecies(nameOrId) {
        return request(`/pokemon-species/${nameOrId}`);
    }

    async function getPokemonStats(nameOrId) {
        const pokemon = await getPokemon(nameOrId);

        return {
            id: pokemon.id,
            name: pokemon.name,
            height: pokemon.height,
            weight: pokemon.weight,
            types: pokemon.types.map(t => t.type.name),
            stats: pokemon.stats.map(stat => ({
                name: stat.stat.name,
                value: stat.base_stat
            })),
            abilities: pokemon.abilities.map(a => a.ability.name),
            sprite: pokemon.sprites.front_default
        };
    }


    async function getMove(nameOrId) {
        return request(`/move/${nameOrId}`);
    }

    // =============================================
    // Evolution Endpoint
    // Returns a clean evolution chain
    // =============================================

    async function getPokemonEvolutions(nameOrId) {
        const species = await getPokemonSpecies(nameOrId);
        const url = species.evolution_chain.url.replace(BASE_URL, "");
        const chainData = await request(url);

        const evolutions = [];

        function parseChain(chain, stage = 1) {
            evolutions.push({ stage, name: chain.species.name });
            chain.evolves_to.forEach(next => parseChain(next, stage + 1));
        }

        parseChain(chainData.chain);
        return evolutions;
    }

    function getTypeIconUrl(typeName) {
        const index = ALL_TYPES.indexOf(typeName.toLowerCase()) + 1;
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${index}.png`;
    }

    // -------------------------
    // Abilities
    // -------------------------
    async function getAbility(nameOrId) {
        return request(`/ability/${nameOrId}`);
    }

    // -------------------------
    // Types
    // -------------------------
    async function getType(nameOrId) {
        return request(`/type/${nameOrId}`);
    }

    // -------------------------
    // Evolution chain
    // -------------------------
    async function getEvolutionChain(speciesNameOrId) {
        const species = await getPokemonSpecies(speciesNameOrId);

        return request(
            species.evolution_chain.url.replace(
                "https://pokeapi.co/api/v2",
                ""
            )
        );
    }

    // -------------------------
    // Search helper
    // -------------------------
    async function searchPokemon(name) {
        try {
            return await getPokemon(name);
        } catch {
            return null;
        }
    }

    async function getAllPokemonNames() {
        const data = await request("/pokemon?limit=10000");
        return data.results.map(p => p.name);
    }

    async function getTypeMatchups(typeName) {
        const data = await request(`/type/${typeName.toLowerCase()}`);
        const rel = data.damage_relations;

        return {
            doubleDamageTo: rel.double_damage_to.map(t => t.name),
            halfDamageTo: rel.half_damage_to.map(t => t.name),
            noDamageTo: rel.no_damage_to.map(t => t.name),
            doubleDamageFrom: rel.double_damage_from.map(t => t.name),
            halfDamageFrom: rel.half_damage_from.map(t => t.name),
            noDamageFrom: rel.no_damage_from.map(t => t.name),
        };
    }


    async function getTypeIcon(typeName) {
        const key = typeName.toLowerCase();
        if (TYPE_ICON_CACHE[key]) return TYPE_ICON_CACHE[key];

        const data = await PokeAPI.getType(key);

        const icon =
            data?.sprites?.["generation-ix"]?.["scarlet-violet"]?.name_icon;

        TYPE_ICON_CACHE[key] = icon || null;
        return TYPE_ICON_CACHE[key];
    }

    async function preloadTypeIcons() {
    await Promise.all(
        PokeAPI.ALL_TYPES.map(async (type) => {
            const data = await PokeAPI.getType(type);

            TYPE_ICON_CACHE[type] =
                data?.sprites?.["generation-ix"]?.["scarlet-violet"]?.name_icon;
        })
    );
}

    // -------------------------
    // Public API
    // -------------------------
    return {
        request,
        getPokemon,
        getPokemonSpecies,
        getPokemonStats,
        getMove,
        getAbility,
        getType,
        getPokemonEvolutions,
        getEvolutionChain,
        getAllPokemonNames,
        searchPokemon,
        getTypeMatchups,
        getTypeIconUrl,
        ALL_TYPES,
        TYPE_COLORS,
        TYPE_ICON_CACHE,
        preloadTypeIcons 
    };
})();