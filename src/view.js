import i18next from 'i18next';
import { watch } from 'melanke-watchjs';


export default (state) => {
  watch(state.form, 'processState', () => {
    const { form: { processState }, elements } = state;
    const { formContainer, submit, input } = elements;

    const existingFeedback = formContainer.querySelector('.feedback');
    if (existingFeedback) {
      formContainer.removeChild(existingFeedback);
    }

    switch (processState) {
      case 'filling': {
        break;
      }
      case 'sending': {
        submit.disabled = true;
        break;
      }
      case 'failed': {
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
      case 'finished': {
        const infoMessage = i18next.t(`messages.${state.form.messageType}`);
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-success');
        feedbackElement.textContent = infoMessage;
        formContainer.appendChild(feedbackElement);
        input.value = '';
        input.style.removeProperty('border');
        submit.disabled = false;
        submit.blur();
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }
  });
};
