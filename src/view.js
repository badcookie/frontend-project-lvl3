/* eslint no-param-reassign: ["error", { "props": false }] */

import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

export const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

const renderFeeds = (state) => {
  const { elementsSelectors: { feeds } } = state;
  const feedsElement = document.querySelector(feeds);
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

const renderPosts = (state) => {
  const { elementsSelectors: { posts } } = state;
  const postsElement = document.querySelector(posts);
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

const renderFailureMessage = (state) => {
  const { formContainer, submit, input } = state.elementsSelectors;
  const formContainerElement = document.querySelector(formContainer);
  const submitElement = document.querySelector(submit);
  const inputElement = document.querySelector(input);

  const { form: { messageType, messageContext } } = state;

  const formMessage = i18next.t(`messages.${messageType}`, messageContext);
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('feedback', 'text-danger');
  feedbackElement.textContent = formMessage;
  formContainerElement.appendChild(feedbackElement);

  inputElement.style.borderColor = 'red';
  submitElement.disabled = true;
  submitElement.blur();
};

const renderSuccessMessage = (state) => {
  const { formContainer, submit, input } = state.elementsSelectors;
  const formContainerElement = document.querySelector(formContainer);
  const submitElement = document.querySelector(submit);
  const inputElement = document.querySelector(input);

  const formMessage = i18next.t(`messages.${state.form.messageType}`);
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('feedback', 'text-success');
  feedbackElement.textContent = formMessage;
  formContainerElement.appendChild(feedbackElement);

  inputElement.value = '';
  inputElement.style.removeProperty('border');
  submitElement.blur();
};


export const render = (state) => {
  watch(state, 'shouldUpdateActiveFeed', () => {
    if (state.shouldUpdateActiveFeed) {
      renderPosts(state);
    }
  });

  watch(state, 'activeFeedId', () => {
    renderFeeds(state);
    renderPosts(state);
  });

  watch(state.form, 'processState', () => {
    const { form: { processState }, elementsSelectors } = state;
    const { formContainer, submit, input } = elementsSelectors;

    const formContainerElement = document.querySelector(formContainer);
    const existingFeedback = formContainerElement.querySelector('.feedback');
    if (existingFeedback) {
      formContainerElement.removeChild(existingFeedback);
    }

    switch (processState) {
      case formProcessStates.filling: {
        const inputElement = document.querySelector(input);
        const submitElement = document.querySelector(submit);
        inputElement.style.removeProperty('border');
        submitElement.disabled = false;
        break;
      }
      case formProcessStates.sending: {
        const submitElement = document.querySelector(submit);
        submitElement.disabled = true;
        break;
      }
      case formProcessStates.failed: {
        renderFailureMessage(state);
        break;
      }
      case formProcessStates.finished: {
        renderSuccessMessage(state);
        renderFeeds(state);
        renderPosts(state);
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
