export interface FieldValidationError {
  message: string;
  field: string;
}

function someFunction(type: string, messages: string | string[]): number {
  console.log(type, messages);
  return 0;
}

const fieldValidationErrors: FieldValidationError[] = [
  { message: 'Enter Repository Name ', field: 'github_repo' },
  { message: 'Enter Repository Description', field: 'repo_description' }
];

const errorMessages: string[] = fieldValidationErrors.map(error => error.message);

someFunction('validationError', errorMessages);