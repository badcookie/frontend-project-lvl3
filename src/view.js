import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

import { formProcessStates } from './consts';

/* eslint no-param-reassign: ["error", { "props": false }] */

const {
  filling, sending, failed, finished,
} = formProcessStates;

const renderFeeds = (state) => {
  const { elements: { feeds } } = state;
  feeds.innerHTML = '';

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

  feeds.appendChild(feedsList);
};

const renderPosts = (state) => {
  const { elements: { posts } } = state;
  posts.innerHTML = '';

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

    posts.appendChild(postContainer);
  });
};

export default (state) => {
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
    const { form: { processState }, elements } = state;
    const { formContainer, submit, input } = elements;

    const existingFeedback = formContainer.querySelector('.feedback');
    if (existingFeedback) {
      formContainer.removeChild(existingFeedback);
    }

    switch (processState) {
      case filling: {
        submit.disabled = false;
        break;
      }
      case sending: {
        submit.disabled = true;
        break;
      }
      case failed: {
        const { form: { messageType, messageContext } } = state;
        const infoMessage = i18next.t(`messages.${messageType}`, messageContext);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-danger');
        feedbackElement.textContent = infoMessage;
        formContainer.appendChild(feedbackElement);

        input.style.borderColor = 'red';
        submit.disabled = true;
        submit.blur();
        break;
      }
      case finished: {
        const infoMessage = i18next.t(`messages.${state.form.messageType}`);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-success');
        feedbackElement.textContent = infoMessage;
        formContainer.appendChild(feedbackElement);

        input.value = '';
        input.style.removeProperty('border');
        submit.blur();

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
