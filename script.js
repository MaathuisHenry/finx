document.addEventListener('DOMContentLoaded', function () {
  const sliders = document.querySelectorAll('.filter-menu input[type="range"]');
  const explanationDropdown = document.getElementById('explanation-dropdown');
  const sortDropdown = document.getElementById('sort-dropdown');
  const images = document.querySelectorAll('.gallery .image img');

  // Update slider display and trigger filtering when sliders change
  sliders.forEach(slider => {
    const valueDisplay = document.getElementById(slider.id + '-value');
    slider.addEventListener('input', function () {
      valueDisplay.textContent = slider.value;
      filterImages();
    });
  });

  // Listen for changes on the sort dropdown
  sortDropdown.addEventListener('change', function () {
    filterImages();
  });

  // When an image is clicked, redirect to its detail page based on its prototype attribute
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

  // Listen for changes on the explanation dropdown
  explanationDropdown.addEventListener('change', function () {
    filterImages();
  });

  // Tooltip for dialog labels
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

  // Initial filtering and sorting
  filterImages();
});

function filterImages() {
  const sliders = document.querySelectorAll('.filter-menu input[type="range"]');
  const selectedExplanation = document.getElementById('explanation-dropdown').value;
  const gallery = document.getElementById('gallery');
  const images = gallery.querySelectorAll('.image');

  images.forEach(image => {
    let passes = true;
    sliders.forEach(slider => {
      const criteria = slider.id.replace('-slider', '');
      const minRating = parseInt(slider.value);
      let rating = image.getAttribute(`data-${criteria}`);
      rating = rating ? parseInt(rating) : null;
      if (rating !== null && rating < minRating) {
        passes = false;
      }
    });
    // Check explanation type filter
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

  // Get all visible images
  const visibleImages = Array.from(gallery.querySelectorAll('.image:not(.hidden)'));

  visibleImages.sort((a, b) => {
    const aRating = parseInt(a.getAttribute(`data-${sortCriterion}`)) || 0;
    const bRating = parseInt(b.getAttribute(`data-${sortCriterion}`)) || 0;
    if (aRating > bRating) return -1;
    if (aRating < bRating) return 1;
    return 0;
  });

  // Reorder images in the gallery
  visibleImages.forEach(image => gallery.appendChild(image));
}
