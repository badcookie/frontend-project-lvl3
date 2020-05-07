import i18next from 'i18next';
import { watch } from 'melanke-watchjs';

/* eslint no-param-reassign: ["error", { "props": false }] */

export const formProcessStates = {
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
};

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
    const { form: { processState }, elements } = state;
    const { formContainer, submit, input } = elements;

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
        const { form: { messageType, messageContext } } = state;
        const formMessage = i18next.t(`messages.${messageType}`, messageContext);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-danger');
        feedbackElement.textContent = formMessage;
        formContainer.appendChild(feedbackElement);

        input.style.borderColor = 'red';
        submit.disabled = true;
        submit.blur();
        break;
      }
      case formProcessStates.finished: {
        const formMessage = i18next.t(`messages.${state.form.messageType}`);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-success');
        feedbackElement.textContent = formMessage;
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
