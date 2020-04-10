let staticBasePath;
let backendEndPoint;
const limit = 5;
let offset = 0;

const pageType = {
    filter: 'filter',
    main: 'main'
};

let boxElement;

const pageWrapper = document.querySelector('.wrapper');

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

function createElement(type, params) {
    const element = document.createElement(type);

    if (params.classList) {
        element.classList.add(...params.classList);
    }

    if (params.innerHTML) {
        element.innerHTML = params.innerHTML;
    }

    if (params.innerText) {
        element.innerText = params.innerText;
    }

    if (params.children) {
        params.children.forEach(item => element.appendChild(item));
    }

    if (params.attributes) {
        params.attributes
            .forEach(attribute => element.setAttribute(attribute.name, attribute.value));
    }

    if (params.eventListeners) {
        params.eventListeners.forEach(listener => { element.addEventListener(listener.name, listener.action); });
    }

    return element;
}

function request(address) {
    return fetch(address)
        .then(res => res.json())
        .catch(renderError);
}

function clearPage() {
    pageWrapper.innerHTML = '';
}

function renderError(err) {
    clearPage();
    const errCode = createElement('h1', {
        classList: ['error__code', 'text_roboto', 'text_pink'],
        innerText: err.status
    });
    const errText = createElement('h3', {
        classList: ['text_h3', 'text_roboto-light'],
        innerText: err
    });
    const errWrapper = createElement('div', {
        classList: 'error_wrapper',
        children: [errCode, errText]
    });

    pageWrapper.appendChild(errWrapper);
}

function changePage(address, type, tag) {
    return () => { window.history.pushState({ type, tag }, 'Filters', address); };
}

function renderCard(card, index, cards) {
    const cardImage = createElement('img', {
        attributes: [{ name: 'src', value: `${staticBasePath}${card.imageAddress}` }],
        classList: ['quest-card__image']
    });
    const cardLink = createElement('a', {
        attributes: [{ name: 'href', value: `/quest/${card.link}` }],
        classList: ['quest-card__title', 'text_h3', 'text_gabriela'],
        innerText: card.title
    });
    const cardText = createElement('p', {
        classList: ['quest-card__description', 'text_p', 'text_gabriela'],
        innerText: card.description
    });
    const cardTags = createElement('div', {
        children: card.tags.map(tag => createElement('span', {
            eventListeners: [{
                name: 'click',
                action: changePage(`/filter?filterTag=${tag.link}`, pageType.filter, tag.link)
            }],
            classList: ['quest-card__tag', 'text_p', 'text_roboto-light'],
            innerText: tag.title
        }))
    });
    const cardContent = createElement('div', {
        classList: ['quest-card__content'],
        children: [cardLink, cardText, cardTags]
    });

    const cardWrapperAttributes = [];

    if (index === cards.length - 1) {
        cardWrapperAttributes.push({ name: 'id', value: 'last' });
    }

    const cardWrapper = createElement('div', {
        classList: ['quest-card__wrapper'],
        children: [cardImage, cardContent],
        attributes: cardWrapperAttributes
    });

    pageWrapper.appendChild(cardWrapper);
}

async function getFilteredCards(tag) {
    const res = await request(`${backendEndPoint}/api/cards?filterTag=${tag}`);

    if (!res.cards) {
        return;
    }

    const title = createElement('h2', {
        innerText: res.filterTag,
        classList: ['text_h2', 'text_gabriela']
    });

    pageWrapper.appendChild(title);
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
