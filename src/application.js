/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import urljoin from 'url-join';

import parse from './parser';
import resources from './locales';
import { render, formProcessStates } from './view';

const feedUpdateIntervalMs = 5 * 1000;

const proxyAddress = 'https://cors-anywhere.herokuapp.com';

const formMessageTypes = {
  url: 'invalidUrl',
  required: 'urlRequired',
  notOneOf: 'urlAlreadyExists',
  network: 'networkError',
  success: 'success',
  parsing: 'parsingError',
};

const buildProxyUrl = (url) => urljoin(proxyAddress, url);

const checkForFeedsUpdates = (state) => () => {
  const { feeds } = state;

  const tasks = feeds.map((oldFeed) => {
    const proxyUrl = buildProxyUrl(oldFeed.link);
    return axios.get(proxyUrl).then((response) => {
      const newFeed = parse(response.data);

      const newItems = _.differenceBy(
        newFeed.items, [oldFeed],
        (item) => item.pubDate > oldFeed.pubDate,
      );

      if (newItems.length === 0) {
        return;
      }

      const newPosts = newItems.map(
        (item) => ({ ...item, id: _.uniqueId(), feedId: oldFeed.id }),
      );

      state.posts.unshift(...newPosts);
      oldFeed.pubDate = newFeed.pubDate;

      if (oldFeed.id === state.activeFeedId) {
        state.shouldUpdateActiveFeed = true;
      }
    });
  });

  Promise.all(tasks).finally(
    () => {
      state.shouldUpdateActiveFeed = false;
      setTimeout(checkForFeedsUpdates(state), feedUpdateIntervalMs);
    },
  );
};

const handleInput = (state) => ({ target }) => {
  state.form.data = target.value;
  state.form.processState = formProcessStates.filling;

  const addedFeeds = state.feeds.map(({ link }) => link);
  const schema = yup.string().required().url().notOneOf(addedFeeds);

  schema.validate(state.form.data)
    .then(() => {
      state.form.messageType = '';
      state.form.processState = formProcessStates.filling;
    })
    .catch((error) => {
      state.form.messageType = formMessageTypes[error.type];
      state.form.processState = formProcessStates.failed;
    });
};

const handleSubmit = (state) => (event) => {
  event.preventDefault();

  const url = state.form.data;
  const proxyUrl = buildProxyUrl(url);

  state.form.processState = formProcessStates.sending;

  return axios.get(proxyUrl)
    .then((response) => {
      const parsedFeed = parse(response.data);
      const { items, ...remainingFeedData } = parsedFeed;

      const feed = { ...remainingFeedData, id: _.uniqueId(), link: url };
      const posts = items.map(
        (item) => ({ ...item, id: _.uniqueId(), feedId: feed.id }),
      );

      if (state.feeds.length === 0) {
        state.activeFeedId = feed.id;
      }

      state.feeds.push(feed);
      state.posts.push(...posts);

      state.form.processState = formProcessStates.finished;
      state.form.messageType = formMessageTypes.success;
    })
    .catch((error) => {
      state.form.processState = formProcessStates.failed;

      const { response } = error;
      if (response) {
        const { status, data } = response;
        state.form.messageType = formMessageTypes.network;
        state.form.messageContext = { status, data };
      } else {
        state.form.messageType = formMessageTypes.parsing;
        state.form.messageContext = { data: error.message };
      }

      throw error;
    });
};

export default () => {
  const state = {
    form: {
      data: '',
      messageType: formMessageTypes.urlRequired,
      messageContext: {},
      processState: formProcessStates.filling,
    },
    feeds: [],
    posts: [],
    activeFeedId: null,
    shouldUpdateActiveFeed: false,
    elementsSelectors: {
      input: 'input',
      form: 'form',
      submit: 'button',
      formContainer: '.jumbotron',
      feeds: '.rss-feeds',
      posts: '.rss-posts',
    },
  };

  const { elementsSelectors: { input, form } } = state;

  const inputElement = document.querySelector(input);
  const formElement = document.querySelector(form);

  inputElement.addEventListener('input', handleInput(state));
  formElement.addEventListener('submit', handleSubmit(state));

  render(state);
  i18next.init({ lng: 'en', resources });
  setTimeout(checkForFeedsUpdates(state), feedUpdateIntervalMs);
};
