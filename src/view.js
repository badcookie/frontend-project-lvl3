import i18next from 'i18next';
import { watch } from 'melanke-watchjs';


export default (state) => {
  watch(state.form, 'processState', () => {
    const { form: { processState } } = state;

    const submitButton = document.querySelector('button');
    const inputField = document.querySelector('input');
    const formContainer = document.querySelector('.jumbotron');

    const existingFeedback = formContainer.querySelector('.feedback');
    if (existingFeedback) {
      formContainer.removeChild(existingFeedback);
    }

    switch (processState) {
      case 'filling': {
        break;
      }
      case 'sending': {
        submitButton.disabled = true;
        break;
      }
      case 'failed': {
        const { form: { messageType, messageContext } } = state;
        const infoMessage = i18next.t(`messages.${messageType}`, messageContext);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-danger');
        feedbackElement.textContent = infoMessage;
        formContainer.appendChild(feedbackElement);
        inputField.style.borderColor = 'red';
        submitButton.disabled = false;
        submitButton.blur();
        break;
      }
      case 'finished': {
        const infoMessage = i18next.t(`messages.${state.form.messageType}`);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-success');
        feedbackElement.textContent = infoMessage;
        formContainer.appendChild(feedbackElement);
        inputField.value = '';
        inputField.style.removeProperty('border');
        submitButton.disabled = false;
        submitButton.blur();
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
