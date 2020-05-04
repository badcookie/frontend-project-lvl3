import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

import { formProcessStates } from './consts';

/* eslint no-param-reassign: ["error", { "props": false }] */

const {
  filling, sending, failed, finished,
} = formProcessStates;

const showRSSFeeds = (state) => {
  const { activeFeedId } = state;
  const { elements: { feeds, posts } } = state;

  feeds.innerHTML = '';
  posts.innerHTML = '';

  const feedsList = document.createElement('ul');

  state.feeds.forEach((feed) => {
    const { title, description, id } = feed;

    const feedItem = document.createElement('li');
    const feedContainer = document.createElement('div');

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = description;
    descriptionElement.style.fontSize = '14px';

    if (id !== activeFeedId) {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = title;
      feedContainer.appendChild(link);

      link.addEventListener('click', (event) => {
        event.preventDefault();
        state.activeFeedId = feed.id;
      });
    } else {
      const titleElement = document.createElement('b');
      titleElement.textContent = title;
      feedContainer.appendChild(titleElement);
    }

    feedContainer.appendChild(descriptionElement);
    feedItem.appendChild(feedContainer);
    feedsList.appendChild(feedItem);
  });
  feeds.appendChild(feedsList);

  const activePosts = state.posts.filter(({ feedId }) => feedId === activeFeedId);
  activePosts.forEach((post) => {
    const { link, title } = post;

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
    showRSSFeeds(state);
  });

  watch(state, 'activeFeedId', () => {
    showRSSFeeds(state);
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
        submit.disabled = false;
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
        submit.disabled = false;
        submit.blur();

        showRSSFeeds(state);
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
