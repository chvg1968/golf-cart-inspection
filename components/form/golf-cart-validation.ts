import { 
  GolfCartFormData, 
  FormValidationErrors, 
  DamageRecord 
} from './golf-cart-types';

export const validateGolfCartForm = (data: GolfCartFormData): FormValidationErrors => {
  const errors: FormValidationErrors = {};

  if (!data.property) {
    errors.property = 'Property is required';
  }

  // Asegurar que cartNumber sea un número
  const cartNumber = typeof data.cartNumber === 'string'
    ? parseInt(data.cartNumber, 10)
    : data.cartNumber;

  if (!cartNumber) {
    errors.cartNumber = 'Cart number is required';
  } else if (isNaN(cartNumber)) {
    errors.cartNumber = 'Cart number must be a valid number';
  } else if (cartNumber <= 0) {
    errors.cartNumber = 'Cart number must be a positive number';
  } else if (cartNumber > 9999) {
    errors.cartNumber = 'Cart number cannot exceed 9999';
  }

  // Actualizar el valor de cartNumber en los datos originales
  (data.cartNumber as number) = cartNumber;

  if (!data.guestName) {
    errors.guestName = 'Guest name is required';
  }

  if (!data.guestEmail) {
    errors.guestEmail = 'Guest email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.guestEmail)) {
    errors.guestEmail = 'Invalid email format';
  }

  if (!data.inspectionDate) {
    errors.inspectionDate = 'Inspection date is required';
  }

  return errors;
};

export const hasFormErrors = (errors: FormValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
