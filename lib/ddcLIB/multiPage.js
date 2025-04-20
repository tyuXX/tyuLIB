var pages = [];
var currentPage = "";

// This is a JavaScript library that lets you change between multiple screens in HTML 
// With this you can make Title screens or menus for your game or application
// It is a simple library that uses the display property to hide and show fullscreen divs

// Setup
let pageContainer = document.createElement("div");
pageContainer.id = "pageContainer";
// Changed container styles to ensure full viewport size and automatic resizing
pageContainer.style.position = "fixed";
pageContainer.style.top = "0";
pageContainer.style.left = "0";
pageContainer.style.right = "0";
pageContainer.style.bottom = "0";
pageContainer.style.zIndex = "9999";
document.body.appendChild(pageContainer);

function newPage(name, id, html) {
    if (pages.includes(name)) {
        return false; // Page already exists
    }
    let page = document.createElement("div");
    page.id = "ddcPage" + id;
    page.style.position = "absolute";
    page.style.width = "100%";
    page.style.height = "100%";
    page.style.top = "0";
    page.style.left = "0";
    page.style.zIndex = "9999";
    page.style.display = "none"; // Hide the page by default
    page.innerHTML = html;
    pageContainer.appendChild(page);
    pages.push(id);
    return true; // Page created successfully
}

// This needs to be awaited
async function newPageFromURL(name, id, url) {
    return newPage(name, id, await fetch(url).then(response => response.text()));
}

function removePage(id) {
    if (!pages.includes(id)) {
        return false; // Page does not exist
    }
    let page = document.getElementById("ddcPage" + id);
    pageContainer.removeChild(page); // Remove the page from the container
}

function changePage(id) {
    if (currentPage === id) {
        return false; // Page already active
    }
    if (!pages.includes(id)) {
        return false; // Page does not exist
    }
    if (currentPage !== "") {
        document.getElementById("ddcPage" + currentPage).style.display = "none"; // Hide the current page
    }
    document.getElementById("ddcPage" + id).style.display = "block"; // Show the new page
    currentPage = id; // Update the current page
    return true; // Page changed successfully
}

newPage("Default", "default", "<h1>Default Page</h1><p>This is the default page.</p>");
changePage("default"); // Show the default page on load

// Set up a global object to access the library functions
// This is not a module, so it cannot be imported.
globalThis.DDCMultiPage = {
    newPage: newPage,
    changePage: changePage,
    getCurrentPage: () => currentPage,
    getPages: () => pages,
    getPageContainer: () => pageContainer,
    removePage: removePage,
    newPageFromURL: newPageFromURL,
};