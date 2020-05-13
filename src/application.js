import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import * as urljoin from 'url-join';

import parse from './parser';
import resources from './locales';
import { render, formProcessStates } from './view';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

const feedUpdateIntervalMs = 5 * 1000;

const proxyAddress = 'https://cors-anywhere.herokuapp.com';

const {
  filling, sending, failed, finished,
} = formProcessStates;

const formMessageTypes = {
  network: 'networkError',
  success: 'success',
  urlRequired: 'urlRequired',
  parsing: 'parsingError',
};

class XMLParsingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'XMLParsingError';
    this.message = message;
  }
}

const buildProxyUrl = (url) => urljoin(proxyAddress, url);

yup.addMethod(yup.string, 'notAdded', function () {
  return this.test('notAdded', function (url) {
    const { path, createError, options } = this;
    const { context: { state } } = options;
    const feedExists = state.feeds.find(({ link }) => link === url);
    return feedExists ? createError({ path }) : true;
  });
});

const schema = yup.object().shape({
  url: yup.string().required().url().notAdded(),
});

const validationErrorToMessageType = {
  url: 'invalidUrl',
  notAdded: 'urlAlreadyExists',
  required: 'urlRequired',
};


const updateValidationState = (state) => {
  const dataToValidate = { url: state.form.data };
  const validationContext = { context: { state } };

  schema.validate(dataToValidate, validationContext)
    .then(() => {
      state.form.messageType = '';
      state.form.processState = filling;
    })
    .catch((error) => {
      const messageType = validationErrorToMessageType[error.type];
      state.form.messageType = messageType;
      state.form.processState = failed;
    });
};

const updateFeed = (oldFeed, newFeed, state) => {
  state.shouldUpdateActiveFeed = false;

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
};

const checkForFeedsUpdates = (state) => () => {
  const { feeds } = state;

  const tasks = feeds.map((oldFeed) => {
    const proxyUrl = buildProxyUrl(oldFeed.link);
    return axios.get(proxyUrl).then((response) => {
      const newFeed = parse(response.data);
      updateFeed(oldFeed, newFeed, state);
    });
  });

  Promise.all(tasks).finally(
    () => setTimeout(checkForFeedsUpdates(state), feedUpdateIntervalMs),
  );
};

const handleSubmitError = (error, state) => {
  state.form.processState = failed;

  if (error instanceof XMLParsingError) {
    state.form.messageType = formMessageTypes.parsing;
    state.form.messageContext = { data: error.message };
  } else {
    const { status, data } = error.response;
    state.form.messageType = formMessageTypes.network;
    state.form.messageContext = { status, data };
  }

  throw error;
};

const saveFeedAndPosts = (parsedFeed, feedUrl, state) => {
  const { items, ...remainingFeedData } = parsedFeed;

  const feed = { ...remainingFeedData, id: _.uniqueId(), link: feedUrl };
  const posts = items.map(
    (item) => ({ ...item, id: _.uniqueId(), feedId: feed.id }),
  );

  if (state.feeds.length === 0) {
    state.activeFeedId = feed.id;
  }

  state.feeds.push(feed);
  state.posts.push(...posts);

  state.form.processState = finished;
  state.form.messageType = formMessageTypes.success;
};

const fetchFeed = (url, state) => {
  state.form.processState = sending;
  return axios.get(url).then((response) => {
    try {
      return parse(response.data);
    } catch (error) {
      throw new XMLParsingError(error.message);
    }
  });
};

const handleSubmit = (state) => (event) => {
  event.preventDefault();

  const url = state.form.data;
  const proxyUrl = buildProxyUrl(state.form.data);

  fetchFeed(proxyUrl, state)
    .then((parsedFeed) => saveFeedAndPosts(parsedFeed, url, state))
    .catch((error) => handleSubmitError(error, state));
};

const handleInput = (state) => ({ target }) => {
  state.form.data = target.value;
  state.form.processState = filling;
  updateValidationState(state);
};

export default () => {
  const state = {
    form: {
      data: '',
      messageType: formMessageTypes.urlRequired,
      messageContext: {},
      processState: filling,
    },
    feeds: [],
    posts: [],
    activeFeedId: null,
    shouldUpdateActiveFeed: false,
    elements: {
      input: document.querySelector('input'),
      form: document.querySelector('form'),
      submit: document.querySelector('button'),
      formContainer: document.querySelector('.jumbotron'),
      feeds: document.querySelector('.rss-feeds'),
      posts: document.querySelector('.rss-posts'),
    },
  };

  const { elements: { input, form } } = state;
  input.addEventListener('input', handleInput(state));
  form.addEventListener('submit', handleSubmit(state));

  render(state);
  i18next.init({ lng: 'en', resources });
  setTimeout(checkForFeedsUpdates(state), feedUpdateIntervalMs);
};
