export enum ValidationType {
  REQUIRED,
  MIN,
  MAX,
  TRUE,
  NAMEVALIDATE,
}

interface ValidationTypeMinProps {
  min: number
}

interface ValidationTypeMaxProps {
  max: number
}

type ValidatorProps = ValidationTypeMinProps | ValidationTypeMaxProps

export type Validator = ValidatorInterface<ValidatorProps>

export interface ValidatorInterface<ValidatorTypes> {
  validatorType: ValidationType
  message: string
  props?: ValidatorProps
}

export interface ValidationResponse {
  valid: boolean
  errors: Validator[]
}

export const validate = (value: unknown, validators: Validator[]): ValidationResponse => {
  const response: ValidationResponse = {
    valid: true,
    errors: [],
  }
  const namePattern = /^[a-zA-Z0-9-]+$/
  validators.forEach((validator: Validator) => {
    switch (validator.validatorType) {
      case ValidationType.REQUIRED:
        if (value === undefined || value === null || value.trim() === '') {
          response.errors.push(validator)
          response.valid = false
        }
        break
      case ValidationType.MIN:
        if (typeof value === 'number' && validator.props && 'min' in validator.props) {
          if (value < validator.props.min) {
            response.errors.push(validator)
            response.valid = false
          }
        }
        break
      case ValidationType.MAX:
        if (typeof value === 'number' && validator.props && 'max' in validator.props) {
          if (value > validator.props.max) {
            response.errors.push(validator)
            response.valid = false
          }
        }
        break
      case ValidationType.NAMEVALIDATE:
        if (typeof value === 'string') {
          if (!namePattern.test(value)) {
            response.errors.push(validator)
            response.valid = false
          }
        }
        break
      default:
        // Handle unexpected validator types
        response.errors.push(validator)
        response.valid = false
        break
    }
  })
  return response
}

export const validateFormFields = (
  formValues: { [key: string]: unknown },
  formValidators: { [key: string]: Validator[] },
): { [key: string]: ValidationResponse } => {
  const validationResults: { [key: string]: ValidationResponse } = {}

  Object.keys(formValues).forEach(function (key) {
    if (formValidators[key]) {
      validationResults[key] = validate(formValues[key], formValidators[key])
    }
  })

  return validationResults
}
