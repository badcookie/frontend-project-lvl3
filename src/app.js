import * as yup from 'yup';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

// TODO: i18n
const messages = {
  error: {
    network: 'Network error',
    linkAlreadyExists: 'Link was already added',
    invalidUrl: 'Link must be valid url',
  },
  success: 'RSS has been loaded',
};

yup.addMethod(yup.string, 'notAdded', function ({ message }) {
  return this.test('notAdded', message, function (link) {
    const { path, createError, options } = this;
    const { context: { state } } = options;
    return state.links.includes(link) ? createError({ path, message }) : true;
  });
});

const schema = yup.object().shape({
  url: yup.string()
    .required()
    .url({ message: messages.error.invalidUrl })
    .notAdded({ message: messages.error.linkAlreadyExists }),
});

const validate = (state) => {
  const dataToValidate = { url: state.form.data };
  const validationContext = { context: { state } };

  schema.validate(dataToValidate, validationContext)
    .then(() => {
      state.form.message = '';
      state.form.isValid = true;
    })
    .catch((error) => {
      state.form.message = error.message;
      state.form.isValid = false;
    });
};

export default () => {
  const state = {
    form: {
      data: '',
      message: '',
      isValid: true,
      processState: 'filling',
    },
    links: [],
  };

  const inputField = document.querySelector('input');
  inputField.addEventListener('input', ({ target }) => {
    state.form.data = target.value;
    validate(state);
  });

  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
};
