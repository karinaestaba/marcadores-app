const {shell, ipcRenderer} = require('electron');

class Bookmark{
    constructor(){
        this.messageError = document.querySelector('.error-message');
        this.bookmarkCreateForm = document.querySelector('.bookmark-create-form');
        this.bookmarkUrl = document.querySelector('.bookmark-create-url');
        this.bookmarkButton = document.querySelector('.bookmark-create-button');
        this.bookmarks = document.querySelector('.bookmarks');

        this.parser = new DOMParser();

        this.addEventListeners();
    }

    addEventListeners(){
        this.bookmarkUrl.addEventListener('keyup', () => {
            this.bookmarkButton.disabled = !this.bookmarkUrl.validity.valid;
        });

        this.bookmarkCreateForm.addEventListener('submit', this.createBookmark.bind(this));

        this.bookmarks.addEventListener('click', this.openBookmarkLink.bind(this));
    }

    createBookmark(e){
        e.preventDefault();

        const url = this.bookmarkUrl.value;

        fetch(url)
            .then(response => response.text())
            .then(this.extractContent.bind(this))
            .then(this.findPageTitle)
            .then(title => this.storeBookmark(url, title))
            .then(this.clearForm.bind(this))
            .then(this.showBookmarks.bind(this))
            .catch(error => this.reportError(error, url));
    }

    extractContent(contentData){
        return this.parser.parseFromString(contentData, 'text/html');
    }

    findPageTitle(html){
        return html.querySelector('title').innerText;
    }

    storeBookmark(url, title){
        localStorage.setItem(url, JSON.stringify({title:title, url:url}));
    }

    clearForm(){
        this.bookmarkUrl.value = null;
    }

    getLinks(){
        return Object.keys(localStorage).map(key => JSON.parse(localStorage.getItem(key)));
    }

    generateBookmarkHTML(bookmark){
        return `<li class="list-group-item py-4">
                    <span class="icon">🗋</span>
                    <a href="${bookmark.url}" target="_blank">
                        <h2 class="h6">
                            <span class="title">${bookmark.title}</span>
                        </h2>
                        <div>
                            <span class="small text-muted">${bookmark.url}</span>
                        </div>
                    </a>
                </li>`;
    }

    showBookmarks(){
        let bookmarksList = this.getLinks();
        let html = bookmarksList.map(this.generateBookmarkHTML).join('');

        this.bookmarks.innerHTML = `<ul class="list-group">${html}</ul>`;
    }

    deleteBookmarks(){
        localStorage.clear();

        this.bookmarks.innerHTML = '';
    }

    openBookmarkLink(e){
        if(e.target.href){
            e.preventDefault();
            shell.openExternal(e.target.href);
        }
    }

    reportError(error, url){
        this.messageError.classList.remove('d-none');
        this.messageError.innerHTML = `Ocurrió un error al intentar acceder a ${url}: ${error}`;

        setTimeout(() => {
            this.messageError.innerHTML = null;
            this.messageError.classList.add('d-none');
        }, 5000);
    }
}

let bookmarksObj = new Bookmark();

bookmarksObj.showBookmarks();

ipcRenderer.on('actions:delete-bookmarks', (e, action)  => {
    bookmarksObj.deleteBookmarks();
})
