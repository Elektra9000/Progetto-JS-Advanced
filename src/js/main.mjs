import "../css/style.css";
import axios from "axios";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const bookSection = document.getElementById("book-section");

let currentQuery = "";
let currentPage = 1;
let totalPages = 1;
const booksPerPage = 6; 


searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentQuery = searchInput.value.trim();
  if (!currentQuery) return;

  currentPage = 1;

  const header = document.querySelector("header");
  header.classList.add("hidden");

  fetchBooks(currentQuery, currentPage);
});

// Make a request to the Open Library servers
async function fetchBooks(query, page) {
  const baseUrl = process.env.OPENLIBRARY_API_BASE;
  const searchEndpoint = process.env.OPENLIBRARY_SEARCH;
  const url = `${baseUrl}${searchEndpoint}?q=${encodeURIComponent(
    query
  )}&page=${page}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    totalPages = Math.ceil(data.numFound / booksPerPage);

    renderBooks(data.docs);
    renderPagination();
  } catch (error) {
    console.error("Error in fetching books:", error);
    bookSection.innerHTML = "<p>Error during the search.</p>";
  }
}

// Show results
function renderBooks(books) {
  bookSection.innerHTML = "";

  const visibleBooks = books.slice(0, booksPerPage);
  if (visibleBooks.length === 0) {
    const noBooksMessage = document.createElement("p");
    noBooksMessage.textContent = "No books found!";
    noBooksMessage.classList.add("no-books-found"); 
    bookSection.appendChild(noBooksMessage);
    return;
  }

  visibleBooks.forEach((book) => {
    const card = document.createElement("div");
    card.classList.add("book-card");

    const title = document.createElement("h3");
    title.textContent = book.title || "Title not available";

    const authorsContainer = document.createElement("div");
    authorsContainer.classList.add("authors-container");

    const authorsLabel = document.createElement("span");
    const authors = book.author_name || ["Not available"];
    authorsLabel.textContent = `Author: ${authors.slice(0, 2).join(", ")}`;

    const toggleArrow = document.createElement("button");
    toggleArrow.textContent = "▼";
    toggleArrow.classList.add("toggle-authors-btn");

    const authorsWrapper = document.createElement("div");
    authorsWrapper.classList.add("authors-wrapper");
    authorsWrapper.appendChild(authorsLabel);
    authorsWrapper.appendChild(toggleArrow);

    authorsContainer.appendChild(authorsWrapper);

    // Authors' section
    const authorMenu = document.createElement("div");
    authorMenu.classList.add("author-menu");

    const closeMenuBtn = document.createElement("button");
    closeMenuBtn.textContent = "X";
    closeMenuBtn.classList.add("close-menu-btn");
    closeMenuBtn.addEventListener("click", () => {
      authorMenu.style.display = "none"; 
      bookSection.classList.remove("freeze-animations"); 
    });

    authorMenu.appendChild(closeMenuBtn);
    if (authors.length > 2) {
      authors.slice(2).forEach((author) => {
        const authorItem = document.createElement("p");
        authorItem.textContent = author;
        authorMenu.appendChild(authorItem);
      });

      toggleArrow.addEventListener("click", () => {
        const isMenuVisible = authorMenu.style.display === "block";

        document.querySelectorAll(".author-menu").forEach((menu) => {
          menu.style.display = "none";
        });

        if (!isMenuVisible) {
          authorMenu.style.display = "block"; 
          bookSection.classList.add("freeze-animations"); 
        }
      });
    } else {
      toggleArrow.style.display = "none"; 
    }

    authorsContainer.appendChild(authorMenu);

    const img = document.createElement("img");
    img.src = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : "https://via.placeholder.com/150x225?text=No+Cover";
    img.alt = book.title;
    img.classList.add("book-cover");

    const detailsButton = document.createElement("button");
    detailsButton.textContent = "Details";
    detailsButton.classList.add("details-button");

    // Book details section
    const detailsMenu = document.createElement("div");
    detailsMenu.classList.add("details-menu");

    const closeDetailsBtn = document.createElement("button");
    closeDetailsBtn.textContent = "X";
    closeDetailsBtn.classList.add("close-details-btn");

    closeDetailsBtn.addEventListener("click", () => {
      detailsMenu.style.display = "none";
      detailsMenu.dataset.active = "false";
      bookSection.classList.remove("freeze-animations"); 
    });

    detailsMenu.appendChild(closeDetailsBtn);

    detailsButton.addEventListener("click", async () => {
      if (detailsMenu.dataset.active === "true") {
        detailsMenu.style.display = "none";
        detailsMenu.dataset.active = "false";
        bookSection.classList.remove("freeze-animations");
        return;
      }

      detailsMenu.dataset.active = "true";

      try {
        const olid = book.key ? book.key.replace("/works/", "") : "";
        const detailsUrl = `${process.env.OPENLIBRARY_API_BASE}${process.env.OPENLIBRARY_WORKS}/${olid}.json`;
        const response = await axios.get(detailsUrl);
        let details = response.data.description || "No details available.";
        if (typeof details === "object") {
          details = "No details available."; 
        }
        const bookCover = book.cover_i
          ? `<img src="https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg" alt="${book.title}" class="details-cover">`
          : `<img src="https://via.placeholder.com/150x225?text=No+Cover" alt="Cover not available" class="details-cover">`;
        const bookTitle = `<h2>${book.title}</h2>`;
        const bookAuthors = `<p>Author: ${authors.join(", ")}</p>`;

        detailsMenu.innerHTML = `<button class="close-details-btn">X</button>${bookCover}${bookTitle}${bookAuthors}<p>${details}</p>`;
        detailsMenu.style.display = "block";
        bookSection.classList.add("freeze-animations"); 
      } catch (error) {
        detailsMenu.innerHTML = `<button class="close-details-btn">X</button><p>No details available.</p>`;
        detailsMenu.style.display = "block";
        bookSection.classList.add("freeze-animations");
      }

      detailsMenu
        .querySelector(".close-details-btn")
        .addEventListener("click", () => {
          detailsMenu.style.display = "none";
          detailsMenu.dataset.active = "false";
          bookSection.classList.remove("freeze-animations");
        });
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(authorsContainer);
    card.appendChild(detailsButton);
    card.appendChild(detailsMenu);

    bookSection.appendChild(card);
  });
}

// Pagination management
function renderPagination() {
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";

    
    bookSection.parentElement.appendChild(pagination); 
  } else {
    pagination.innerHTML = ""; 
  }

  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.innerHTML = "⬅"; 
    prevButton.addEventListener("click", () => {
      currentPage--;
      fetchBooks(currentQuery, currentPage);
    });
    pagination.appendChild(prevButton); 
  }

  const pageInfo = document.createElement("span");
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`; 
  pagination.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.innerHTML = "➡"; 
    nextButton.addEventListener("click", () => {
      currentPage++;
      fetchBooks(currentQuery, currentPage);
    });
    pagination.appendChild(nextButton); 
  }
}

// Home button
function createHomeButton() {
  const homeButton = document.createElement("button");
  homeButton.id = "home-button"; 
  homeButton.title = "Torna alla Home"; 

  document.body.appendChild(homeButton);

  homeButton.addEventListener("click", () => {
    const header = document.querySelector("header");
    header.classList.remove("hidden");

    bookSection.innerHTML = "";
    const pagination = document.getElementById("pagination");
    if (pagination) {
      pagination.innerHTML = "";
    }

    searchInput.value = "";

    window.scrollTo(0, 0);
  });
}

createHomeButton();