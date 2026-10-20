const MAX_LENGTH = 140;
const MAX_EDIT_LENGTH = 100;

function checkInput(text, isEdit) {
  const limit = isEdit ? MAX_EDIT_LENGTH : MAX_LENGTH;
  if (!text || text.trim().length === 0) {
    return 'Task description cannot be empty.';
  }
  if (text.trim().length > limit) {
    return 'Task description must be ' + limit + ' characters or fewer.';
  }
  return '';
}

const isPriority = (val) => {
  return val === 'low' || val === 'medium' || val === 'high';
};
