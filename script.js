// Global mapping: slider values to numeric thresholds.
// 1 ("Low") → 1, 2 ("Med") → 7, 3 ("High") → 7.5.
const sliderMapping = { "1": 1, "2": 7, "3": 7.5 };

// Debounce helper to limit function execution rate.
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Save the current filter state to localStorage.
function saveState() {
  const state = {
    sliders: {},
    explanationDropdown: document.getElementById("explanation-dropdown").value,
    sortDropdown: document.getElementById("sort-dropdown").value,
    cardResize: document.getElementById("card-resize-slider-input").value,
  };
  document.querySelectorAll(".filter-menu input[type='range']").forEach((slider) => {
    state.sliders[slider.id] = slider.value;
  });
  localStorage.setItem("galleryState", JSON.stringify(state));
}

// Load filter state from localStorage (if available) and apply it.
function loadState() {
  const stored = localStorage.getItem("galleryState");
  if (stored) {
    const state = JSON.parse(stored);
    // Load slider values.
    for (let sliderId in state.sliders) {
      const slider = document.getElementById(sliderId);
      if (slider) {
        slider.value = state.sliders[sliderId];
        const valueDisplay = document.getElementById(slider.id + "-value");
        if (valueDisplay) {
          valueDisplay.textContent = getSliderLabel(slider.value);
        }
      }
    }
    // Load dropdown values.
    const explanationDropdown = document.getElementById("explanation-dropdown");
    explanationDropdown.value = state.explanationDropdown || "";
    const sortDropdown = document.getElementById("sort-dropdown");
    sortDropdown.value = state.sortDropdown || "understandability";
    // Load card resize slider value.
    const cardResizeSlider = document.getElementById("card-resize-slider-input");
    if (state.cardResize) {
      cardResizeSlider.value = state.cardResize;
      document.documentElement.style.setProperty("--card-min", state.cardResize + "px");
    }
  }
}

// Helper: Convert slider numeric value to its label.
function getSliderLabel(value) {
  const numValue = parseInt(value);
  if (numValue === 1) return "Low";
  if (numValue === 2) return "Med";
  if (numValue === 3) return "High";
  return "Low";
}

document.addEventListener("DOMContentLoaded", function () {
  // Load previously saved state, if any.
  loadState();

  const sliders = document.querySelectorAll(".filter-menu input[type='range']");
  const explanationDropdown = document.getElementById("explanation-dropdown");
  const sortDropdown = document.getElementById("sort-dropdown");
  const images = document.querySelectorAll(".gallery .image img");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const mobileFilterToggle = document.getElementById("mobile-filter-toggle");
  const filterMenu = document.querySelector(".filter-menu");

  // Create a debounced version of filterImages.
  const debouncedFilterImages = debounce(filterImages, 300);

  // Update slider labels and trigger filtering.
  sliders.forEach((slider) => {
    const valueDisplay = document.getElementById(slider.id + "-value");
    valueDisplay.textContent = getSliderLabel(slider.value);
    slider.addEventListener("input", function () {
      valueDisplay.textContent = getSliderLabel(slider.value);
      debouncedFilterImages();
      saveState();
    });
  });

  // Toggle mobile navigation.
  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("active");
  });

  // Toggle mobile filter menu overlay.
  if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener("click", function () {
      filterMenu.classList.toggle("active");
    });
  }

  // Listen for sort dropdown changes.
  sortDropdown.addEventListener("change", function () {
    filterImages();
    saveState();
  });

  // When an image is clicked, go to its detail page.
  images.forEach((image) => {
    image.addEventListener("click", function () {
      const imageContainer = this.closest(".image");
      const prototypeId = imageContainer.getAttribute("prototype");
      if (prototypeId) {
        saveState();
        window.location.href = prototypeId + ".html";
      } else {
        console.error("Prototype ID not found.");
      }
    });
  });

  // Listen for explanation dropdown changes.
  explanationDropdown.addEventListener("change", function () {
    filterImages();
    saveState();
  });

  // Tooltip for dialog labels.
  const labels = document.querySelectorAll(".dialog-label");
  const infoDialog = document.getElementById("info-dialog");

  labels.forEach((label) => {
    label.addEventListener("mouseenter", function () {
      const info = label.getAttribute("data-info");
      infoDialog.textContent = info;
      infoDialog.classList.add("show");
    });
    label.addEventListener("mousemove", function (event) {
      infoDialog.style.top = `${event.pageY + 10}px`;
      infoDialog.style.left = `${event.pageX + 10}px`;
    });
    label.addEventListener("mouseleave", function () {
      infoDialog.classList.remove("show");
    });
  });

  // Card resize slider functionality.
  const cardResizeSlider = document.getElementById("card-resize-slider-input");
  cardResizeSlider.addEventListener("input", function () {
    const newSize = cardResizeSlider.value + "px";
    document.documentElement.style.setProperty("--card-min", newSize);
    saveState();
  });

  // Initial filtering and criteria display.
  filterImages();
  updateTopCriteria();
});

function filterImages() {
  const sliders = document.querySelectorAll(".filter-menu input[type='range']");
  const selectedExplanation = document.getElementById("explanation-dropdown").value;
  const gallery = document.getElementById("gallery");
  const images = gallery.querySelectorAll(".image");

  images.forEach((image) => {
    let passes = true;
    sliders.forEach((slider) => {
      const criteria = slider.id.replace("-slider", "");
      const minRating = sliderMapping[slider.value];
      let rating = parseFloat(image.getAttribute(`data-${criteria}`)) || 0;
      if (rating < minRating) {
        passes = false;
      }
    });
    const imageTags = image.getAttribute("data-tags").split(",");
    const matchesExplanation = !selectedExplanation || imageTags.includes(selectedExplanation);
    if (passes && matchesExplanation) {
      image.classList.remove("hidden");
      image.style.opacity = "1";
    } else {
      image.classList.add("hidden");
      image.style.opacity = "0";
    }
  });

  // Show or hide the no-results visualization based on visible images.
  const visibleImages = gallery.querySelectorAll(".image:not(.hidden)");
  const noResultsDiv = document.getElementById("no-results");
  if (visibleImages.length === 0) {
    noResultsDiv.classList.remove("hidden");
  } else {
    noResultsDiv.classList.add("hidden");
  }
  sortImages();
}

function sortImages() {
  const gallery = document.getElementById("gallery");
  const sortCriterion = document.getElementById("sort-dropdown").value || "understandability";
  const visibleImages = Array.from(gallery.querySelectorAll(".image:not(.hidden)"));

  visibleImages.sort((a, b) => {
    const aRating = parseFloat(a.getAttribute(`data-${sortCriterion}`)) || 0;
    const bRating = parseFloat(b.getAttribute(`data-${sortCriterion}`)) || 0;
    return bRating - aRating;
  });

  visibleImages.forEach((image) => gallery.appendChild(image));
}

function updateTopCriteria() {
  const criteriaKeys = [
    "understandability",
    "ease_of_understanding",
    "ease_of_use",
    "satisfaction",
    "usefulness",
    "trust",
    "typicality",
    "sufficiency",
    "correctness",
    "compactness",
    "actionability",
  ];

  const cards = document.querySelectorAll(".gallery .image");
  cards.forEach((card) => {
    let scores = criteriaKeys.map((key) => {
      return { key: key, value: parseFloat(card.getAttribute(`data-${key}`)) || 0 };
    });
    scores.sort((a, b) => b.value - a.value);
    const top3 = scores.slice(0, 3);

    let topContainer = card.querySelector(".top-criteria");
    let allContainer = card.querySelector(".all-criteria");

    topContainer.innerHTML = "";
    allContainer.innerHTML = "";

    top3.forEach((item) => {
      let badge = document.createElement("span");
      badge.className = "criteria-badge";
      let formattedKey = item.key.replace(/_/g, " ");
      formattedKey = formattedKey
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      badge.textContent = `${formattedKey}: ${item.value.toFixed(1)}`;
      topContainer.appendChild(badge);
    });

    scores.forEach((item) => {
      let badge = document.createElement("span");
      badge.className = "criteria-badge";
      let formattedKey = item.key.replace(/_/g, " ");
      formattedKey = formattedKey
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      badge.textContent = `${formattedKey}: ${item.value.toFixed(1)}`;
      allContainer.appendChild(badge);
    });

    // Reset toggle: show top-3 and hide full criteria.
    allContainer.classList.remove("show");
    topContainer.classList.remove("criteria-hidden");

    let toggleButton = card.querySelector(".toggle-all-criteria");
    toggleButton.textContent = "Show All Scores";
    toggleButton.classList.remove("expanded");

    toggleButton.onclick = function () {
      if (allContainer.classList.contains("show")) {
        allContainer.classList.remove("show");
        topContainer.classList.remove("criteria-hidden");
        toggleButton.textContent = "Show All Scores";
        toggleButton.classList.remove("expanded");
      } else {
        allContainer.classList.add("show");
        topContainer.classList.add("criteria-hidden");
        toggleButton.textContent = "Hide Scores";
        toggleButton.classList.add("expanded");
      }
    };
  });
}
