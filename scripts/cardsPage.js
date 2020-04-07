let staticBasePath;
let backendEndPoint;
const limit = 5;
let offset = 0;

const pageType = {
    filter: 'filter',
    main: 'main'
};

let boxElement;

// Для корректной работы в разных браузерах
(function (history) {
    const { pushState } = history;
    history.pushState = function (state) {
        if (typeof history.onpushstate === 'function') {
            history.onpushstate({ state });
        }

        return pushState.apply(history, arguments);
    };
}(window.history));

window.onpopstate = history.onpushstate = render;

function request(address) {
    return fetch(address)
        .then(res => res.json())
        .catch(renderError);
}

function clearPage() {
    const pageWrapper = document.querySelector('.wrapper');

    pageWrapper.innerHTML = '';
}

function renderError(err) {
    clearPage();
    const pageWrapper = document.getElementsByClassName('wrapper');
    const errCode = document.createElement('h1');
    const errText = document.createElement('h3');
    const errWrapper = document.createElement('div');

    errWrapper.classList.add('error__wrapper');
    errCode.classList.add('error__code', 'text_roboto', 'text_pink');
    errText.classList.add('text_h3', 'text_roboto-light');

    console.log(err);
    errCode.innerText = err.status;
    errText.innerText = err;

    errWrapper.appendChild(errCode);
    errWrapper.appendChild(errText);

    pageWrapper[0].appendChild(errWrapper);
}

function changePage(address, type, tag) {
    return () => { window.history.pushState({ type, tag }, 'Filters', address); };
}

function renderCard(card, index, cards) {
    const pageWrapper = document.getElementsByClassName('wrapper');
    const cardWrapper = document.createElement('div');
    const cardImage = document.createElement('img');
    const cardContent = document.createElement('div');
    const cardLink = document.createElement('a');
    const cardText = document.createElement('p');
    const cardTags = document.createElement('div');

    cardWrapper.classList.add('quest-card__wrapper');

    cardImage.setAttribute('src', `${staticBasePath}${card.imageAddress}`);
    cardImage.classList.add('quest-card__image');

    cardContent.classList.add('quest-card__content');

    cardWrapper.appendChild(cardImage);
    cardWrapper.appendChild(cardContent);

    cardLink.setAttribute('href', `/quest/${card.link}`);
    cardLink.classList.add('quest-card__title', 'text_h3', 'text_gabriela');
    cardLink.innerText = card.title;

    cardText.classList.add('quest-card__description', 'text_p', 'text_gabriela');
    cardText.innerText = card.description;

    cardContent.appendChild(cardLink);
    cardContent.appendChild(cardText);
    cardContent.appendChild(cardTags);

    card.tags.forEach(tag => {
        const tagLink = document.createElement('span');

        tagLink.onclick = changePage(`/filter?filterTag=${tag.link}`, pageType.filter, tag.link);
        tagLink.classList.add('quest-card__tag', 'text_p', 'text_roboto-light');
        tagLink.innerText = tag.title;
        cardTags.appendChild(tagLink);
    });

    if (index === cards.length - 1) {
        cardWrapper.setAttribute('id', 'last');
    }

    pageWrapper[0].appendChild(cardWrapper);
}

async function getFilteredCards(tag) {
    const res = await request(`${backendEndPoint}/api/cards?filterTag=${tag}`);

    if (!res.cards) {
        return;
    }

    const wrpper = document.getElementsByClassName('wrapper');
    const title = document.createElement('h2');

    title.innerText = res.filterTag;
    title.classList.add('text_h2', 'text_gabriela');

    wrpper[0].appendChild(title);
    res.cards.forEach(renderCard);
}

async function getCards() {
    const res = await request(`${backendEndPoint}/api/cards?offset=${offset}&limit=${limit}`);

    if (!res.cards) {
        return;
    }

    offset += limit;

    res.cards.forEach(renderCard);
    boxElement = document.querySelector('#last');

    if (boxElement) {
        createObserver();
    }
}

function createObserver() {
    let observer;

    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0
    };

    observer = new IntersectionObserver(handleIntersect, options);
    observer.observe(boxElement);
}

function handleIntersect(entries, observer) {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            boxElement.removeAttribute('id');

            getCards();
            observer.unobserve(entry.target);
        }
    });
}

function render(event) {
    clearPage();
    if (event && event.state.type === pageType.filter) {
        getFilteredCards(event.state.tag);
        return;
    }

    if (window.location.pathname.includes('/filter')) {
        getFilteredCards(
            window.location.href
                .split('?')
                .find(item => item.includes('filterTag'))
                .split('=')[1]
        );
        return;
    }

    getCards();
}

function init(path, backend) {
    staticBasePath = path;
    backendEndPoint = backend;

    render();
}
