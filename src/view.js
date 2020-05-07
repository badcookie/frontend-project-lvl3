import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

/* eslint no-param-reassign: ["error", { "props": false }] */

export const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

export const elements = {
  input: document.querySelector('input'),
  form: document.querySelector('form'),
  submit: document.querySelector('button'),
  formContainer: document.querySelector('.jumbotron'),
  feeds: document.querySelector('.rss-feeds'),
  posts: document.querySelector('.rss-posts'),
};

const renderFeeds = (state, feedsElement) => {
  feedsElement.innerHTML = '';

  const feedsList = document.createElement('ul');

  state.feeds.forEach((feed) => {
    const feedItem = document.createElement('li');
    const feedContainer = document.createElement('div');

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = feed.description;
    descriptionElement.style.fontSize = '14px';

    const titleTag = feed.id === state.activeFeedId ? 'b' : 'a';
    const titleElement = document.createElement(titleTag);
    titleElement.textContent = feed.title;

    if (feed.id !== state.activeFeedId) {
      titleElement.href = '#';
      titleElement.addEventListener('click', (event) => {
        event.preventDefault();
        state.activeFeedId = feed.id;
      });
    }

    feedContainer.appendChild(titleElement);
    feedContainer.appendChild(descriptionElement);

    feedItem.appendChild(feedContainer);
    feedsList.appendChild(feedItem);
  });

  feedsElement.appendChild(feedsList);
};

const renderPosts = (state, postsElement) => {
  postsElement.innerHTML = '';

  const activePosts = state.posts.filter(
    ({ feedId }) => feedId === state.activeFeedId,
  );

  activePosts.forEach(({ link, title }) => {
    const postContainer = document.createElement('div');

    const linkElement = document.createElement('a');
    linkElement.href = link;
    linkElement.textContent = title;
    const br = document.createElement('br');

    postContainer.appendChild(linkElement);
    postContainer.appendChild(br);

    postsElement.appendChild(postContainer);
  });
};

const renderFailureMessage = (state, formElements) => {
  const { formContainer, submit, input } = formElements;
  const { form: { messageType, messageContext } } = state;

  const formMessage = i18next.t(`messages.${messageType}`, messageContext);
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('feedback', 'text-danger');
  feedbackElement.textContent = formMessage;
  formContainer.appendChild(feedbackElement);

  input.style.borderColor = 'red';
  submit.disabled = true;
  submit.blur();
};

const renderSuccessMessage = (state, formElements) => {
  const { formContainer, submit, input } = formElements;

  const formMessage = i18next.t(`messages.${state.form.messageType}`);
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('feedback', 'text-success');
  feedbackElement.textContent = formMessage;
  formContainer.appendChild(feedbackElement);

  input.value = '';
  input.style.removeProperty('border');
  submit.blur();
};


export const render = (state) => {
  watch(state, 'shouldUpdateActiveFeed', () => {
    if (state.shouldUpdateActiveFeed) {
      renderPosts(state, elements.posts);
    }
  });

  watch(state, 'activeFeedId', () => {
    const { posts, feeds } = elements;
    renderFeeds(state, feeds);
    renderPosts(state, posts);
  });

  watch(state.form, 'processState', () => {
    const { form: { processState } } = state;
    const {
      formContainer, submit, feeds, posts,
    } = elements;

    const existingFeedback = formContainer.querySelector('.feedback');
    if (existingFeedback) {
      formContainer.removeChild(existingFeedback);
    }

    switch (processState) {
      case formProcessStates.filling: {
        submit.disabled = false;
        break;
      }
      case formProcessStates.sending: {
        submit.disabled = true;
        break;
      }
      case formProcessStates.failed: {
        renderFailureMessage(state, elements);
        break;
      }
      case formProcessStates.finished: {
        renderSuccessMessage(state, elements);
        renderFeeds(state, feeds);
        renderPosts(state, posts);
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
