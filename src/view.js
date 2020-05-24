/* eslint no-param-reassign: ["error", { "props": false }] */

import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

export const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
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
  const { formContainerElement, submitElement, inputElement } = formElements;
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

const renderSuccessMessage = (state, formElements) => {
  const { formContainerElement, submitElement, inputElement } = formElements;

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
    const { elementsSelectors: { posts }, shouldUpdateActiveFeed } = state;
    const postsElement = document.querySelector(posts);

    if (shouldUpdateActiveFeed) {
      renderPosts(state, postsElement);
    }
  });

  watch(state, 'activeFeedId', () => {
    const { elementsSelectors: { posts, feeds } } = state;
    const postsElement = document.querySelector(posts);
    const feedsElement = document.querySelector(feeds);

    renderFeeds(state, feedsElement);
    renderPosts(state, postsElement);
  });

  watch(state.form, 'processState', () => {
    const { form: { processState }, elementsSelectors } = state;
    const {
      formContainer, submit, feeds, posts, input,
    } = elementsSelectors;

    const postsElement = document.querySelector(posts);
    const feedsElement = document.querySelector(feeds);
    const inputElement = document.querySelector(input);
    const submitElement = document.querySelector(submit);
    const formContainerElement = document.querySelector(formContainer);

    const existingFeedback = formContainerElement.querySelector('.feedback');
    if (existingFeedback) {
      formContainerElement.removeChild(existingFeedback);
    }

    switch (processState) {
      case formProcessStates.filling: {
        inputElement.style.removeProperty('border');
        submitElement.disabled = false;
        break;
      }
      case formProcessStates.sending: {
        submitElement.disabled = true;
        break;
      }
      case formProcessStates.failed: {
        const formElements = { inputElement, submitElement, formContainerElement };
        renderFailureMessage(state, formElements);
        break;
      }
      case formProcessStates.finished: {
        const formElements = { inputElement, submitElement, formContainerElement };
        renderSuccessMessage(state, formElements);
        renderFeeds(state, feedsElement);
        renderPosts(state, postsElement);
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
