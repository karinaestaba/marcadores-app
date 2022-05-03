const {shell, ipcRenderer} = require('electron');

class Bookmark{
    constructor(){
        this.messageError = document.querySelector('.error-message');
        
        this.bookmarkCreateForm = document.querySelector('.bookmark-create-form');
        this.bookmarkUrl = document.querySelector('.bookmark-create-url');
        this.bookmarkButton = document.querySelector('.bookmark-create-button');
        this.bookmarks = document.querySelector('.bookmarks');
        
        this.bookmarksDeleteButtons = document.querySelector('.delete-button');

        this.searchQuery = document.querySelector('.search-query');
        this.searchForm = document.querySelector('.search-form');
        this.parser = new DOMParser();

        this.addEventListeners();
    }

    addEventListeners(){
        this.bookmarkUrl.addEventListener('keyup', () => {
            this.bookmarkButton.disabled = !this.bookmarkUrl.validity.valid;
        });

        this.searchQuery.addEventListener('keyup', () => {
            this.showBookmarks();
        });

        this.bookmarkCreateForm.addEventListener('submit', this.createBookmark.bind(this));

        this.bookmarks.addEventListener('click', this.openBookmarkLink.bind(this));
        
        this.bookmarks.addEventListener('click', this.openBookmarkLink.bind(this));

        document.addEventListener('click', (e) => {
            const element = e.target;
            if(element.classList.contains('delete-button')){
                this.deleteBookmark(element.getAttribute('data-url'));
            }
        });
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
        let links = Object.keys(localStorage).map(key => JSON.parse(localStorage.getItem(key)));

        if(this.searchQuery.value.length > 0){
            links = links.filter(link => link.title.toLowerCase().indexOf(this.searchQuery.value.toLocaleLowerCase()) > -1);
        }

        return links;
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
                    <button class="delete-button" data-url="${bookmark.url}">⛌</button>
                </li>`;
    }

    showBookmarks(){
        let bookmarksList = this.getLinks();

        if(bookmarksList.length > 0){
            let html = bookmarksList.map(this.generateBookmarkHTML).join('');

            this.bookmarks.innerHTML = `<ul class="list-group">${html}</ul>`;
        }
        else{
            this.bookmarks.innerHTML = '<p class="no-results">- No hay resultados 🤔-</p>'
        }
    }

    deleteBookmarks(){
        if(!confirm('¿Segura quieres eliminar todos los marcadores?')) return;
        localStorage.clear();

        this.bookmarks.innerHTML = '';
    }

    deleteBookmark(url){
        let confirmDelete = confirm('¿Segura quieres eliminar el marcador?');
        if(!confirmDelete) return;

        localStorage.removeItem(url);
        this.showBookmarks();
    }

    openBookmarkLink(e){
        if(e.target.href){
            e.preventDefault();
            shell.openExternal(e.target.href);
        }
    }

    reportError(error, url){
        this.messageError.classList.remove('d-none');
        this.bookmarkButton.classList.add('error');
        this.messageError.innerHTML = `Ocurrió un error al intentar acceder a ${url}: ${error}`;

        setTimeout(() => {
            this.messageError.innerHTML = null;
            this.messageError.classList.add('d-none');
            this.bookmarkButton.classList.remove('error');
        }, 3000);
    }

    exportBookmarksToCsv(){
        let data = '';

        this.getLinks().forEach(function(item){
            data += item.url + "\r\n";
        });

        let file = new Blob([data], {type: 'text/csv;charset=utf-8;'});
        let targetLink = document.createElement("a"),
        
        url = URL.createObjectURL(file);
        targetLink.href = url;
        targetLink.download = 'marcadores.csv';

        document.body.appendChild(targetLink);
        targetLink.click();

        setTimeout(function() {
            document.body.removeChild(targetLink);
            window.URL.revokeObjectURL(url);  
        }, 0);
    }
}

let bookmarksObj = new Bookmark();

bookmarksObj.showBookmarks();

ipcRenderer.on('actions:delete-bookmarks', (e, action)  => {
    bookmarksObj.deleteBookmarks();
})

ipcRenderer.on('actions:export-bookmarks', (e, action) => {
    bookmarksObj.exportBookmarksToCsv();
});