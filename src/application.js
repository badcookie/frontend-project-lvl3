import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';

import render from './view';
import parse from './parser';
import resources from './locales';
import {
  feedUpdateIntervalMs, formProcessStates, proxyAddress, formMessageTypes,
} from './consts';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

const {
  filling, sending, failed, finished,
} = formProcessStates;

const {
  network, success, urlRequired, parsing,
} = formMessageTypes;


const normalize = (url) => url.replace(/\/+$/, '');

const buildProxyUrl = (url) => `${proxyAddress}/${url}`;


yup.addMethod(yup.string, 'notAdded', function () {
  return this.test('notAdded', function (url) {
    const { path, createError, options } = this;
    const { context: { state } } = options;

    const normalizedUrl = normalize(url);
    const feedExists = state.feeds.find(({ link }) => link === normalizedUrl);
    return feedExists ? createError({ path }) : true;
  });
});

const schema = yup.object().shape({
  url: yup.string().required().url().notAdded(),
});


const validate = (state) => {
  const dataToValidate = { url: state.form.data };
  const validationContext = { context: { state } };

  schema.validate(dataToValidate, validationContext)
    .then(() => {
      state.form.messageType = '';
      state.form.isValid = true;
    })
    .catch((error) => {
      state.form.messageType = error.type;
      state.form.isValid = false;
    });
};


const checkForUpdates = (state) => () => {
  const { feeds, activeFeedId } = state;

  const tasks = feeds.map((feed) => {
    const proxyUrl = buildProxyUrl(feed.link);
    return axios.get(proxyUrl).then((response) => {
      const updatedFeed = parse(response.data);

      const newItems = updatedFeed.items
        .filter((item) => item.pubDate > feed.pubDate);

      if (newItems.length === 0) {
        return;
      }

      const newPosts = newItems.map(
        (item) => ({ ...item, id: _.uniqueId(), feedId: feed.id }),
      );

      state.posts = [...newPosts, ...state.posts];
      feed.pubDate = updatedFeed.pubDate;

      if (feed.id === activeFeedId) {
        state.shouldUpdateActiveFeed = true;
      }
    });
  });

  Promise.all(tasks).finally(() => {
    setTimeout(checkForUpdates(state), feedUpdateIntervalMs);
    state.shouldUpdateActiveFeed = false;
  });
};


export default () => {
  const state = {
    form: {
      data: '',
      isValid: false,
      messageType: urlRequired,
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

  state.elements.input.addEventListener('input', ({ target }) => {
    state.form.data = target.value;
    state.form.processState = filling;
    validate(state);
  });

  state.elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!state.form.isValid) {
      state.form.processState = failed;
      return;
    }

    state.form.processState = sending;

    const url = normalize(state.form.data);
    const proxyUrl = buildProxyUrl(url);

    axios.get(proxyUrl)
      .catch((error) => {
        const { response: { status, data } } = error;
        state.form.processState = failed;
        state.form.messageType = network;
        state.form.messageContext = { status, data };
        throw error;
      }).then((response) => parse(response.data))
      .catch((error) => {
        state.form.processState = failed;
        state.form.messageType = parsing;
        throw error;
      })
      .then((feedData) => {
        const { items, ...remainingFeedData } = feedData;

        const feed = { ...remainingFeedData, id: _.uniqueId(), link: url };
        const posts = items.map((item) => ({ ...item, id: _.uniqueId(), feedId: feed.id }));

        if (state.feeds.length === 0) {
          state.activeFeedId = feed.id;
        }

        state.feeds = [...state.feeds, feed];
        state.posts = [...state.posts, ...posts];

        state.form.processState = finished;
        state.form.messageType = success;
      });
  });

  render(state);

  i18next.init({ lng: 'en', resources });

  setTimeout(checkForUpdates(state), feedUpdateIntervalMs);
};
