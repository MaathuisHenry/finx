// Global mapping: slider values to numeric thresholds.
// 1 ("Low") → 1, 2 ("Med") → 7, 3 ("High") → 7.5.
const sliderMapping = { "1": 1, "2": 7, "3": 7.5 };

document.addEventListener('DOMContentLoaded', function () {
  const sliders = document.querySelectorAll('.filter-menu input[type="range"]');
  const explanationDropdown = document.getElementById('explanation-dropdown');
  const sortDropdown = document.getElementById('sort-dropdown');
  const images = document.querySelectorAll('.gallery .image img');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Helper: Convert slider numeric value to its label.
  function getSliderLabel(value) {
    const numValue = parseInt(value);
    if (numValue === 1) return "Low";
    if (numValue === 2) return "Med";
    if (numValue === 3) return "High";
    return "Low";
  }

  // Update slider display and trigger filtering when sliders change.
  sliders.forEach(slider => {
    const valueDisplay = document.getElementById(slider.id + '-value');
    // Set initial label.
    valueDisplay.textContent = getSliderLabel(slider.value);
    slider.addEventListener('input', function () {
      valueDisplay.textContent = getSliderLabel(slider.value);
      filterImages();
    });
  });

  // Toggle mobile navigation on hamburger click.
  menuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
  });

  // Listen for changes on the sort dropdown.
  sortDropdown.addEventListener('change', function () {
    filterImages();
  });

  // When an image is clicked, redirect to its detail page.
  images.forEach(image => {
    image.addEventListener('click', function () {
      const imageContainer = this.closest('.image');
      const prototypeId = imageContainer.getAttribute('prototype');
      if (prototypeId) {
        window.location.href = prototypeId + ".html";
      } else {
        console.error("Prototype ID not found.");
      }
    });
  });

  // Listen for changes on the explanation dropdown.
  explanationDropdown.addEventListener('change', function () {
    filterImages();
  });

  // Tooltip for dialog labels.
  const labels = document.querySelectorAll('.dialog-label');
  const infoDialog = document.getElementById('info-dialog');

  labels.forEach(label => {
    label.addEventListener('mouseenter', function () {
      const info = label.getAttribute('data-info');
      infoDialog.textContent = info;
      infoDialog.classList.add('show');
    });
    label.addEventListener('mousemove', function (event) {
      infoDialog.style.top = `${event.pageY + 10}px`;
      infoDialog.style.left = `${event.pageX + 10}px`;
    });
    label.addEventListener('mouseleave', function () {
      infoDialog.classList.remove('show');
    });
  });

  // Card resize slider functionality.
  const cardResizeSlider = document.getElementById('card-resize-slider-input');
  cardResizeSlider.addEventListener('input', function() {
    const newSize = cardResizeSlider.value + "px";
    document.documentElement.style.setProperty('--card-min', newSize);
  });

  // Initial filtering and sorting.
  filterImages();
  updateTopCriteria();
});

function filterImages() {
  const sliders = document.querySelectorAll('.filter-menu input[type="range"]');
  const selectedExplanation = document.getElementById('explanation-dropdown').value;
  const gallery = document.getElementById('gallery');
  const images = gallery.querySelectorAll('.image');

  images.forEach(image => {
    let passes = true;
    sliders.forEach(slider => {
      // Determine the criterion (e.g., "understandability")
      const criteria = slider.id.replace('-slider', '');
      // Map the slider's value (1,2,3) to its numeric threshold.
      const minRating = sliderMapping[slider.value];
      let rating = parseFloat(image.getAttribute(`data-${criteria}`)) || 0;
      if (rating < minRating) {
        passes = false;
      }
    });
    // Apply the explanation type filter.
    const imageTags = image.getAttribute('data-tags').split(',');
    const matchesExplanation = !selectedExplanation || imageTags.includes(selectedExplanation);
    if (passes && matchesExplanation) {
      image.classList.remove('hidden');
    } else {
      image.classList.add('hidden');
    }
  });

  sortImages();
}

function sortImages() {
  const gallery = document.getElementById('gallery');
  const sortCriterion = document.getElementById('sort-dropdown').value || "understandability";
  console.log("Sorting by:", sortCriterion);

  // Get all visible images.
  const visibleImages = Array.from(gallery.querySelectorAll('.image:not(.hidden)'));

  visibleImages.sort((a, b) => {
    const aRating = parseFloat(a.getAttribute(`data-${sortCriterion}`)) || 0;
    const bRating = parseFloat(b.getAttribute(`data-${sortCriterion}`)) || 0;
    if (aRating > bRating) return -1;
    if (aRating < bRating) return 1;
    return 0;
  });

  // Reorder images in the gallery.
  visibleImages.forEach(image => gallery.appendChild(image));
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
    "actionability"
  ];

  const cards = document.querySelectorAll('.gallery .image');
  cards.forEach(card => {
    let scores = criteriaKeys.map(key => {
      return { key: key, value: parseFloat(card.getAttribute(`data-${key}`)) || 0 };
    });
    scores.sort((a, b) => b.value - a.value);
    const top3 = scores.slice(0, 3);

    let topContainer = card.querySelector('.top-criteria');
    topContainer.innerHTML = "";
    top3.forEach(item => {
      let badge = document.createElement('span');
      badge.className = 'criteria-badge';
      let formattedKey = item.key.replace(/_/g, " ");
      formattedKey = formattedKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      badge.textContent = `${formattedKey}: ${item.value.toFixed(1)}`;
      topContainer.appendChild(badge);
    });

    let allContainer = card.querySelector('.all-criteria');
    let allCriteriaHTML = "<ul>";
    scores.forEach(item => {
      let formattedKey = item.key.replace(/_/g, " ");
      formattedKey = formattedKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      allCriteriaHTML += `<li>${formattedKey}: ${item.value.toFixed(1)}</li>`;
    });
    allCriteriaHTML += "</ul>";
    allContainer.innerHTML = allCriteriaHTML;

    let toggleButton = card.querySelector('.toggle-all-criteria');
    toggleButton.textContent = "Show All Scores";
    toggleButton.onclick = function () {
      if (allContainer.classList.contains('show')) {
        allContainer.classList.remove('show');
        toggleButton.textContent = "Show All Scores";
        toggleButton.classList.remove('expanded');
      } else {
        allContainer.classList.add('show');
        toggleButton.textContent = "Hide Scores";
        toggleButton.classList.add('expanded');
      }
    };
  });
}
