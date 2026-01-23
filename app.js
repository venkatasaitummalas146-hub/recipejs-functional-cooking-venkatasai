const RecipeApp = (() => {
    "use strict";

    /* ================= DATA ================= */

    const recipes = [ /* YOUR EXISTING RECIPE DATA (UNCHANGED) */ 
        { id:1, title:"Classic Spaghetti Carbonara", time:25, difficulty:"easy", description:"A creamy Italian pasta dish.", ingredients:["Spaghetti","Eggs","Parmesan cheese","Black pepper","Salt"], steps:["Boil water","Cook pasta",{text:"Prepare sauce",substeps:["Beat eggs","Add cheese",{text:"Season",substeps:["Add salt","Add pepper"]}]},"Mix pasta and sauce","Serve hot"]},
        { id:2, title:"Chicken Tikka Masala", time:45, difficulty:"medium", description:"Spiced chicken in creamy sauce.", ingredients:["Chicken","Yogurt","Tomatoes","Spices","Cream"], steps:["Marinate chicken","Grill chicken","Prepare sauce","Combine chicken and sauce","Serve with rice"]},
        { id:3, title:"Homemade Croissants", time:180, difficulty:"hard", description:"Buttery French pastry.", ingredients:["Flour","Butter","Yeast","Milk","Sugar"], steps:["Prepare dough",{text:"Laminate dough",substeps:["Roll dough","Fold butter","Chill dough"]},"Shape croissants","Bake until golden"]},
        { id:4, title:"Greek Salad", time:15, difficulty:"easy", description:"Fresh veggie salad.", ingredients:["Tomatoes","Cucumber","Feta cheese","Olives","Olive oil"], steps:["Chop vegetables","Add cheese and olives","Drizzle olive oil","Mix and serve"]},
        { id:5, title:"Beef Wellington", time:120, difficulty:"hard", description:"Beef wrapped in pastry.", ingredients:["Beef fillet","Mushrooms","Puff pastry","Eggs","Spices"], steps:["Sear beef","Prepare mushroom paste","Wrap beef","Bake"]},
        { id:6, title:"Vegetable Stir Fry", time:20, difficulty:"easy", description:"Quick veggie dish.", ingredients:["Mixed vegetables","Soy sauce","Garlic","Oil"], steps:["Heat oil","Add vegetables","Stir fry","Serve hot"]},
        { id:7, title:"Pad Thai", time:30, difficulty:"medium", description:"Thai noodle dish.", ingredients:["Rice noodles","Shrimp","Eggs","Peanuts","Sauce"], steps:["Cook noodles","Prepare sauce","Stir fry everything","Garnish and serve"]},
        { id:8, title:"Margherita Pizza", time:60, difficulty:"medium", description:"Classic Italian pizza.", ingredients:["Pizza dough","Tomato sauce","Mozzarella","Basil"], steps:["Prepare dough","Add toppings","Bake pizza","Serve hot"]}
    ];

    /* ================= STATE ================= */

    let currentFilter = "all";
    let currentSort = "none";
    let searchQuery = "";
    let favorites = JSON.parse(localStorage.getItem("recipeFavorites")) || [];
    let debounceTimer;

    /* ================= DOM ================= */

    const recipeContainer = document.querySelector("#recipe-container");
    const filterButtons = document.querySelectorAll("[data-filter]");
    const sortButtons = document.querySelectorAll("[data-sort]");
    const searchInput = document.querySelector("#search-input");
    const clearSearchBtn = document.querySelector("#clear-search");
    const recipeCount = document.querySelector("#recipe-count");

    /* ================= RECURSION ================= */

    const renderSteps = (steps, level = 0) => {
        const cls = level === 0 ? "steps-list" : "substeps-list";
        return `<ol class="${cls}">
            ${steps.map(step =>
                typeof step === "string"
                    ? `<li>${step}</li>`
                    : `<li>${step.text}${renderSteps(step.substeps, level + 1)}</li>`
            ).join("")}
        </ol>`;
    };

    /* ================= CARD ================= */

    const createRecipeCard = (recipe) => {
        const isFav = favorites.includes(recipe.id);
        return `
        <div class="recipe-card">
            <button class="favorite-btn" data-id="${recipe.id}">
                ${isFav ? "❤️" : "🤍"}
            </button>

            <h3>${recipe.title}</h3>
            <div class="recipe-meta">
                <span>⏱️ ${recipe.time} min</span>
                <span class="difficulty ${recipe.difficulty}">${recipe.difficulty}</span>
            </div>
            <p>${recipe.description}</p>

            <div class="card-actions">
                <button class="toggle-btn" data-id="${recipe.id}" data-toggle="steps">Show Steps</button>
                <button class="toggle-btn" data-id="${recipe.id}" data-toggle="ingredients">Show Ingredients</button>
            </div>

            <div class="steps-container" data-id="${recipe.id}">
                ${renderSteps(recipe.steps)}
            </div>

            <div class="ingredients-container" data-id="${recipe.id}">
                <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
            </div>
        </div>`;
    };

    /* ================= FILTERS ================= */

    const filterBySearch = (data) =>
        !searchQuery ? data :
        data.filter(r =>
            r.title.toLowerCase().includes(searchQuery) ||
            r.description.toLowerCase().includes(searchQuery) ||
            r.ingredients.some(i => i.toLowerCase().includes(searchQuery))
        );

    const filterFavorites = (data) =>
        data.filter(r => favorites.includes(r.id));

    const applyFilter = (data) => {
        if (currentFilter === "favorites") return filterFavorites(data);
        if (currentFilter === "quick") return data.filter(r => r.time < 30);
        if (currentFilter === "all") return data;
        return data.filter(r => r.difficulty === currentFilter);
    };

    const applySort = (data) => {
        if (currentSort === "name") return [...data].sort((a,b)=>a.title.localeCompare(b.title));
        if (currentSort === "time") return [...data].sort((a,b)=>a.time-b.time);
        return data;
    };

    /* ================= DISPLAY ================= */

    const updateDisplay = () => {
        let result = filterBySearch(recipes);
        result = applyFilter(result);
        result = applySort(result);

        recipeCount.textContent = `Showing ${result.length} of ${recipes.length} recipes`;
        recipeContainer.innerHTML = result.map(createRecipeCard).join("");
    };

    /* ================= EVENTS ================= */

    const handleToggleClick = (e) => {
        if (e.target.classList.contains("toggle-btn")) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.toggle;
            const box = document.querySelector(`.${type}-container[data-id="${id}"]`);
            box.classList.toggle("visible");
            e.target.textContent = box.classList.contains("visible")
                ? `Hide ${type}`
                : `Show ${type}`;
        }

        if (e.target.classList.contains("favorite-btn")) {
            const id = Number(e.target.dataset.id);
            favorites = favorites.includes(id)
                ? favorites.filter(f => f !== id)
                : [...favorites, id];

            localStorage.setItem("recipeFavorites", JSON.stringify(favorites));
            updateDisplay();
        }
    };

    const setupEventListeners = () => {
        filterButtons.forEach(b =>
            b.addEventListener("click", e => {
                currentFilter = e.target.dataset.filter;
                updateDisplay();
            })
        );

        sortButtons.forEach(b =>
            b.addEventListener("click", e => {
                currentSort = e.target.dataset.sort;
                updateDisplay();
            })
        );

        searchInput.addEventListener("input", e => {
            clearSearchBtn.style.display = e.target.value ? "block" : "none";
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = e.target.value.toLowerCase();
                updateDisplay();
            }, 300);
        });

        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            searchQuery = "";
            clearSearchBtn.style.display = "none";
            updateDisplay();
        });

        recipeContainer.addEventListener("click", handleToggleClick);
    };

    const init = () => {
        setupEventListeners();
        updateDisplay();
        console.log("✅ RecipeJS Part 4 Ready!");
    };

    return { init };
})();

RecipeApp.init();